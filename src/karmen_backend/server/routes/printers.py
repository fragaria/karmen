import re
import random
import string

from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from server import app, __version__
from server.database import printers
from server import clients, executor
from server.services import network
from . import jwt_force_password_change, jwt_requires_role


def make_printer_response(printer, fields):
    if not isinstance(printer, clients.utils.PrinterClient):
        printer_inst = clients.get_printer_instance(printer)
    else:
        printer_inst = printer
    data = {
        "client": {
            "name": printer_inst.client_name(),
            "version": printer_inst.client_info.version,
            "connected": bool(printer_inst.client_info.connected),
            "access_level": printer_inst.client_info.access_level,
            "api_key": printer_inst.client_info.api_key[0:2]
            + "*" * (len(printer_inst.client_info.api_key) - 2)
            if printer_inst.client_info.api_key
            else None,
        },
        "printer_props": printer_inst.get_printer_props(),
        "name": printer_inst.name,
        "hostname": printer_inst.hostname,
        "host": printer_inst.host,
        "protocol": printer_inst.protocol,
    }
    if "status" in fields:
        data["status"] = printer_inst.status()
    if "webcam" in fields:
        data["webcam"] = printer_inst.webcam()
        if "stream" in data["webcam"]:
            data["webcam"]["proxied"] = "/proxied-webcam/%s" % (printer_inst.host,)
    if "job" in fields:
        data["job"] = printer_inst.job()
    return data


@app.route("/printers", methods=["GET"])
@jwt_force_password_change
@cross_origin()
def printers_list():
    device_list = []
    fields = [f for f in request.args.get("fields", "").split(",") if f]
    futures = []

    def reqid():
        letters = string.ascii_lowercase
        return "".join(random.choice(letters) for i in range(10))

    uqid = reqid()
    for printer in printers.get_printers():
        try:
            futures.append(
                executor.submit_stored(
                    "%s:%s" % (uqid, printer["host"]),
                    make_printer_response,
                    printer,
                    fields,
                )
            )
        # This means that the future already exists and has not been poped yet -
        # that's a race condition right there. It shouldn't happen as each request is identified by uqid though
        except ValueError as e:
            app.logger.error("ValueError %s" % e)

    for future in futures:
        try:
            data = future.result()
        except Exception as e:
            app.logger.error("Exception %s" % e)
        else:
            device_list.append(data)
            executor.futures.pop(data["host"])

    return jsonify({"items": device_list}), 200


@app.route("/printers/<host>", methods=["GET"])
@jwt_force_password_change
@cross_origin()
def printer_detail(host):
    fields = request.args.get("fields").split(",") if request.args.get("fields") else []
    printer = printers.get_printer(host)
    if printer is None:
        return abort(make_response("", 404))
    return jsonify(make_printer_response(printer, fields))


@app.route("/printers", methods=["POST"])
@jwt_requires_role("admin")
@cross_origin()
def printer_create():
    data = request.json
    if not data:
        return abort(make_response("", 400))
    host = data.get("host", None)
    name = data.get("name", None)
    api_key = data.get("api_key", None)
    protocol = data.get("protocol", "http")
    hostname = None
    if (
        not host
        or not name
        or protocol not in ["http", "https"]
        or re.match(
            r"^([0-9a-zA-Z.-]+\.local|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):?\d{0,5}?$",
            host,
        )
        is None
    ):
        return abort(make_response("", 400))

    # we got a hostname, not IP
    if re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:?\d{0,5}$", host) is None:
        # take out the port number
        m = re.search(r"^([0-9a-zA-Z.-]+):?(\d{0,5}?)$", host)
        if m is None:
            return abort(make_response("", 400))
        hostname = m.group(1)
        port = m.group(2)
        # resolve hostname with mDNS
        host = network.get_avahi_address(hostname)
        if not host:
            return abort(make_response("Cannot resolve %s with mDNS" % hostname, 500))
        if port:
            host = "%s:%s" % (host, port)

    if printers.get_printer(host) is not None:
        return abort(make_response("", 409))
    if not hostname:
        hostname = network.get_avahi_hostname(host)
    printer = clients.get_printer_instance(
        {
            "hostname": hostname,
            "host": host,
            "name": name,
            "protocol": protocol,
            "client": "octoprint",  # TODO make this more generic
        }
    )
    printer.add_api_key(api_key)
    printer.sniff()
    printers.add_printer(
        name=name,
        hostname=hostname,
        host=host,
        protocol=printer.protocol,
        client=printer.client_name(),
        client_props={
            "version": printer.client_info.version,
            "connected": printer.client_info.connected,
            "access_level": printer.client_info.access_level,
            "api_key": printer.client_info.api_key,
        },
    )
    # TODO cache webcam, job, status for a small amount of time in client
    return jsonify(make_printer_response(printer, ["status", "webcam", "job"])), 201


