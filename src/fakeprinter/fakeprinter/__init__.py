import io
import os
import re
import time

from datetime import datetime, timedelta
from PIL import Image, ImageFont, ImageDraw
from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS, cross_origin
from werkzeug.utils import secure_filename

from fakeprinter.middlewares import ThrottlingMiddleware

__version__ = "0.13.0-rc14"
__author__ = "Jirka Chadima"
__copyright__ = (
    "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
)
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"

STARTED = datetime.now()
app = Flask(__name__)

app.wsgi_app = ThrottlingMiddleware(float(os.environ.get('THROTTLE', 0)), app.wsgi_app)


CORS(app)

STATE = {
    "job_state": os.environ.get("STATE_JOB_STATE", "Printing"),
    "job_name": os.environ.get("STATE_JOB_NAME", ""),
    "lights_color": [0, 0, 0],
    "fan_state": "off",
    "motors_state": "on",
    "x": 100.0,
    "y": 100.0,
    "z": 100.0,
    "temperature_bed": 24.7,
    "temperature_tool": 16.2,
}


@app.route("/api/version", methods=["GET"])
@cross_origin()
def version():
    return jsonify({"api": "0.1", "server": "0.0.1", "text": "octoprint fake"})


@app.route("/api/settings", methods=["GET"])
@cross_origin()
def settings():
    return jsonify(
        {
            "webcam": {
                "webcamEnabled": True,
                "streamUrl": "/snapshot",
                "snapshotUrl": "/snapshot",
                "flipH": False,
                "flipV": False,
                "rotate90": False,
            },
            "plugins": {"awesome_karmen_led": {"ready": True}},
        }
    )


