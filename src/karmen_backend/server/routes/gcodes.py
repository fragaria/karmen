import os
import re
from time import time

from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from server import app, __version__
from server.database import gcodes, printjobs

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

@app.route('/gcodes/<id>', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcode_detail(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    return jsonify(make_gcode_response(gcode))

@app.route('/gcodes', methods=['POST', 'OPTIONS'])
@cross_origin()
def gcode_create():
    # TODO unify with octoprintemulator
    if "file" not in request.files:
        return abort(400)
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(400)

    if not re.search(r'\.gco(de)?$', incoming.filename):
        return abort(415)

    original_filename = incoming.filename
    filename = secure_filename(original_filename)
    path = request.form.get("path", "/")
    destination_dir = os.path.join(app.config['UPLOAD_FOLDER'], path)
    destination = os.path.join(destination_dir, filename)
    try:
        # fix potentially non-existent paths
        os.makedirs(destination_dir, exist_ok=True)
        # name duplicities
        if os.path.exists(destination):
            original_filename = re.sub(
                r'(\.gco(de)?)', r'-' + re.escape(repr(round(time()))) + r'\1',
                incoming.filename
            )
            filename = secure_filename(original_filename)
            destination = os.path.join(destination_dir, filename)
        # TODO detect more parameters
        # ; filament_type = PLA
        # M140 S60 ; set bed temp
        # M104 S215 ; set extruder temp
        # ; printer_model = MK3
        incoming.save(destination)
        size = os.stat(destination).st_size
        gcodes.add_gcode(
            path=path,
            filename=filename,
            display=original_filename,
            absolute_path=destination,
            size=size
        )
    except (IOError, OSError) as e:
        return abort(e, 500)

    return jsonify({
        "files": {
            "local": {
                "name": filename,
                "display": original_filename,
                "path": destination,
                "origin": "local"
            }
        }
    }), 201

@app.route('/gcodes/<id>/data', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcode_file(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    try:
        return send_file(gcode["absolute_path"], as_attachment=True, attachment_filename=gcode["filename"])
    except FileNotFoundError:
        return abort(404)

@app.route('/gcodes/<id>', methods=['DELETE', 'OPTIONS'])
@cross_origin()
def gcode_delete(id):
    gcode = gcodes.get_gcode(id)
    if gcode is None:
        return abort(404)
    try:
        os.remove(gcode["absolute_path"])
    except IOError:
        pass
    finally:
        printjobs.delete_printjobs_by_gcode(id)
        gcodes.delete_gcode(id)
    return '', 204
