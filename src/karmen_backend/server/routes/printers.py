import re

from flask import jsonify, request, abort
from flask_cors import cross_origin
from server import app, __version__
from server.database.printers import get_printer, get_printers, delete_printer, add_printer, update_printer
from server.database.network_devices import get_network_devices, upsert_network_device
from server.models import Octoprint
from server.services import network

def make_printer_response(printer, fields):
    # TODO not only octoprint
    octoprinter = Octoprint(**printer)
    data = {
        "client": {
            "name": octoprinter.client_name(),
            "version": octoprinter.client.version,
            "connected": octoprinter.client.connected,
            "readonly": octoprinter.client.read_only,
        },
        "name": octoprinter.name,
        "hostname": octoprinter.hostname,
        "ip": octoprinter.ip,
    }
    if "status" in fields:
        data["status"] = octoprinter.status()
    if "webcam" in fields:
        data["webcam"] = octoprinter.webcam()
    if "job" in fields:
        data["job"] = octoprinter.job()
    return data

@app.route('/printers', methods=['GET', 'OPTIONS'])
@cross_origin()
def printers_list():
    printers = []
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    for printer in get_printers():
        # TODO this should go in parallel
        printers.append(make_printer_response(printer, fields))
    return jsonify(printers)

@app.route('/printers', methods=['POST', 'OPTIONS'])
@cross_origin()
def printer_create():
    data = request.json
    if not data:
        return abort(400)
    ip = data.get("ip", None)
    name = data.get("name", None)
    if not ip or \
        not name or \
        re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip) is None:
        return abort(400)
    if get_printer(ip) is not None:
        return abort(409)
    hostname = network.get_avahi_hostname(ip)
    printer = Octoprint(hostname, ip, name)
    printer.sniff()
    upsert_network_device(
        ip=ip,
        retry_after=None,
        disabled=False
    )
    add_printer(
        name=name,
        hostname=hostname,
        ip=ip,
        client=printer.client_name(),
        client_props={
            "version": printer.client.version,
            "connected": printer.client.connected,
            "read_only": printer.client.read_only,
        }
    )
    return '', 201

@app.route('/printers/<ip>', methods=['GET', 'OPTIONS'])
@cross_origin()
def printer_detail(ip):
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    printer = get_printer(ip)
    if printer is None:
        return abort(404)
    return jsonify(make_printer_response(printer, fields))

@app.route('/printers/<ip>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def printer_delete(ip):
    printer = get_printer(ip)
    if printer is None:
        return abort(404)
    delete_printer(ip)
    for device in get_network_devices(printer["ip"]):
        device["disabled"] = True
        upsert_network_device(**device)
    return '', 204

@app.route('/printers/<ip>', methods=['PATCH', 'OPTIONS'])
@cross_origin()
def printer_patch(ip):
    printer = get_printer(ip)
    if printer is None:
        return abort(404)
    data = request.json
    if not data:
        return abort(400)
    name = data.get("name", None)
    if not name:
        return abort(400)
    update_printer(
        name=name,
        hostname=printer["hostname"],
        ip=printer["ip"],
        client=printer["client"],
        client_props={
            "version": printer["client_props"]["version"],
            "connected": printer["client_props"]["connected"],
            "read_only": printer["client_props"]["read_only"],
        }
    )
    return '', 204
