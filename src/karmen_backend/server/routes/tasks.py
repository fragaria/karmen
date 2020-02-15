from flask import request, abort, make_response
from flask_cors import cross_origin
from server import app
from server.tasks.scan_network import scan_network
from . import jwt_force_password_change, validate_org_access


@app.route("/organizations/<org_uuid>/tasks", methods=["POST"])
@validate_org_access("admin")
@jwt_force_password_change
@cross_origin()
def enqueue_task(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    if "task" not in data:
        return abort(make_response("", 400))
    if data["task"] not in ["scan_network"]:
        return abort(make_response("", 400))
    if data["task"] == "scan_network":
        try:
            scan_network.delay(org_uuid, data.get("network_interface"))
        except Exception as e:
            app.logger.error("Cannot enqueue a task: %s", e)
            abort(500)
    return "", 202
