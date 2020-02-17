import uuid as guid
import bcrypt
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt_identity, fresh_jwt_required
from server import app
from server.database import users, local_users, organizations
from . import jwt_requires_system_role, jwt_force_password_change, validate_org_access


@app.route("/organizations/<org_uuid>/users", methods=["POST"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def create_user(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    username = data.get("username", None)
    org_role = data.get("role", None)
    password = data.get("password", None)
    password_confirmation = data.get("password_confirmation", None)
    if not username or not password or not org_role:
        return abort(make_response("", 400))
    if password != password_confirmation:
        return abort(make_response("", 400))
    if org_role not in ["admin", "user"]:
        return abort(make_response("", 400))
    existing = users.get_by_username(username)
    if existing is None:
        pwd_hash = bcrypt.hashpw(password.encode("utf8"), bcrypt.gensalt())
        user_uuid = guid.uuid4()
        users.add_user(
            uuid=user_uuid, username=username, system_role="user", providers=["local"]
        )
        local_users.add_local_user(
            user_uuid=user_uuid, pwd_hash=pwd_hash.decode("utf8"), force_pwd_change=True
        )
    else:
        user_uuid = existing.get("uuid", None)

    if organizations.get_organization_role(org_uuid, user_uuid):
        return abort(make_response("", 409))
    organizations.set_organization_role(org_uuid, user_uuid, org_role)
    return (
        jsonify({"uuid": str(user_uuid), "username": username, "role": org_role,}),
        201,
    )


@app.route("/organizations/<org_uuid>/users/<uuid>", methods=["PATCH"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def update_user(org_uuid, uuid):
    admin_uuid = get_jwt_identity()
    if admin_uuid == uuid:
        return abort(make_response("", 409))
    user_role = organizations.get_organization_role(org_uuid, uuid)
    user = users.get_by_uuid(uuid)
    if user is None or user_role is None:
        return abort(make_response("", 404))

    data = request.json
    if not data:
        return abort(make_response("", 400))

    role = data.get("role", user_role["role"])
    if role not in ["admin", "user"]:
        return abort(make_response("", 400))

    organizations.set_organization_role(org_uuid, uuid, role)
    return (
        jsonify({"uuid": user["uuid"], "username": user["username"], "role": role,}),
        200,
    )


@app.route("/organizations/<org_uuid>/users/<uuid>", methods=["DELETE"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def delete_user(org_uuid, uuid):
    admin_uuid = get_jwt_identity()
    if admin_uuid == uuid:
        return abort(make_response("", 409))
    user_role = organizations.get_organization_role(org_uuid, uuid)
    user = users.get_by_uuid(uuid)
    if user is None or user_role is None:
        return abort(make_response("", 404))

    organizations.drop_organization_role(org_uuid, uuid)
    return "", 204


@app.route("/organizations/<org_uuid>/users", methods=["GET"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def list_users(org_uuid):
    user_list = []
    users_record_set = organizations.get_all_users(org_uuid)
    response = {"items": user_list}
    users_metadata = {
        u["uuid"]: u
        for u in users.get_users_by_uuids([u["user_uuid"] for u in users_record_set])
    }
    for user in users_record_set:
        user_list.append(
            {
                "uuid": user["user_uuid"],
                "username": users_metadata[user["user_uuid"]]["username"],
                "role": user["role"],
            }
        )
    return jsonify(response), 200
