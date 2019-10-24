import re

import requests
from flask import jsonify, request, abort, Response, stream_with_context
from flask_cors import cross_origin
from server import app, __version__
from server.database import printers
from server.database import network_devices
from server import clients
from server.services import network


def make_printer_response(printer, fields):
    printer_inst = clients.get_printer_instance(printer)
    data = {
        "client": {
            "name": printer_inst.client_name(),
            "version": printer_inst.client.version,
            "connected": printer_inst.client.connected,
            "readonly": printer_inst.client.read_only,
        },
        "printer_props": printer_inst.get_printer_props(),
        "name": printer_inst.name,
        "hostname": printer_inst.hostname,
        "ip": printer_inst.ip,
    }
    if "status" in fields:
        data["status"] = printer_inst.status()
    if "webcam" in fields:
        data["webcam"] = printer_inst.webcam()
        if "stream" in data["webcam"]:
            data["webcam"]["proxied"] = "/proxied-webcam/%s" % (printer_inst.ip,)
    if "job" in fields:
        data["job"] = printer_inst.job()
    return data


@app.route("/printers", methods=["GET", "OPTIONS"])
@cross_origin()
def printers_list():
    device_list = []
    fields = [f for f in request.args.get("fields", "").split(",") if f]
    for printer in printers.get_printers():
        # TODO this should somehow go in parallel
        device_list.append(make_printer_response(printer, fields))
    return jsonify({"items": device_list})


@app.route("/printers", methods=["POST", "OPTIONS"])
@cross_origin()
def printer_create():
    data = request.json
    if not data:
        return abort(400)
    ip = data.get("ip", None)
    name = data.get("name", None)
    if (
        not ip
        or not name
        or re.match(r"^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:?\d{0,5}$", ip) is None
    ):
        return abort(400)
    if printers.get_printer(ip) is not None:
        return abort(409)
    hostname = network.get_avahi_hostname(ip)
    printer = clients.get_printer_instance(
        {
            "hostname": hostname,
            "ip": ip,
            "name": name,
            "client": "octoprint",  # TODO make this more generic
        }
    )
    printer.sniff()
    network_devices.upsert_network_device(ip=ip, retry_after=None, disabled=False)
    printers.add_printer(
        name=name,
        hostname=hostname,
        ip=ip,
        client=printer.client_name(),
        client_props={
            "version": printer.client.version,
            "connected": printer.client.connected,
            "read_only": printer.client.read_only,
        },
    )
    return "", 201


@app.route("/printers/<ip>", methods=["GET", "OPTIONS"])
@cross_origin()
def printer_detail(ip):
    fields = request.args.get("fields").split(",") if request.args.get("fields") else []
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    return jsonify(make_printer_response(printer, fields))


@app.route("/printers/<ip>", methods=["DELETE", "OPTIONS"])
@cross_origin()
def printer_delete(ip):
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    printers.delete_printer(ip)
    for device in network_devices.get_network_devices(printer["ip"]):
        device["disabled"] = True
        network_devices.upsert_network_device(**device)
    return "", 204


@app.route("/printers/<ip>", methods=["PATCH", "OPTIONS"])
@cross_origin()
def printer_patch(ip):
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    data = request.json
    if not data:
        return abort(400)
    name = data.get("name", None)
    if not name:
        return abort(400)
    printer_inst = clients.get_printer_instance(printer)
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
        ip=printer_inst.ip,
        client=printer_inst.client_name(),
        client_props={
            "version": printer_inst.client.version,
            "connected": printer_inst.client.connected,
            "read_only": printer_inst.client.read_only,
        },
        printer_props=printer_inst.get_printer_props(),
    )
    return "", 204


@app.route("/printers/<ip>/connection", methods=["POST", "OPTIONS"])
@cross_origin()
def printer_change_connection(ip):
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    data = request.json
    if not data:
        return abort(400)
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
        return abort(400)
    return "", 204


@app.route("/printers/<ip>/current-job", methods=["POST", "OPTIONS"])
@cross_origin()
def printer_modify_job(ip):
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    data = request.json
    if not data:
        return abort(400)
    action = data.get("action", None)
    if not action:
        return abort(400)
    printer_inst = clients.get_printer_instance(printer)
    try:
        if printer_inst.modify_current_job(action):
            return "", 204
        return "", 409
    except clients.utils.PrinterClientException as e:
        return abort(400, e)


@app.route("/proxied-webcam/<ip>", methods=["GET", "OPTIONS"])
@cross_origin()
def printer_webcam(ip):
    # This is very inefficient and should not be used in production. Use the nginx
    # redis based proxy pass instead
    # TODO maybe we can drop this in the dev env as well
    printer = printers.get_printer(ip)
    if printer is None:
        return abort(404)
    printer_inst = clients.get_printer_instance(printer)
    webcam = printer_inst.webcam()
    if "stream" not in webcam:
        return abort(404)
    req = requests.get(webcam["stream"], stream=True)
    return Response(
        stream_with_context(req.iter_content()),
        content_type=req.headers["content-type"],
    )
