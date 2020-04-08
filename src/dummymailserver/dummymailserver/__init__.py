import io
import os
import re

from flask import Flask, jsonify, request
from flask_cors import CORS, cross_origin

__version__ = "@dev"
__author__ = "Jirka Chadima"
__copyright__ = (
    "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
)
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"

app = Flask(__name__)

CORS(app)

STATE = {}


@app.route("/mail", methods=["POST"])
@cross_origin()
def post_mail():
    global STATE
    data = request.json
    app.logger.info("GOT MAIL")
    app.logger.info(data)
    if "to" in data:
        recipients = data.get("to")
        if not isinstance(recipients, list):
            recipients = [recipients]
        for r in recipients:
            STATE[r] = data
        return "", 200
    return "", 400


@app.route("/mail/<recipient>", methods=["GET"])
@cross_origin()
def get_mail(recipient):
    global STATE
    return jsonify(STATE.get(recipient, {})), 200
