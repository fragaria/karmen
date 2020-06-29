import re
import random
import string
import uuid as guid
import requests
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user
from server import app, __version__
from server.database import network_clients, printers
from server import clients, executor
from server.services import network, printer_tokens
from . import jwt_force_password_change, validate_org_access, validate_uuid
from server.clients.utils import PrinterClientException


def make_printer_response(printer, fields):
    if not isinstance(printer, clients.utils.PrinterClient):
        network_client = network_clients.get_network_client(
            printer["network_client_uuid"]
        )
        printer_data = dict(network_client)
        printer_data.update(dict(printer))
        printer_inst = clients.get_printer_instance(printer_data)
    else:
        printer_inst = printer
    data = {
        "uuid": printer_inst.uuid,
        "client": {
            "name": printer_inst.client_name(),
            "version": printer_inst.client_info.version,
            "connected": bool(printer_inst.client_info.connected),
            "access_level": printer_inst.client_info.access_level,
            "api_key": printer_inst.client_info.api_key[0:2]
            + "*" * 30  # Add star padding to 32 characters
            if printer_inst.client_info.api_key
            else None,
            "plugins": printer_inst.client_info.plugins,
            "pill_info": printer_inst.client_info.pill_info,
        },
        "printer_props": printer_inst.get_printer_props(),
        "name": printer_inst.name,
        "protocol": printer_inst.protocol,
        "token": printer_inst.token[0:2] + "*" * 30  # Add star padding to 32 characters
        if printer_inst.token
        else None,
        "hostname": printer_inst.hostname,
        "ip": printer_inst.ip,
        "port": printer_inst.port,
        "path": printer_inst.path,
    }

    if "status" in fields:
        data["status"] = printer_inst.status()
    if "webcam" in fields:
        webcam_data = printer_inst.client_info.webcam or {}
        data["webcam"] = {
            "url": "/organizations/%s/printers/%s/webcam-snapshot"
            % (printer_inst.organization_uuid, printer_inst.uuid),
            "flipHorizontal": webcam_data.get("flipHorizontal"),
            "flipVertical": webcam_data.get("flipVertical"),
            "rotate90": webcam_data.get("rotate90"),
        }
    if "job" in fields:
        data["job"] = printer_inst.job()
    if "lights" in fields:
        try:
            data["lights"] = "on" if printer_inst.are_lights_on() else "off"
        except PrinterClientException:
            data["lights"] = "unavailable"
    return data


def get_printer_inst(org_uuid, uuid):
    validate_uuid(uuid)
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    network_client = network_clients.get_network_client(printer["network_client_uuid"])
    printer_data = dict(network_client)
    printer_data.update(dict(printer))
    printer_inst = clients.get_printer_instance(printer_data)
    return printer_inst


# /organizations/<org_uuid>/printers, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printers_list(org_uuid):
    device_list = []
    fields = [f for f in request.args.get("fields", "").split(",") if f]
    futures = []

    def reqid():
        letters = string.ascii_lowercase
        return "".join(random.choice(letters) for i in range(10))

    uqid = reqid()
    printers_set = printers.get_printers(organization_uuid=org_uuid)
    network_clients_mapping = {
        nc["uuid"]: nc
        for nc in network_clients.get_network_clients_by_uuids(
            [p["network_client_uuid"] for p in printers_set]
        )
    }
    for printer in printers.get_printers(organization_uuid=org_uuid):
        try:
            network_client = network_clients_mapping.get(printer["network_client_uuid"])
            if network_client is None:
                # This is a race condition handling, there should always be a network_client for every printer
                continue
            printer_data = dict(network_client)
            printer_data.update(dict(printer))
            futures.append(
                executor.submit_stored(
                    "%s:%s" % (uqid, printer["uuid"]),
                    make_printer_response,
                    printer_data,
                    fields,
                )
            )
        # This means that the future already exists and has not been popped yet -
        # that's a race condition right there. It shouldn't happen as each request is identified by uqid though
        except ValueError as e:
            app.logger.error("Possible race condition in printer list: %s" % e)

    for future in futures:
        try:
            data = future.result()
        except Exception as e:
            app.logger.error("Error in resolving a printer list future: %s" % e)
        else:
            device_list.append(data)
            executor.futures.pop("%s:%s" % (uqid, data["uuid"]))

    return jsonify({"items": device_list}), 200