@app.route("/printers/<host>", methods=["DELETE"])
@jwt_requires_role("admin")
@cross_origin()
def printer_delete(host):
    printer = printers.get_printer(host)
    if printer is None:
        return abort(make_response("", 404))
    printers.delete_printer(host)
    return "", 204


@app.route("/printers/<host>", methods=["PATCH"])
@jwt_requires_role("admin")
@cross_origin()
def printer_patch(host):
    printer = printers.get_printer(host)
    if printer is None:
        return abort(make_response("", 404))
    data = request.json
    if not data:
        return abort(make_response("", 400))
    name = data.get("name", printer["name"])
    protocol = data.get("protocol", printer["protocol"])
    api_key = data.get("api_key", printer["client_props"].get("api_key", None))
    if not name or protocol not in ["http", "https"]:
        return abort(make_response("", 400))
    printer_inst = clients.get_printer_instance(printer)
    printer_inst.add_api_key(api_key)
    if data.get("api_key", "-1") != "-1" and data.get("api_key", "-1") != printer[
        "client_props"
    ].get("api_key", None):
        printer_inst.sniff()  # this can be offloaded to check_printer task
    printer_props = data.get("printer_props", {})
    if printer_props:
        if not printer_inst.get_printer_props():
            printer_inst.printer_props = {}
        printer_inst.get_printer_props().update(
            {
                k: printer_props[k]
                for k in [
                    "filament_type",
                    "filament_color",
                    "bed_type",
                    "tool0_diameter",
                ]
                if k in printer_props
            }
        )
    printers.update_printer(
        name=name,
        hostname=printer_inst.hostname,
        host=printer_inst.host,
        protocol=protocol,
        client=printer_inst.client_name(),
        client_props={
            "version": printer_inst.client_info.version,
            "connected": printer_inst.client_info.connected,
            "access_level": printer_inst.client_info.access_level,
            "api_key": printer_inst.client_info.api_key,
        },
        printer_props=printer_inst.get_printer_props(),
    )
    # TODO cache webcam, job, status for a small amount of time in client
    return (
        jsonify(make_printer_response(printer_inst, ["status", "webcam", "job"])),
        200,
    )


@app.route("/printers/<host>/connection", methods=["POST"])
@jwt_requires_role("admin")
@cross_origin()
def printer_change_connection(host):
    # TODO this has to be streamlined, octoprint sometimes cannot handle two connect commands at once
    printer = printers.get_printer(host)
    if printer is None:
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


@app.route("/printers/<host>/current-job", methods=["POST"])
@jwt_requires_role("admin")
@cross_origin()
def printer_modify_job(host):
    # TODO make this the last resort for admins
    # TODO allow users to pause/cancel only their own prints via printjob_id
    # but that means creating a new tracking of current jobs on each printer
    printer = printers.get_printer(host)
    if printer is None:
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
            return "", 204
        return abort(make_response("", 409))
    except clients.utils.PrinterClientException as e:
        return abort(make_response(jsonify(message=str(e)), 400))


@app.route("/proxied-webcam/<host>", methods=["GET"])
@cross_origin()
def printer_webcam(host):
    return abort(make_response("", 503))