@app.route("/api/connection", methods=["GET"])
@cross_origin()
def connection():
    global STATE
    return jsonify(
        {
            "current": {
                "state": STATE["job_state"],
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


@app.route("/api/connection", methods=["POST"])
@cross_origin()
def modify_connection():
    global STATE
    data = request.json
    if "command" not in data:
        return abort(400)
    if data["command"] == "connect":
        STATE["job_state"] = "Operational"
    if data["command"] == "disconnect":
        STATE["job_state"] = "Offline"
    return "", 204


@app.route("/api/job", methods=["GET"])
@cross_origin()
def job():
    global STATE
    next_day = (STARTED + timedelta(days=1)).replace(hour=11, minute=59)
    return jsonify(
        {
            "job": {"file": {"display": STATE["job_name"]}},
            "progress": {
                "completion": 66.666,
                "printTimeLeft": abs((next_day - datetime.now()).seconds),
                "printTime": abs((datetime.now() - STARTED).seconds),
            },
            "state": STATE["job_state"],
        }
    )


@app.route("/api/job", methods=["POST"])
@cross_origin()
def modify_job():
    global STATE
    data = request.json
    if "command" not in data:
        return abort(400)
    if data["command"] == "restart" and STATE["job_state"] == "Paused":
        return abort(409)
    if data["command"] == "start":
        if STATE["job_state"] == "Printing":
            return abort(409)
        STATE["job_state"] = "Printing"
    if data["command"] == "cancel":
        if STATE["job_state"] not in ("Paused", "Printing"):
            return abort(409)
        STATE["job_state"] = "Operational"
    if data["command"] == "pause":
        action = data.get("action", "toggle")
        if action == "pause":
            STATE["job_state"] = "Paused"
        if action == "resume":
            STATE["job_state"] = "Printing"
        if action == "toggle":
            if STATE["job_state"] == "Printing":
                STATE["job_state"] = "Paused"
            else:
                STATE["job_state"] = "Printing"
    return "", 204


@app.route("/api/files/local", methods=["POST"])
@cross_origin()
def upload():
    global STATE
    if "file" not in request.files:
        return abort(400)
    incoming_file = request.files["file"]
    if incoming_file.filename == "":
        return abort(400)

    if not re.search(r"\.gco(de)?$", incoming_file.filename):
        return abort(415)

    original_filename = incoming_file.filename
    filename = secure_filename(original_filename)
    path = request.form.get("path", "/")
    destination_dir = os.path.join("/tmp/uploaded-files/", path)
    destination = os.path.join(destination_dir, filename)
    if '-throttle-' in original_filename:
    # throttle the upload to 5kB / sec if the filename contains '-throttle-'
        while True:
            chunk = incoming_file.read(512)
            if not chunk:
                break
            print('< %r' % chunk)
            time.sleep(0.1)

    STATE["job_state"] = "Printing"
    STATE["job_name"] = filename
    STATE["motors_state"] = "on"
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


@app.route("/snapshot", methods=["GET"])
@cross_origin()
def snapshot():
    global STATE
    IMAGE = Image.open(os.path.join(os.path.dirname(__file__), "./printer.jpg"))
    imgio = io.BytesIO()
    draw = ImageDraw.Draw(IMAGE)
    font = ImageFont.load_default()
    draw.text((10, 10), datetime.now().strftime("%d/%m/%Y %H:%M:%S"), font=font)
    draw.text(
        (10, 30),
        "LIGHTS %s" % ("ON" if STATE["lights_color"] == [1, 1, 1] else "OFF"),
        font=font,
    )
    draw.text(
        (10, 50), "FAN %s" % STATE["fan_state"], font=font,
    )
    draw.text(
        (10, 70), "MOTORS %s" % STATE["motors_state"], font=font,
    )
    draw.text(
        (10, 90), "x %s" % STATE["x"], font=font,
    )
    draw.text(
        (10, 110), "y %s" % STATE["y"], font=font,
    )
    draw.text(
        (10, 130), "z %s" % STATE["z"], font=font,
    )
    IMAGE.save(imgio, "JPEG", quality=90)
    imgio.seek(0)
    return send_file(imgio, mimetype="image/jpeg")


@app.route("/api/plugin/awesome_karmen_led", methods=["GET"])
@cross_origin()
def get_lights():
    global STATE
    return jsonify({"color": STATE["lights_color"]}), 200


@app.route("/api/plugin/awesome_karmen_led", methods=["POST"])
@cross_origin()
def set_lights():
    global STATE
    STATE["lights_color"] = (
        [1, 1, 1] if STATE["lights_color"] == [0, 0, 0] else [0, 0, 0]
    )
    return jsonify({"status": "OK"}), 200


@app.route("/api/printer/tool", methods=["POST"])
@cross_origin()
def tool():
    global STATE
    data = request.json
    if data and data.get("targets"):
        STATE["temperature_tool"] = data.get("targets").get("tool0")
    return "", 204


@app.route("/api/printer/bed", methods=["POST"])
@cross_origin()
def bed():
    global STATE
    data = request.json
    if data and data.get("target"):
        STATE["temperature_bed"] = data.get("target")
    return "", 204


@app.route("/api/printer/printhead", methods=["POST"])
@cross_origin()
def printhead():
    global STATE
    data = request.json
    if data:
        for i in ["x", "y", "z"]:
            STATE[i] = STATE[i] + float(data.get(i, 0))
        for i in data.get("axes", []):
            STATE[i] = 100.0
    return "", 204


@app.route("/api/printer/command", methods=["POST"])
@cross_origin()
def command():
    global STATE
    data = request.json
    if "commands" in data:
        if data["commands"][0] == "M18":
            STATE["motors_state"] = "off"
        elif data["commands"][0] == "M106 S255":
            STATE["fan_state"] = "on"
        elif data["commands"][0] == "M106 S0":
            STATE["fan_state"] = "off"
    return "", 204


@app.route("/api/printer", methods=["GET"])
@cross_origin()
def printer():
    global STATE
    return jsonify(
        {
            "state": {"text": STATE["job_state"]},
            "temperature": {
                "bed": {
                    "actual": STATE["temperature_bed"],
                    "target": STATE["temperature_bed"],
                },
                "tool0": {
                    "actual": STATE["temperature_tool"],
                    "target": STATE["temperature_tool"],
                },
            },
        }
    )


@app.route("/karmen-pill-info/get")
def karmen_pill_info():
    return jsonify(
        {
            "networking": {
                "mode": "client",
                "ssid": "Printfarm-WiFi",
                "has_passphrase": False,
                "country": "CZ",
            },
            "system": {
                "karmen_version": "0.2.0",
                "karmen_version_hash": "cdcd7749e47dbaeea6482bd2b745eba4ac6c32ec 0.2.0",
                "hostname": "kpz-1016",
                "timezone": "Europe/Prague",
                "device_key": "206b22a3126644eb8dd73c8e276961c6",
                "update_status": None,
            },
        },
    )


