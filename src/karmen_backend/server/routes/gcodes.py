import re
import datetime

from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from server import app, __version__
from server.database import gcodes, printjobs
from server.services import files

def make_gcode_response(gcode, fields=None):
    flist = ["id", "path", "filename", "display", "absolute_path", "uploaded", "size", "data"]
    fields = fields if fields else flist
    response = {}
    for field in flist:
        if field in fields:
            if field == "data":
                response["data"] = "/gcodes/%s/data" % (gcode["id"],)
                continue
            response[field] = gcode[field]
    if "uploaded" in response:
        response["uploaded"] = response["uploaded"].isoformat()
    return response

@app.route('/gcodes', methods=['GET', 'OPTIONS'])
@cross_origin()
def gcodes_list():
    gcode_list = []
    order_by = request.args.get('order_by', '')
    if ',' in order_by:
        return abort(400)
    try:
        limit = int(request.args.get('limit', 200))
        if limit and limit < 0:
            limit = 200
    except ValueError:
        limit = 200
    try:
        start_with = int(request.args.get('start_with')) if request.args.get('start_with') else None
        if start_with and start_with <= 0:
            start_with = None
    except ValueError:
        start_with = None
    fields = [f for f in request.args.get('fields', '').split(',') if f]
    filter_crit = request.args.get('filter', None) # TODO test html decoding
    gcodes_record_set = gcodes.get_gcodes(
        order_by=order_by,
        limit=limit,
        start_with=start_with,
        filter=filter_crit
    )
    response = {
        "items": gcode_list,
    }
    next_record = None
    if len(gcodes_record_set) > int(limit):
        next_record = gcodes_record_set[-1]
        gcodes_record_set = gcodes_record_set[0:-1]
    for gcode in gcodes_record_set:
        gcode_list.append(make_gcode_response(gcode, fields))

    next_href = "/gcodes"
    parts = ["limit=%s" % limit]
    if order_by:
        parts.append("order_by=%s" % order_by)
    if fields:
        parts.append("fields=%s" % ','.join(fields))
    if filter_crit:
        parts.append("filter=%s" % filter_crit)
    if next_record:
        parts.append("start_with=%s" % next_record["id"])
        response["next"] = "%s?%s" % (next_href, '&'.join(parts)) if parts else next_href

    return jsonify(response)

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
