import bcrypt
from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from flask_jwt_extended import create_access_token, create_refresh_token
from server import app
from server.database import users, local_users

# This is intentionally not called login as we might use that for the OAuth process in the future
@app.route("/users/authenticate", methods=["POST", "OPTIONS"])
@cross_origin()
def authenticate():
    data = request.json
    if not data:
        return abort(400)
    username = data.get("username", None)
    password = data.get("password", None)
    if not username or not password:
        return abort(400)

    user = users.get_uuid_by_username(username)
    if not user:
        return abort(401)

    local = local_users.get_local_user(user["uuid"])
    if not local:
        return abort(401)
    if not bcrypt.checkpw(password.encode("utf8"), local["pwd_hash"].encode("utf8")):
        return abort(401)

    access_token = create_access_token(identity=user["uuid"], fresh=True)
    refresh_token = create_refresh_token(identity=user["uuid"])
    return jsonify(access_token=access_token, refresh_token=refresh_token), 200
