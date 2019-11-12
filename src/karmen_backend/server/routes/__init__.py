from flask import jsonify, request, abort
from flask_cors import cross_origin
from server import app, __version__


@app.route("/", methods=["GET", "OPTIONS"])
@cross_origin()
def index():
    return jsonify(
        {
            "app": "karmen_backend",
            "docs": "https://karmen.readthedocs.io",
            "version": __version__,
        }
    )


import server.routes.gcodes
import server.routes.octoprintemulator
import server.routes.printers
import server.routes.printjobs
import server.routes.settings
import server.routes.tasks
import server.routes.users
