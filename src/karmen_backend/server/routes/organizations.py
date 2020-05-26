import uuid as guid
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user, fresh_jwt_required
from server import app
from server.database import organizations, organization_roles
from . import jwt_force_password_change, validate_org_access


# /organizations, POST
@cross_origin()
@fresh_jwt_required
@jwt_force_password_change
def create_organization():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    name = data.get("name")
    if not name:
        return abort(make_response(jsonify(message="Missing name"), 400))
    uuid = guid.uuid4()
    user = get_current_user()
    name = name.lstrip().rstrip()
    organizations.add_organization(uuid=uuid, name=name)
    organization_roles.set_organization_role(uuid, user["uuid"], "admin")
    return jsonify({"uuid": uuid, "name": name}), 201


# /organizations/<org_uuid>, PATCH
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def update_organization(org_uuid):
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    name = data.get("name")
    if not name:
        return abort(make_response(jsonify(message="Missing name"), 400))
    existing = organizations.get_by_uuid(org_uuid)
    if not existing:
        return abort(make_response(jsonify(message="Not found"), 404))
    organizations.update_organization(uuid=org_uuid, name=name)
    return jsonify({"uuid": org_uuid, "name": name}), 200


# /organizations, GET
@cross_origin()
@jwt_force_password_change
def list_organizations():
    user = get_current_user()
    item_list = []
    for org in organization_roles.get_by_user_uuid(user["uuid"]):
        item_list.append(
            {"uuid": org["uuid"], "name": org["name"], "role": org["role"],}
        )
    return jsonify({"items": item_list}), 200
