import uuid
import bcrypt
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt_identity, fresh_jwt_required
from server import app
from server.database import users, local_users
from . import jwt_requires_role, jwt_force_password_change


@app.route("/admin/users", methods=["POST"])
@cross_origin()
@jwt_requires_role("admin")
@fresh_jwt_required
@jwt_force_password_change
def create_user():
    data = request.json
    if not data:
        return abort(make_response("", 400))
    username = data.get("username", None)
    role = data.get("role", None)
    password = data.get("password", None)
    password_confirmation = data.get("password_confirmation", None)
    if not username or not password or not role:
        return abort(make_response("", 400))
    if password != password_confirmation:
        return abort(make_response("", 400))
    if role not in ["admin", "user"]:
        return abort(make_response("", 400))
    if users.get_by_username(username) is not None:
        return abort(make_response("", 409))

    pwd_hash = bcrypt.hashpw(password.encode("utf8"), bcrypt.gensalt())
    new_uuid = uuid.uuid4()
    users.add_user(uuid=new_uuid, username=username, role=role, providers=["local"])
    local_users.add_local_user(
        user_uuid=new_uuid, pwd_hash=pwd_hash.decode("utf8"), force_pwd_change=True
    )
    return (
        jsonify(
            {
                "uuid": str(new_uuid),
                "username": username,
                "role": role,
                "suspended": False,
            }
        ),
        201,
    )


@app.route("/admin/users/<uuid>", methods=["PATCH"])
@cross_origin()
@jwt_requires_role("admin")
@fresh_jwt_required
@jwt_force_password_change
def update_user(uuid):
    admin_uuid = get_jwt_identity()
    if admin_uuid == uuid:
        return abort(make_response("", 409))
    user = users.get_by_uuid(uuid)
    if user is None:
        return abort(make_response("", 404))

    data = request.json
    if not data:
        return abort(make_response("", 400))

    role = data.get("role", user["role"])
    suspended = data.get("suspended", user["suspended"])
    if role not in ["admin", "user"]:
        return abort(make_response("", 400))

    user["role"] = role
    user["suspended"] = suspended
    users.update_user(**user)
    return (
        jsonify(
            {
                "uuid": user["uuid"],
                "username": user["username"],
                "role": role,
                "suspended": suspended,
            }
        ),
        200,
    )


def make_user_response(user):
    return {
        "uuid": user["uuid"],
        "username": user["username"],
        "role": user["role"],
        "suspended": user["suspended"],
    }


@app.route("/admin/users", methods=["GET"])
@cross_origin()
@jwt_requires_role("admin")
@fresh_jwt_required
@jwt_force_password_change
def list_users():
    user_list = []
    order_by = request.args.get("order_by", "")
    if "," in order_by:
        return abort(make_response("", 400))
    try:
        limit = int(request.args.get("limit", 200))
        if limit and limit < 0:
            limit = 200
    except ValueError:
        limit = 200
    try:
        start_with = (
            uuid.UUID(request.args.get("start_with"), version=4)
            if request.args.get("start_with")
            else None
        )
    except ValueError:
        start_with = None
    filter_crit = request.args.get("filter", None)
    users_record_set = users.get_users(
        order_by=order_by, limit=limit, start_with=start_with, filter=filter_crit
    )
    response = {"items": user_list}
    next_record = None
    if len(users_record_set) > int(limit):
        next_record = users_record_set[-1]
        users_record_set = users_record_set[0:-1]
    for user in users_record_set:
        user_list.append(make_user_response(user))

    next_href = "/admin/users"
    parts = ["limit=%s" % limit]
    if order_by:
        parts.append("order_by=%s" % order_by)
    if filter_crit:
        parts.append("filter=%s" % filter_crit)
    if next_record:
        parts.append("start_with=%s" % next_record["uuid"])
        response["next"] = (
            "%s?%s" % (next_href, "&".join(parts)) if parts else next_href
        )

    return jsonify(response), 200
