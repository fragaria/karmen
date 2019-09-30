from flask import jsonify, request, abort
from flask_cors import cross_origin
from server import app, drivers
from server.database import printjobs, printers, gcodes

@app.route('/printjobs', methods=['POST', 'OPTIONS'])
@cross_origin()
def printjob_create():
    data = request.json
    if not data:
        return abort(400)
    gcode_id = data.get("gcode", None)
    printer_ip = data.get("printer", None)
    if not gcode_id or \
        not printer_ip:
        return abort(400)
    printer = printers.get_printer(printer_ip)
    if printer is None:
        return abort(404)
    gcode = gcodes.get_gcode(gcode_id)
    if gcode is None:
        return abort(404)
    printer_inst = drivers.get_printer_instance(printer)
    try:
        printer_inst.upload_and_start_job(gcode["absolute_path"])
        printjobs.add_printjob(gcode_id=gcode["id"], printer_ip=printer["ip"])
    except Exception as e:
        return abort(500, e)
    return '', 201
