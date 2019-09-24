import os
import re
from time import time

from flask import jsonify, request, abort
from flask_cors import cross_origin
from werkzeug.utils import secure_filename

from server import app, __version__
from server.database import gcodes

@app.route('/octoprint-emulator/api/version', methods=['GET', 'OPTIONS'])
@cross_origin()
def version():
    return jsonify({
        'api': 'karmen',
        'text': 'OctoPrint emulator by Karmen',
        'server': __version__
    })

@app.route('/octoprint-emulator/api/files/local', methods=['POST', 'OPTIONS'])
@cross_origin()
def upload():
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
