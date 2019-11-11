import re

from flask import jsonify, request, abort
from flask_cors import cross_origin

from server import app, __version__
from server.database import gcodes
from server.services import files
from server.tasks.analyze_gcode import analyze_gcode


@app.route("/octoprint-emulator/api/version", methods=["GET", "OPTIONS"])
@cross_origin()
def version():
    return jsonify(
        {"api": "karmen", "text": "OctoPrint emulator by Karmen", "server": __version__}
    )


@app.route("/octoprint-emulator/api/files/local", methods=["POST", "OPTIONS"])
@cross_origin()
def upload():
    if "file" not in request.files:
        return abort(400)
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(400)

    if not re.search(r"\.gco(de)?$", incoming.filename):
        return abort(415)

    try:
        saved = files.save(incoming, request.form.get("path", "/"))
        gcode_id = gcodes.add_gcode(
            path=saved["path"],
            filename=saved["filename"],
            display=saved["display"],
            absolute_path=saved["absolute_path"],
            size=saved["size"],
        )
        analyze_gcode.delay(gcode_id)
    except (IOError, OSError) as e:
        return abort(e, 500)
    return (
        jsonify(
            {
                "files": {
                    "local": {
                        "name": saved["filename"],
                        "display": saved["display"],
                        "path": saved["absolute_path"],
                        "origin": "local",
                    }
                }
            }
        ),
        201,
    )
