import functools
import uuid
import bcrypt
from flask import jsonify, request, abort
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_claims, get_jwt_identity
from server import app, jwt
from server.database import users, local_users


def jwt_admin_required(func):
    @functools.wraps(func)
    @jwt_required
    def wrap(*args, **kwargs):
        claims = get_jwt_claims()
        role = claims.get("role", None)
        if not role or role != "admin":
            return abort(401)
        # check current situation, the token might be from a role-change or user delete period
        admin_uuid = get_jwt_identity()
        user = users.get_by_uuid(admin_uuid)
        if not user:
            return abort(401)
        if user["role"] != "admin":
            return abort(401)
        return func(*args, **kwargs)

    return wrap


@app.route("/admin/users", methods=["POST", "OPTIONS"])
@jwt_admin_required
def create_user():
    data = request.json
    if not data:
        return abort(400)
    username = data.get("username", None)
    role = data.get("role", None)
    password = data.get("password", None)
    password_confirmation = data.get("password_confirmation", None)
    if not username or not password or not role:
        return abort(400)
    if password != password_confirmation:
        return abort(400)
    if role not in ["admin", "user"]:
        return abort(400)
    if users.get_by_username(username) is not None:
        return abort(409)

    pwd_hash = bcrypt.hashpw(password.encode("utf8"), bcrypt.gensalt())
    new_uuid = uuid.uuid4()
    users.add_user(
        uuid=str(new_uuid), username=username, role=role, providers=["local"]
    )
    local_users.add_local_user(
        uuid=str(new_uuid), pwd_hash=pwd_hash.decode("utf8"), force_pwd_change=True
    )
    return "", 201


# @app.route("/admin/users", methods=["PUT", "OPTIONS"])
# set disabled, set role

# @app.route("/admin/users", methods=["GET", "OPTIONS"])
# list users
