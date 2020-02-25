import uuid as guid
import bcrypt
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt_identity, fresh_jwt_required
from server import app
from server.database import users, local_users, organizations, api_tokens
from . import jwt_requires_system_role, jwt_force_password_change, validate_org_access


@app.route("/organizations/<org_uuid>/users", methods=["POST"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def add_user_to_org(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    username = data.get("username", None)
    email = data.get("email", None)
    org_role = data.get("role", None)
    if not email or not org_role:
        return abort(make_response("", 400))
    # TODO validate email
    if not username:
        username = email
    if org_role not in ["admin", "user"]:
        return abort(make_response("", 400))
    existing = users.get_by_username(username)
    if existing is None:
        # TODO create invite, send e-mail
        user_uuid = guid.uuid4()
        users.add_user(
            uuid=user_uuid,
            username=username,
            email=email,
            system_role="user",
            providers=["local"],
        )
        # TODO drop this line
        local_users.add_local_user(
            user_uuid=user_uuid,
            pwd_hash="123456 TODO change me",
            force_pwd_change=False,
        )
    else:
        # TODO create invite, send e-mail
        user_uuid = existing.get("uuid", None)
        if organizations.get_organization_role(org_uuid, user_uuid):
            return abort(make_response("", 409))

    organizations.set_organization_role(org_uuid, user_uuid, org_role)
    # TODO add invite-pending or state-pending
    return (
        jsonify(
            {
                "uuid": str(user_uuid),
                "username": username,
                "email": email,
                "role": org_role,
            }
        ),
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
        jsonify(
            {
                "uuid": user["uuid"],
                "username": user["username"],
                "email": user["email"],
                "role": role,
            }
        ),
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
    api_tokens.revoke_all_tokens(uuid, org_uuid)
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
                "email": users_metadata[user["user_uuid"]]["email"],
                "role": user["role"],
            }
        )
    return jsonify(response), 200
