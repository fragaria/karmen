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
        "client": octoprinter.client,
        "name": octoprinter.name,
        "hostname": octoprinter.hostname,
        "ip": octoprinter.ip,
        "mac": octoprinter.mac,
        "version": octoprinter.version,
        "active": octoprinter.active,
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
    active = request.args.get('active')
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    for printer in database.get_printers(active):
        printers.append(get_printer(printer, fields))
    return jsonify(printers)

@app.route('/printers/<mac>', methods=['GET', 'OPTIONS'])
@cross_origin()
def printer_detail(mac):
    fields = request.args.get('fields').split(',') if request.args.get('fields') else []
    printer = database.get_printer(mac)
    if printer is None:
        return abort(404)
    return jsonify(get_printer(printer, fields))