@app.route("/organizations/<org_uuid>/printers/issue-token", methods=["POST"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def issue_printer_token(org_uuid):
    """Issue a signed printer token using the key server."""
    user_uuid = get_current_user()["uuid"]
    issuer = printer_tokens.get_issuer()

    try:
        token = issuer.issue_token(user_uuid)
    except (
        printer_tokens.TokenIssuerResponseMalformed,
        printer_tokens.TokenIssuerUnavailable,
    ) as exc:
        app.logger.error("Trouble talking to the token issuer: %s" % exc)
        return abort(
            make_response(
                jsonify(
                    message="Token could not be issued due to a failure on the issuer server"
                ),
                503,
            )
        )

    return make_response(jsonify(token=token), 201)


# /organizations/<org_uuid>/printers/<printer_uuid>, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_detail(org_uuid, printer_uuid):
    fields = request.args.get("fields").split(",") if request.args.get("fields") else []
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    return jsonify(make_printer_response(printer_inst, fields))


# /organizations/<org_uuid>/printers, POST
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_create(org_uuid):
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    uuid = guid.uuid4()
    ip = data.get("ip", None)
    port = data.get("port", None)
    hostname = data.get("hostname", None)
    name = data.get("name", None)
    api_key = data.get("api_key", None)
    protocol = data.get("protocol", "http")
    path = data.get("path", "")
    token = data.get("token", None)

    if token is not None and token != "":
        if not app.config.get("CLOUD_MODE"):
            return abort(make_response(jsonify(message="Missing token"), 400))
        existing_network_client = network_clients.get_network_client_by_socket_token(
            token
        )
        if existing_network_client:
            existing_printer = printers.get_printer_by_network_client_uuid(
                org_uuid, existing_network_client.get("uuid")
            )
            if existing_printer is not None:
                return abort(make_response(jsonify(message="Printer exists"), 409))
        path = ""
        hostname = ""
        ip = ""
        protocol = ""
        port = 0
    else:
        if app.config.get("CLOUD_MODE"):
            return abort(
                make_response(
                    jsonify(message="Cannot add printer without a token in CLOUD_MODE"),
                    400,
                )
            )
        if (
            (not ip and not hostname)
            or not name
            or protocol not in ["http", "https"]
            or (hostname and re.match(r"^[0-9a-zA-Z.-]+\.local$", hostname) is None)
            or (ip and re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", ip) is None)
            or (port and re.match(r"^\d{0,5}$", str(port)) is None)
        ):
            return abort(
                make_response(
                    jsonify(message="Missing some network data about the printer"), 400
                )
            )

        if hostname and not ip:
            ip = network.get_avahi_address(hostname)
            if not ip:
                return abort(
                    make_response(
                        jsonify(message="Cannot resolve %s with mDNS" % hostname), 500
                    )
                )
        if ip and not hostname:
            hostname = network.get_avahi_hostname(ip)

        existing_network_client = network_clients.get_network_client_by_props(
            hostname, ip, port, path
        )
        if existing_network_client:
            existing_printer = printers.get_printer_by_network_client_uuid(
                org_uuid, existing_network_client.get("uuid")
            )
            if existing_printer is not None:
                return abort(make_response(jsonify(message="Printer exists"), 409))

    if not existing_network_client:
        existing_network_client = {
            "uuid": guid.uuid4(),
            "hostname": hostname,
            "client": "octoprint",  # TODO make this more generic
            "protocol": protocol,
            "ip": ip,
            "port": port,
            "path": path,
            "token": token,
        }
        network_clients.add_network_client(**existing_network_client)

    printer = clients.get_printer_instance(
        {
            "uuid": uuid,
            "network_client_uuid": existing_network_client["uuid"],
            "organization_uuid": org_uuid,
            "name": name,
            "client": existing_network_client["client"],
            "protocol": existing_network_client["protocol"],
            "hostname": existing_network_client["hostname"],
            "ip": existing_network_client["ip"],
            "port": existing_network_client["port"],
            "path": existing_network_client["path"],
            "token": existing_network_client["token"],
        }
    )
    printer.add_api_key(api_key)
    printer.update_network_base()
    printer.sniff()
    printers.add_printer(
        uuid=uuid,
        network_client_uuid=existing_network_client["uuid"],
        organization_uuid=org_uuid,
        name=name,
        client=printer.client_name(),
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.client_info.webcam,
            "plugins": printer.client_info.plugins,
        },
    )
    # TODO cache webcam, job, status for a small amount of time in this client
    return jsonify(make_printer_response(printer, ["status", "webcam", "job"])), 201


# /organizations/<org_uuid>/printers/<printer_uuid>, DELETE
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_delete(org_uuid, printer_uuid):
    validate_uuid(printer_uuid)
    printer = printers.get_printer(printer_uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response(jsonify(message="Not found"), 404))
    printers.delete_printer(printer_uuid)
    network_client_records = printers.get_printers_by_network_client_uuid(
        printer["network_client_uuid"]
    )
    if len(network_client_records) == 0:
        network_clients.delete_network_client(printer["network_client_uuid"])
    return "", 204


# /organizations/<org_uuid>/printers/<printer_uuid>, PATCH
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_patch(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    name = data.get("name", printer_inst.name)
    api_key = data.get("api_key", printer_inst.client_info.api_key)
    printer_props = data.get("printer_props", {})
    if not name:
        return abort(make_response(jsonify(message="Missing name"), 400))

    printer_inst.add_api_key(api_key)
    if (
        data.get("api_key", "-1") != "-1"
        and data.get("api_key", "-1") != printer_inst.client_info.api_key
    ):
        printer_inst.sniff()  # this can probably be offloaded to check_printer task
    if printer_props:
        if not printer_inst.get_printer_props():
            printer_inst.printer_props = {}
        # This is effectively the only place where printer_props "validation" happens
        printer_inst.get_printer_props().update(
            {
                k: printer_props[k]
                for k in [
                    "filament_type",
                    "filament_color",
                    "bed_type",
                    "tool0_diameter",
                    "note",
                ]
                if k in printer_props
            }
        )

    printer_inst.name = name
    printers.update_printer(
        uuid=printer_inst.uuid,
        name=printer_inst.name,
        client_props={
            "version": printer_inst.client_info.version,
            "connected": printer_inst.client_info.connected,
            "access_level": printer_inst.client_info.access_level,
            "api_key": printer_inst.client_info.api_key,
            "webcam": printer_inst.client_info.webcam,
            "plugins": printer_inst.client_info.plugins,
        },
        printer_props=printer_inst.get_printer_props(),
    )
    return (
        jsonify(make_printer_response(printer_inst, ["status", "webcam", "job"])),
        200,
    )


# /organizations/<org_uuid>/printers/<printer_uuid>/connection, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_change_connection(org_uuid, printer_uuid):
    # TODO this has to be streamlined, octoprint sometimes cannot handle two connect commands at once
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    state = data.get("state", None)
    if state == "online":
        r = printer_inst.connect_printer()
        return (
            ("", 204)
            if r
            else ("Cannot change printer's connection state to online", 500)
        )
    elif state == "offline":
        r = printer_inst.disconnect_printer()
        return (
            ("", 204)
            if r
            else ("Cannot change printer's connection state to offline", 500)
        )


# /organizations/<org_uuid>/printers/<printer_uuid>/current-job, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_modify_job(org_uuid, printer_uuid):
    # TODO allow users to pause/cancel only their own prints via printjob_id
    # And allow admins to pause/cancel anything
    # but that means creating a new tracking of current jobs on each printer
    # and does not handle prints issued by bypassing Karmen Hub
    # Alternative is to log who modified the current job into an admin-accessible eventlog
    # See https://trello.com/c/uiv0luZ8/142 for details
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    action = data.get("action", None)
    try:
        if printer_inst.modify_current_job(action):
            user = get_current_user()
            app.logger.info(
                "User %s successfully issued a modification (%s) of current job on printer %s",
                user["uuid"],
                action,
                printer_uuid,
            )
            return "", 204
        return abort(make_response(jsonify(message="Nothing is running"), 409))
    except clients.utils.PrinterClientException as e:
        app.logger.error(e)
        return abort(make_response(jsonify(message=str(e)), 400))


WEBCAM_MICROCACHE = {}
FUTURES_MICROCACHE = {}


def _get_webcam_snapshot(snapshot_url):
    try:
        req = requests.get(
            snapshot_url,
            timeout=app.config.get("NETWORK_TIMEOUT", 10),
            verify=app.config.get("NETWORK_VERIFY_CERTIFICATES", True),
        )
        if req is not None and req.status_code == 200:
            return req
        return False
    except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout,) as e:
        app.logger.debug("Cannot call %s because %s" % (snapshot_url, e))
        return False


# /organizations/<org_uuid>/printers/<printer_uuid>/webcam-snapshot, GET
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_webcam_snapshot(org_uuid, printer_uuid):
    """
    Instead of direct streaming from the end-devices, we are deferring
    the video-like feature to the clients. This (in case of MJPEG) brings
    significant performance gains throughout the whole pipeline.

    This endpoint serves as a redis-backed (due to multithreaded production setup
    with uwsgi) microcache of latest captured image from any
    given printer. New snapshot is requested, but the old one is served to
    the client. In case of the first request, a 202 is returned and the client
    should ask again. By asking periodically for new snapshots, the client
    can emulate a video-like experience. Since we have no sound, this should be
    fine.
    """
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    if printer_inst.client_info.webcam is None:
        return abort(make_response(jsonify(message="Not found"), 404))
    snapshot_url = printer_inst.client_info.webcam.get("snapshot")
    if snapshot_url is None:
        return abort(make_response(jsonify(message="Not found"), 404))

    # process current future if done
    if (
        FUTURES_MICROCACHE.get(printer_inst.network_client_uuid)
        and FUTURES_MICROCACHE.get(printer_inst.network_client_uuid).done()
    ):
        WEBCAM_MICROCACHE[printer_inst.network_client_uuid] = FUTURES_MICROCACHE[
            printer_inst.network_client_uuid
        ].result()
        try:
            del FUTURES_MICROCACHE[printer_inst.network_client_uuid]
        except Exception:
            # that's ok, probably a race condition
            pass
    # issue a new future if not present
    if not FUTURES_MICROCACHE.get(printer_inst.network_client_uuid):
        FUTURES_MICROCACHE[printer_inst.network_client_uuid] = executor.submit(
            _get_webcam_snapshot, snapshot_url
        )
    # FIXME: robin - remove module-wide microcache (not thread safe)
    response = WEBCAM_MICROCACHE.get(printer_inst.network_client_uuid)
    if response is not None and response is not False:
        return (
            response.content,
            200,
            {"Content-Type": response.headers.get("content-type", "image/jpeg")},
        )
    if response is not False:
        # There should be a future running, if the client retries, they should
        # eventually get a snapshot.
        # We don't want to end with an error here, so the clients keep retrying
        return "", 202
    return abort(make_response(jsonify(message="Not found"), 404))


# /organizations/<org_uuid>/printers/<printer_uuid>/lights, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_set_lights(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    try:
        # TODO do not only toggle
        lights_on = printer_inst.are_lights_on()
        r = printer_inst.set_lights(color="black" if lights_on else "white")
        if not r:
            return make_response(jsonify({"status": "unavailable"}), 500)
        # This is inverse because lights_on is BEFORE we actually change it
        return make_response(jsonify({"status": "off" if lights_on else "on"}), 200)
    except PrinterClientException as e:
        app.logger.error(e)
        return make_response(jsonify({"status": "unavailable"}), 200)


# /organizations/<org_uuid>/printers/<printer_uuid>/printhead, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def control_printhead(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if data is None or "command" not in data:
        return abort(make_response(jsonify(message="Missing payload or command"), 400))
    if data["command"] == "jog":
        movement = {}
        absolute = data.get("absolute", False)
        for axis in ["x", "y", "z"]:
            distance = data.get(axis)
            if distance:
                distance = float(distance)
                movement[axis] = distance
        r = printer_inst.move_head(movement, absolute)
        if not r:
            return make_response(jsonify(message="Cannot move printhead"), 500)
        return "", 204
    elif data["command"] == "home":
        axes = data.get("axes")
        if axes is None:
            return abort(make_response(jsonify(message="Missing axes"), 400))
        for axis in axes:
            if axis not in ["x", "y", "z"]:
                return abort(
                    make_response(
                        jsonify(message="%s is not a valid axes value" % axis), 400
                    )
                )
        r = printer_inst.home_head(axes)
        if not r:
            return make_response(jsonify(message="Cannot move printhead"), 500)
        return "", 204


# /organizations/<org_uuid>/printers/<printer_uuid>/fan, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def control_fan(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if data is None:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    target = data.get("target")
    r = printer_inst.set_fan(target)
    if not r:
        return abort(make_response(jsonify(message="Cannot control fan"), 500))
    return "", 204


# /organizations/<org_uuid>/printers/<printer_uuid>/motors, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def control_motors(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if data is None or "target" not in data:
        return abort(make_response(jsonify(message="Missing payload or target"), 400))
    target = data.get("target")
    r = printer_inst.motors_off()
    if not r:
        return make_response(jsonify(message="Cannot control motors"), 500)
    return "", 204


# /organizations/<org_uuid>/printers/<printer_uuid>/extrusion, POST
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def control_extrusion(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if data is None or "amount" not in data:
        return abort(make_response(jsonify(message="Missing payload or amount"), 400))
    try:
        amount = float(data.get("amount"))
    except ValueError:
        return abort(make_response(jsonify(message="Amount must be a number"), 400))
    r = printer_inst.extrude(amount)
    if not r:
        return make_response(jsonify(message="Cannot extrude"), 500)
    return "", 204


# @app.route(
#    "/organizations/<org_uuid>/printers/<printer_uuid>/temperatures/<part_name>",
#    methods=["POST"],
# )
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def control_tool_temperature(org_uuid, printer_uuid, part_name):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)
    data = request.json
    if data is None or "target" not in data:
        return abort(make_response(jsonify(message="Missing payload or target"), 400))
    target = float(data.get("target"))
    r = printer_inst.set_temperature(device=part_name, temp=target)
    if not r:
        return make_response(jsonify(message="Cannot set temperature"), 500)
    return "", 204


# @app.route(
#     "/organizations/<org_uuid>/printers/<printer_uuid>/update/", methods=["POST"],
# )
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def start_pill_update(org_uuid, printer_uuid):
    printer_inst = get_printer_inst(org_uuid, printer_uuid)

    if printer_inst.client_info.pill_info is None:
        return abort(
            make_response(
                jsonify(
                    message="The automatic update is supported on original Pill devices only."
                ),
                400,
            )
        )

    if not printer_inst.client_info.pill_info["update_available"]:
        return abort(
            make_response(
                jsonify(message="Update is not available for the device."), 400
            )
        )

    r = printer_inst.start_update()
    # FIXME: Error handling should be solved by standard Python error handling
    # (raise, except, finally).
    if r:
        return make_response("OK", 200)
    else:
        return make_response("Unable to start update", 500)
