import re
import datetime

from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from server import app, __version__
from server.database import gcodes, printjobs
from server.services import files

def make_gcode_response(gcode):
    return {
        "id": gcode["id"],
        "path": gcode["path"],
        "filename": gcode["filename"],
        "display": gcode["display"],
        "absolute_path": gcode["absolute_path"],
        "uploaded": gcode["uploaded"].isoformat(),
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
    if "file" not in request.files:
        return abort(400)
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(400)

    if not re.search(r'\.gco(de)?$', incoming.filename):
        return abort(415)

    try:
        saved = files.save(incoming, request.form.get("path", "/"))
        gcode_id = gcodes.add_gcode(
            path=saved["path"],
            filename=saved["filename"],
            display=saved["display"],
            absolute_path=saved["absolute_path"],
            size=saved["size"]
        )
    except (IOError, OSError) as e:
        return abort(e, 500)
    return jsonify(make_gcode_response({
        "id": gcode_id,
        "path": saved["path"],
        "filename": saved["filename"],
        "display": saved["display"],
        "absolute_path": saved["absolute_path"],
        "uploaded": datetime.datetime.now(),
        "size": saved["size"],
    })), 201

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
        files.remove(gcode["absolute_path"])
    except IOError:
        pass
    finally:
        printjobs.delete_printjobs_by_gcode(id)
        gcodes.delete_gcode(id)
    return '', 204
