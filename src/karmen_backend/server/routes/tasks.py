from flask import request, abort
from flask_cors import cross_origin
from server import app
from server.tasks.scan_network import scan_network
from . import jwt_force_password_change, jwt_requires_role


@app.route("/tasks", methods=["POST", "OPTIONS"])
@jwt_requires_role("admin")
@jwt_force_password_change
@cross_origin()
def enqueue_task():
    data = request.json
    if not data:
        return abort(400)
    if "task" not in data:
        return abort(400)
    if data["task"] not in ["scan_network"]:
        return abort(400)
    if data["task"] == "scan_network":
        try:
            scan_network.delay()
        except Exception as e:
            app.logger.error("Cannot enqueue a task: %s", e)
            abort(500)
    return "", 202
