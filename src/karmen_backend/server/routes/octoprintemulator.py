import re
import uuid as guid

import functools

from flask import jsonify, request, abort
from flask_cors import cross_origin
from flask_jwt_extended import decode_token

from server import app, __version__
from server.database import gcodes
from server.services import files
from server.tasks.analyze_gcode import analyze_gcode


def x_api_key_required(func):
    @functools.wraps(func)
    def wrap():
        token = request.headers.get("x-api-key", None)
        if not token:
            return abort(403)
        try:
            decode_token(token)
        except Exception as e:
            return abort(403)
        return func()

    return wrap


# /octoprint-emulator/api/version, GET
@cross_origin()
@x_api_key_required
def version():
    return jsonify(
        {"api": "karmen", "text": "OctoPrint emulator by Karmen", "server": __version__}
    )


# /octoprint-emulator/api/settings, GET
@cross_origin()
@x_api_key_required
def settings():
    return jsonify({})


# /octoprint-emulator/api/printer, GET
@cross_origin()
@x_api_key_required
def printer():
    return jsonify(
        {
            "sd": {"ready": True},
            "state": {
                "flags": {
                    "cancelling": False,
                    "closedOrError": False,
                    "error": False,
                    "finishing": False,
                    "operational": True,
                    "paused": False,
                    "pausing": False,
                    "printing": False,
                    "ready": True,
                    "resuming": False,
                    "sdReady": True,
                },
                "text": "Operational",
            },
        }
    )


# /octoprint-emulator/api/job, GET
@cross_origin()
@x_api_key_required
def job():
    return jsonify({"job": {}})


# /octoprint-emulator/api/files/local, POST
@cross_origin()
def upload():
    token = request.headers.get("x-api-key", None)
    if not token:
        return abort(403)
    user_uuid = None
    try:
        decoded = decode_token(token)
        user_uuid = decoded["identity"]
    except Exception as e:
        abort(403)

    if decoded["user_claims"].get("organization_uuid") is None:
        abort(403)

    if "file" not in request.files:
        return abort(400)
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(400)

    if not re.search(r"\.gco(de)?$", incoming.filename):
        return abort(415)
    try:
        org_uuid = decoded["user_claims"]["organization_uuid"]
        saved = files.save(org_uuid, incoming, request.form.get("path", ""))
        gcode_id = gcodes.add_gcode(
            uuid=guid.uuid4(),
            path=saved["path"],
            filename=saved["filename"],
            display=saved["display"],
            absolute_path=saved["absolute_path"],
            organization_uuid=org_uuid,
            size=saved["size"],
            user_uuid=user_uuid,
        )
        analyze_gcode.delay(gcode_id)
    except (IOError, OSError) as e:
        return abort(500, "upload IOError;\t" + str(e))
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
