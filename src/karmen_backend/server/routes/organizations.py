import uuid as guid
from slugify import slugify
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import get_current_user, fresh_jwt_required
from server import app
from server.database import organizations
from . import jwt_force_password_change, validate_org_access


@app.route("/organizations", methods=["POST"])
@cross_origin()
@fresh_jwt_required
@jwt_force_password_change
def create_organization():
    data = request.json
    if not data:
        return abort(make_response("", 400))
    name = data.get("name")
    if not name:
        return abort(make_response("", 400))
    uuid = guid.uuid4()
    slug = slugify(name)
    user = get_current_user()
    existing = organizations.get_by_slug(slug)
    if existing:
        return abort(make_response("", 409))

    organizations.add_organization(uuid=uuid, name=name, slug=slug)
    organizations.set_organization_role(uuid, user["uuid"], "admin")
    return jsonify({"uuid": uuid, "name": name, "slug": slug,}), 201


@app.route("/organizations/<org_uuid>", methods=["PATCH"])
@cross_origin()
@validate_org_access("admin")
@fresh_jwt_required
@jwt_force_password_change
def update_organization(org_uuid):
    data = request.json
    if not data:
        return abort(make_response("", 400))
    name = data.get("name")
    if not name:
        return abort(make_response("", 400))
    existing = organizations.get_by_uuid(org_uuid)
    if not existing:
        return abort(make_response("", 404))
    slug = slugify(name)
    existing = organizations.get_by_slug(slug)
    if existing:
        return abort(make_response("", 409))
    organizations.update_organization(uuid=org_uuid, name=name, slug=slug)
    return jsonify({"uuid": org_uuid, "name": name, "slug": slug,}), 200


@app.route("/organizations", methods=["GET"])
@cross_origin()
@jwt_force_password_change
def list_organizations():
    user = get_current_user()
    item_list = []
    for org in organizations.get_by_user_uuid(user["uuid"]):
        item_list.append(
            {
                "uuid": org["uuid"],
                "name": org["name"],
                "slug": org["slug"],
                "role": org["role"],
            }
        )
    return jsonify({"items": item_list}), 200
