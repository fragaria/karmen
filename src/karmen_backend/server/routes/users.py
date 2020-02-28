import hashlib
from datetime import datetime, timedelta
import uuid as guid
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_jwt_identity, fresh_jwt_required, get_current_user
from server import app
from server.database import users, organizations, api_tokens, organization_roles
from server.services.validators import is_email
from server.tasks.send_mail import send_mail
from . import jwt_force_password_change, validate_org_access


@app.route("/organizations/<org_uuid>/users", methods=["POST"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def add_user_to_org(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    email = data.get("email", None)
    org_role = data.get("role", None)
    if not email or not org_role:
        return abort(make_response("", 400))
    if org_role not in ["admin", "user"]:
        return abort(make_response("", 400))
    email = email.lstrip().rstrip().lower()
    if not is_email(email):
        return abort(make_response("", 400))

    existing = users.get_by_email(email)
    # completely new user
    if existing is None:
        user_uuid = guid.uuid4()
        activation_key = guid.uuid4()
        activation_key_expires = datetime.now().astimezone() + timedelta(hours=24)
        users.add_user(
            uuid=user_uuid,
            email=email,
            username=email,
            system_role="user",
            providers=[],
            activation_key_hash=hashlib.sha256(
                str(activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=activation_key_expires,
        )
    else:
        user_uuid = existing.get("uuid", None)
        # an activated account that already has a role in this organization
        if (
            organization_roles.get_organization_role(org_uuid, user_uuid)
            and existing["activated"]
        ):
            return abort(make_response("", 409))
        # an account that is not activated but has already been sent an invite
        activation_key = guid.uuid4()
        activation_key_expires = datetime.now().astimezone() + timedelta(hours=24)
        users.update_user(
            uuid=user_uuid,
            activation_key_hash=hashlib.sha256(
                str(activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=activation_key_expires,
        )

    organization = organizations.get_by_uuid(org_uuid)
    organization_roles.set_organization_role(org_uuid, user_uuid, org_role)
    if existing is None or existing["activated"] is None:
        send_mail.delay(
            [email],
            "REGISTRATION_VERIFICATION_EMAIL",
            {
                "activation_key": activation_key,
                "activation_key_expires": int(activation_key_expires.timestamp()),
                "email": email,
                "inviter_username": get_current_user()["username"],
                "organization_name": organization["name"],
                "organization_uuid": organization["uuid"],
            },
        )
    else:
        send_mail.delay(
            [email],
            "ORGANIZATION_INVITATION",
            {
                "email": email,
                "inviter_username": get_current_user()["username"],
                "organization_name": organization["name"],
                "organization_uuid": organization["uuid"],
            },
        )
    return (
        jsonify(
            {
                "uuid": str(user_uuid),
                "username": email,
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
    user_role = organization_roles.get_organization_role(org_uuid, uuid)
    user = users.get_by_uuid(uuid)
    if user is None or user_role is None:
        return abort(make_response("", 404))

    data = request.json
    if not data:
        return abort(make_response("", 400))

    role = data.get("role", user_role["role"])
    if role not in ["admin", "user"]:
        return abort(make_response("", 400))

    organization_roles.set_organization_role(org_uuid, uuid, role)
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
    user_role = organization_roles.get_organization_role(org_uuid, uuid)
    user = users.get_by_uuid(uuid)
    if user is None or user_role is None:
        return abort(make_response("", 404))
    organization = organizations.get_by_uuid(org_uuid)
    api_tokens.revoke_all_tokens(uuid, org_uuid)
    organization_roles.drop_organization_role(org_uuid, uuid)
    send_mail.delay(
        [user["email"]],
        "ORGANIZATION_REMOVAL",
        {
            "email": user["email"],
            "inviter_username": get_current_user()["username"],
            "organization_name": organization["name"],
            "organization_uuid": organization["uuid"],
        },
    )
    return "", 204


@app.route("/organizations/<org_uuid>/users", methods=["GET"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def list_users(org_uuid):
    user_list = []
    users_record_set = organization_roles.get_all_users(org_uuid)
    response = {"items": user_list}
    users_metadata = {
        u["uuid"]: u
        for u in users.get_users_by_uuids([u["user_uuid"] for u in users_record_set])
    }
    for user in users_record_set:
        user_list.append(
            {
                "uuid": user["user_uuid"],
                "activated": users_metadata[user["user_uuid"]]["activated"] is not None,
                "username": users_metadata[user["user_uuid"]]["username"],
                "email": users_metadata[user["user_uuid"]]["email"],
                "role": user["role"],
            }
        )
    return jsonify(response), 200
