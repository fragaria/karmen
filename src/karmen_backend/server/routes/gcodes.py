import re

import requests
from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from server import app, __version__
from server.database import gcodes

def make_gcode_response(gcode):
    return {
        "id": gcode["id"],
        "path": gcode["path"],
        "filename": gcode["filename"],
        "display": gcode["display"],
        "absolute_path": gcode["absolute_path"],
        "uploaded": gcode["uploaded"],
        "size": gcode["size"],
        "data": "/gcodes/%s/data" % (gcode["id"],),
    }

@app.route('/gcodes', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcodes_list():
    gcode_list = []
    for gcode in gcodes.get_gcodes():
        gcode_list.append(make_gcode_response(gcode))
    return jsonify(gcode_list)

@app.route('/gcodes', methods=['POST', 'OPTIONS'])
@cross_origin()
def gcode_create():
    # TODO copy over from octoprintemulator or make a function that handles this
    pass

@app.route('/gcodes/<id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcode_detail(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    return jsonify(make_gcode_response(gcode))

@app.route('/gcodes/<id>/data', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcode_file(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    print(gcode["filename"])
    return send_file(gcode["absolute_path"], as_attachment=True, attachment_filename=gcode["filename"])

@app.route('/gcodes/<id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def gcode_delete(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    gcodes.delete_gcode(id)
    return '', 204
