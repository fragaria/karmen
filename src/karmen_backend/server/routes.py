from flask import jsonify, request, abort
from flask_cors import cross_origin
from server.models import Octoprint
from server import app, database, __version__

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
