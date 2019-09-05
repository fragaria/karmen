import json
import re

from flask import jsonify, request, abort
from flask_cors import cross_origin
from server import app, database, __version__
from server.models import Octoprint
from server.services import network

@app.route('/', methods=['GET', 'OPTIONS'])
@cross_origin()
def index():
    return jsonify({
        'app': 'karmen_backend',
        'docs': 'https://karmen.readthedocs.io',
        'version': __version__
    })

def get_printer(printer, fields):
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
    if "printerprofile" in fields:
        data["printerprofile"] = octoprinter.printerprofile()
    return data

@app.route('/printers', methods=['GET', 'OPTIONS'])
@cross_origin()
def printers_list():
    printers = []
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    for printer in database.get_printers():
        printers.append(get_printer(printer, fields))
    return jsonify(printers)

@app.route('/printers/<ip>', methods=['GET', 'OPTIONS'])
@cross_origin()
def printer_detail(ip):
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    printer = database.get_printer(ip)
    if printer is None:
        return abort(404)
    return jsonify(get_printer(printer, fields))

@app.route('/printers/<ip>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def printer_delete(ip):
    printer = database.get_printer(ip)
    if printer is None:
        return abort(404)
    database.delete_printer(ip)
    for device in database.get_network_devices(printer["ip"]):
        device["disabled"] = True
        database.upsert_network_device(**device)
    return '', 204

@app.route('/printers', methods=['POST', 'OPTIONS'])
@cross_origin()
def printer_add():
    data = request.json
    ip = data.get("ip", None)
    name = data.get("name", None)
    if not ip or \
        not name or \
        re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', ip) is None or \
        len(name) < 1:
        return abort(400)
    if database.get_printer(ip) is not None:
        return abort(409)
    hostname = network.get_avahi_hostname(ip)
    printer = Octoprint(hostname, ip, name)
    printer.sniff()
    database.upsert_network_device(
        ip=ip,
        retry_after=None,
        disabled=False
    )
    database.add_printer(
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
