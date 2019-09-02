from flask import jsonify, request, abort
from flask_cors import cross_origin
from server.models import Octoprint
from server import app
from server import database

@app.route('/', methods=['GET', 'OPTIONS'])
@cross_origin()
def index():
    return jsonify({'app': 'multicontrol-poc-server', 'version': '0.0.0'})

@app.route('/printers', methods=['GET', 'OPTIONS'])
@cross_origin()
def printers_list():
    printers = []
    active = request.args.get('active')
    for printer in database.get_printers(active):
        printers.append({
            "name": printer["name"],
            "hostname": printer["hostname"],
            "ip": printer["ip"],
            "mac": printer["mac"],
            "version": printer["version"],
            "active": printer["active"],
        })
    return jsonify(printers)

@app.route('/printers/<mac>', methods=['GET', 'OPTIONS'])
@cross_origin()
def printer_detail(mac):
    printer = database.get_printer(mac)
    if printer is None:
        return abort(404)
    octoprinter = Octoprint(**printer)
    return jsonify({
        "name": octoprinter.name,
        "hostname": octoprinter.hostname,
        "ip": octoprinter.ip,
        "mac": octoprinter.mac,
        "version": octoprinter.version,
        "active": octoprinter.active,
        "live": octoprinter.status()
    })
