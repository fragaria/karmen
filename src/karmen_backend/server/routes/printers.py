import re
import random
import string
import uuid as guid
import requests
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user
from server import app, __version__
from server.database import printers
from server import clients, executor
from server.services import network
from . import jwt_force_password_change, validate_org_access


def make_printer_response(printer, fields):
    if not isinstance(printer, clients.utils.PrinterClient):
        printer_inst = clients.get_printer_instance(printer)
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
        },
        "printer_props": printer_inst.get_printer_props(),
        "name": printer_inst.name,
        "protocol": printer_inst.protocol,
        "token": printer_inst.token,
    }
    if not app.config["IS_CLOUD_INSTALL"]:
        data["hostname"] = printer_inst.hostname
        data["ip"] = printer_inst.ip
        data["port"] = printer_inst.port
        data["path"] = printer_inst.path

    if "status" in fields:
        data["status"] = printer_inst.status()
    if "webcam" in fields:
        webcam_data = printer_inst.client_info.webcam or {}
        data["webcam"] = {
            "url": "/organizations/%s/printers/%s/webcam-snapshot"
            % (printer_inst.organization_uuid, printer_inst.uuid,),
            "flipHorizontal": webcam_data.get("flipHorizontal"),
            "flipVertical": webcam_data.get("flipVertical"),
            "rotate90": webcam_data.get("rotate90"),
        }
    if "job" in fields:
        data["job"] = printer_inst.job()
    return data


