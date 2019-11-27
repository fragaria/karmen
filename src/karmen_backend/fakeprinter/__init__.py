import os
import re

from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename

__version__ = "0.0.14-rc.3"
__author__ = "Jirka Chadima"
__copyright__ = (
    "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
)
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"

app = Flask(__name__)

CORS(app)

job_state = "Printing"
job_name = "fake-file-being-printed.gcode"


@app.route("/api/version", methods=["GET", "OPTIONS"])
@cross_origin()
def version():
    return jsonify({"api": "0.1", "server": "0.0.1", "text": "octoprint fake"})


@app.route("/api/settings", methods=["GET", "OPTIONS"])
@cross_origin()
def settings():
    return jsonify(
        {
            "webcam": {
                "webcamEnabled": True,
                "streamUrl": "/stream",
                "flipH": False,
                "flipV": False,
                "rotate90": False,
            }
        }
    )


@app.route("/api/connection", methods=["GET", "OPTIONS"])
@cross_origin()
def connection():
    return jsonify(
        {
            "current": {
                "state": job_state,
                "port": "/dev/ttyACM0",
                "baudrate": 115200,
                "printerProfile": "_default",
            },
            "options": {
                "ports": ["/dev/ttyACM0", "VIRTUAL"],
                "baudrates": [250000, 230400, 115200, 57600, 38400, 19200, 9600],
                "printerProfiles": [{"name": "Default", "id": "_default"}],
                "portPreference": "/dev/ttyACM0",
                "baudratePreference": 250000,
                "printerProfilePreference": "_default",
                "autoconnect": True,
            },
        }
    )


@app.route("/api/connection", methods=["POST", "OPTIONS"])
@cross_origin()
def modify_connection():
    global job_state
    data = request.json
    if "command" not in data:
        return abort(400)
    if data["command"] == "connect":
        job_state = "Operational"
    if data["command"] == "disconnect":
        job_state = "Offline"
    return "", 204


@app.route("/api/printer", methods=["GET", "OPTIONS"])
@cross_origin()
def printer():
    return jsonify(
        {
            "state": {"text": job_state},
            "temperature": {
                "bed": {"actual": 24.4, "target": 0.0},
                "tool0": {"actual": 25.7, "target": 0.0},
            },
        }
    )


@app.route("/api/job", methods=["GET", "OPTIONS"])
@cross_origin()
def job():
    global job_name
    return jsonify(
        {
            "job": {"file": {"display": job_name}},
            "progress": {"completion": 66.666, "printTimeLeft": 7685, "printTime": 532},
            "state": job_state,
        }
    )


@app.route("/api/job", methods=["POST", "OPTIONS"])
@cross_origin()
def modify_job():
    global job_state
    data = request.json
    if "command" not in data:
        return abort(400)
    if data["command"] == "restart" and job_state == "Paused":
        return abort(409)
    if data["command"] == "start":
        if job_state == "Printing":
            return abort(409)
        job_state = "Printing"
    if data["command"] == "cancel":
        if job_state not in ("Paused", "Printing"):
            return abort(409)
        job_state = "Operational"
    if data["command"] == "pause":
        action = data.get("action", "toggle")
        if action == "pause":
            job_state = "Paused"
        if action == "resume":
            job_state = "Printing"
        if action == "toggle":
            if job_state == "Printing":
                job_state = "Paused"
            else:
                job_state = "Printing"
    return "", 204


@app.route("/api/files/local", methods=["POST", "OPTIONS"])
@cross_origin()
def upload():
    global job_state, job_name
    if "file" not in request.files:
        return abort(400)
    incoming = request.files["file"]
    if incoming.filename == "":
        return abort(400)

    if not re.search(r"\.gco(de)?$", incoming.filename):
        return abort(415)

    original_filename = incoming.filename
    filename = secure_filename(original_filename)
    path = request.form.get("path", "/")
    destination_dir = os.path.join("/tmp/uploaded-files/", path)
    destination = os.path.join(destination_dir, filename)
    job_state = "Printing"
    job_name = filename
    return (
        jsonify(
            {
                "files": {
                    "local": {
                        "name": filename,
                        "display": original_filename,
                        "path": destination,
                        "origin": "local",
                    }
                }
            }
        ),
        201,
    )


@app.route("/stream", methods=["GET", "OPTIONS"])
@cross_origin()
def stream():
    dirname = os.path.dirname(__file__)
    return send_file(os.path.join(dirname, "./printer.jpg"))
