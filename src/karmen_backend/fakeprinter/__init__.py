import os

from flask import Flask, jsonify, request, abort, send_file
from flask_cors import CORS, cross_origin

__version__ = "0.0.0"
__author__ = "Jirka Chadima"
__copyright__ = "Copyright (C) 2019 Fragaria s.r.o. - Released under terms of AGPLv3 License"
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"

app = Flask(__name__)

CORS(app)

@app.route('/api/version', methods=['GET', 'OPTIONS'])
@cross_origin()
def version():
    return jsonify({
        'api': '0.1',
        'server': '0.0.1',
        'text': 'Fake octoprint'
    })

@app.route('/api/settings', methods=['GET', 'OPTIONS'])
@cross_origin()
def settings():
    return jsonify({
        'webcam': {
            'webcamEnabled': True,
            'streamUrl': '/stream',
            'flipH': False,
            'flipV': False,
            'rotate90': False,
        }
    })

@app.route('/api/printer', methods=['GET', 'OPTIONS'])
@cross_origin()
def printer():
    return jsonify({
        'state': {
            'text': 'Idle'
        },
        'temperature': {
            'bed': {
                'actual': 24.4,
                'target': 0.0
            },
            'tool0': {
                'actual': 25.7,
                'target': 0.0
            }
        }
    })

@app.route('/api/job', methods=['GET', 'OPTIONS'])
@cross_origin()
def job():
    return jsonify({
        'job': {
            'file': {
                'display': 'fake-file-being-printed.gcode',
            },
        },
        'progress': {
            'completion': 66.666,
            'printTimeLeft': 3685,
            'printTime': 532,
        }
    })

@app.route('/stream', methods=['GET', 'OPTIONS'])
@cross_origin()
def stream():
    # pic from https://www.pexels.com/photo/green-and-black-industrial-machine-1440504/
    dirname = os.path.dirname(__file__)
    return send_file(os.path.join(dirname, './printer.jpg'))