@app.route("/organizations/<org_uuid>/printers", methods=["GET"])
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
    for printer in printers.get_printers(organization_uuid=org_uuid):
        try:
            futures.append(
                executor.submit_stored(
                    "%s:%s" % (uqid, printer["uuid"]),
                    make_printer_response,
                    printer,
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


@app.route("/organizations/<org_uuid>/printers/<uuid>", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_detail(org_uuid, uuid):
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    fields = request.args.get("fields").split(",") if request.args.get("fields") else []
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    return jsonify(make_printer_response(printer, fields))


@app.route("/organizations/<org_uuid>/printers", methods=["POST"])
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_create(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    uuid = guid.uuid4()
    ip = data.get("ip", None)
    port = data.get("port", None)
    hostname = data.get("hostname", None)
    name = data.get("name", None)
    api_key = data.get("api_key", None)
    protocol = data.get("protocol", "http")
    path = data.get("path", "")
    token = data.get("path", None)

    # for cloud instances, to control adding by IP or socket
    if not app.config.get("ALLOW_PRINTER_ADD_BY_IP") and protocol in ["http", "https"]:
        return abort(make_response("This option is disabled in this installation", 400))
    if not app.config.get("ALLOW_PRINTER_ADD_BY_SOCKET") and protocol in ["sock"]:
        return abort(make_response("This option is disabled in this installation", 400))

    if protocol in ["http", "https"]:
        if (
            (not ip and not hostname)
            or not name
            or protocol not in ["http", "https"]
            or (hostname and re.match(r"^[0-9a-zA-Z.-]+\.local$", hostname) is None)
            or (ip and re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$", ip) is None)
            or (port and re.match(r"^\d{0,5}$", str(port)) is None)
        ):
            return abort(make_response("", 400))

        if hostname and not ip:
            ip = network.get_avahi_address(hostname)
            if not ip:
                return abort(
                    make_response("Cannot resolve %s with mDNS" % hostname, 500)
                )
        if ip and not hostname:
            hostname = network.get_avahi_hostname(ip)

        if (
            printers.get_printer_by_network_props(org_uuid, hostname, ip, port, path)
            is not None
        ):
            return abort(make_response("", 409))
    elif protocol == "sock":
        path = ""
        hostname = ""
        ip = ""
        port = 0
        if printers.get_printer_by_socket_token(org_uuid, token) is not None:
            return abort(make_response("", 409))
    else:
        return abort(make_response("Invalid protocol", 400))
    printer = clients.get_printer_instance(
        {
            "uuid": uuid,
            "organization_uuid": org_uuid,
            "hostname": hostname,
            "ip": ip,
            "port": port,
            "path": path,
            "name": name,
            "token": token,
            "protocol": protocol,
            "client": "octoprint",  # TODO make this more generic
        }
    )
    printer.add_api_key(api_key)
    printer.update_network_base()
    printer.sniff()
    printers.add_printer(
        uuid=uuid,
        name=name,
        organization_uuid=org_uuid,
        hostname=hostname,
        ip=ip,
        port=port,
        path=path,
        token=token,
        protocol=printer.protocol,
        client=printer.client_name(),
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
            "webcam": printer.webcam(),
        },
    )
    # TODO cache webcam, job, status for a small amount of time in this client
    return jsonify(make_printer_response(printer, ["status", "webcam", "job"])), 201


@app.route("/organizations/<org_uuid>/printers/<uuid>", methods=["DELETE"])
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_delete(org_uuid, uuid):
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    printers.delete_printer(uuid)
    return "", 204


@app.route("/organizations/<org_uuid>/printers/<uuid>", methods=["PATCH"])
@jwt_force_password_change
@validate_org_access("admin")
@cross_origin()
def printer_patch(org_uuid, uuid):
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    data = request.json
    if not data:
        return abort(make_response("", 400))
    name = data.get("name", printer["name"])
    api_key = data.get("api_key", printer["client_props"].get("api_key", None))
    printer_props = data.get("printer_props", {})

    # TODO it might be necessary to update protocol, ip, hostname, port and path as well eventually
    if not name:
        return abort(make_response("", 400))
    printer_inst = clients.get_printer_instance(printer)
    printer_inst.add_api_key(api_key)
    if data.get("api_key", "-1") != "-1" and data.get("api_key", "-1") != printer[
        "client_props"
    ].get("api_key", None):
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
            "webcam": printer_inst.webcam(),
        },
        printer_props=printer_inst.get_printer_props(),
    )
    # TODO cache webcam, job, status for a small amount of time in client
    return (
        jsonify(make_printer_response(printer_inst, ["status", "webcam", "job"])),
        200,
    )


@app.route("/organizations/<org_uuid>/printers/<uuid>/connection", methods=["POST"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_change_connection(org_uuid, uuid):
    # TODO this has to be streamlined, octoprint sometimes cannot handle two connect commands at once
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    data = request.json
    if not data:
        return abort(make_response("", 400))
    state = data.get("state", None)
    printer_inst = clients.get_printer_instance(printer)
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
    else:
        return abort(make_response("", 400))
    return "", 204


@app.route("/organizations/<org_uuid>/printers/<uuid>/current-job", methods=["POST"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_modify_job(org_uuid, uuid):
    # TODO allow users to pause/cancel only their own prints via printjob_id
    # And allow admins to pause/cancel anything
    # but that means creating a new tracking of current jobs on each printer
    # and does not handle prints issued by bypassing Karmen Hub
    # Alternative is to log who modified the current job into an admin-accessible eventlog
    # See https://trello.com/c/uiv0luZ8/142 for details
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    data = request.json
    if not data:
        return abort(make_response("", 400))
    action = data.get("action", None)
    if not action:
        return abort(make_response("", 400))
    printer_inst = clients.get_printer_instance(printer)
    try:
        if printer_inst.modify_current_job(action):
            user = get_current_user()
            app.logger.info(
                "User %s successfully issued a modification (%s) of current job on printer %s",
                user["uuid"],
                action,
                uuid,
            )
            return "", 204
        return abort(make_response("", 409))
    except clients.utils.PrinterClientException as e:
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
        if req is not None:
            return req
    except (requests.exceptions.ConnectionError, requests.exceptions.ReadTimeout,) as e:
        app.logger.debug("Cannot call %s because %s" % (snapshot_url, e))
        return None


@app.route("/organizations/<org_uuid>/printers/<uuid>/webcam-snapshot", methods=["GET"])
@jwt_force_password_change
@validate_org_access()
@cross_origin()
def printer_webcam_snapshot(org_uuid, uuid):
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
    try:
        guid.UUID(uuid, version=4)
    except ValueError:
        return abort(make_response("", 400))
    printer = printers.get_printer(uuid)
    if printer is None or printer.get("organization_uuid") != org_uuid:
        return abort(make_response("", 404))
    printer_inst = clients.get_printer_instance(printer)
    if printer_inst.client_info.webcam is None:
        return abort(make_response("", 404))
    snapshot_url = printer_inst.client_info.webcam.get("snapshot")
    if snapshot_url is None:
        return abort(make_response("", 404))

    # process current future if done
    if FUTURES_MICROCACHE.get(uuid) and FUTURES_MICROCACHE.get(uuid).done():
        WEBCAM_MICROCACHE[uuid] = FUTURES_MICROCACHE[uuid].result()
        try:
            del FUTURES_MICROCACHE[uuid]
        except Exception:
            # that's ok, probably a race condition
            pass
    # issue a new future if not present
    if not FUTURES_MICROCACHE.get(uuid):
        FUTURES_MICROCACHE[uuid] = executor.submit(_get_webcam_snapshot, snapshot_url)

    if WEBCAM_MICROCACHE.get(uuid) is not None:
        response = WEBCAM_MICROCACHE.get(uuid)
        return (
            response.content,
            200,
            {"Content-Type": response.headers.get("content-type", "image/jpeg")},
        )
    # There should be a future running, if the client retries, they should
    # eventually get a snapshot.
    # We don't want to end with an error here, so the clients keep retrying
    return "", 202
