from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from server import app
from server.database import settings
from . import jwt_force_password_change, jwt_requires_system_role

CONFIGURABLE_SETTINGS = ["NETWORK_INTERFACE"]


@app.route("/settings", methods=["GET"])
@jwt_force_password_change
@cross_origin()
def settings_list():
    props = {n.lower(): app.config[n] for n in CONFIGURABLE_SETTINGS}
    for option in settings.get_all_settings():
        if option["key"] in props:
            props[option["key"]] = option["val"]
    lst = []
    for key, val in props.items():
        lst.append({"key": key, "val": settings.normalize_val(val)})
    return jsonify(lst)


@app.route("/settings", methods=["POST"])
@jwt_requires_system_role("admin")
@jwt_force_password_change
@cross_origin()
def settings_change():
    data = request.json
    if not data:
        return abort(make_response("", 400))
    # Doing this in two passes ensures no partial updates happen
    props = {n.lower(): app.config[n] for n in CONFIGURABLE_SETTINGS}
    for row in data:
        if not "key" in row or not "val" in row or row["key"] not in props:
            return abort(make_response("", 400))
    for row in data:
        settings.upsert_val(row["key"], row["val"])
    return "", 201
