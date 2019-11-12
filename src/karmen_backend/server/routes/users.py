import bcrypt
from flask import jsonify, request, abort, send_file
from flask_cors import cross_origin
from flask_jwt_extended import create_access_token, create_refresh_token
from server import app, jwt
from server.database import users, local_users


@jwt.user_claims_loader
def add_claims_to_access_token(user):
    return {
        "role": user["role"],
        "force_pwd_change": user.get("force_pwd_change", False),
    }


@jwt.user_identity_loader
def user_identity_lookup(user):
    return user["uuid"]


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

    # TODO check for disabled users
    user = users.get_by_username(username)
    if not user:
        return abort(401)

    local = local_users.get_local_user(user["uuid"])
    if not local:
        return abort(401)
    if not bcrypt.checkpw(password.encode("utf8"), local["pwd_hash"].encode("utf8")):
        return abort(401)

    userdata = dict(user)
    userdata.update(local)
    access_token = create_access_token(identity=userdata, fresh=True)
    refresh_token = create_refresh_token(identity=userdata)
    return jsonify(access_token=access_token, refresh_token=refresh_token), 200
