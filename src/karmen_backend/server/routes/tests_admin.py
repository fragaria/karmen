import server.models as models
from server import app
import functools
from flask import jsonify, request, abort, make_response
import json
from server.database import organization_roles, users, organizations
import uuid as guid

from server.services.mailer.templates.registration_verification import encode_activation_token


def local_tests_mode_required(func):
    @functools.wraps(func)
    def wrap(*args, **kwargs):
        local_tests_token = request.headers.get("X-local-tests-token")
        if not app.config.get(
            "LOCAL_TESTS_TOKEN"
        ) or local_tests_token != app.config.get("LOCAL_TESTS_TOKEN"):
            return abort(make_response(jsonify(message="Unauthorized"), 403))
        return func(*args, **kwargs)

    return wrap


# /tests-admin/users/create, POST
@local_tests_mode_required
def create_test_user():
    email = request.json.get("email")
    password = request.json.get("password")
    new_user = models.users_me.create_tests_user(email=email, password=password)
    new_user["detail"] = dict(users.get_by_uuid(new_user["user_uuid"]))
    # These 2 are datetimes objects from Postgres and can't be
    # serialized to JSON without extra work, so they crash the server here.
    # As we don't need them, it's easier to pop them.
    new_user["detail"].pop("activated")
    new_user["detail"].pop("activation_key_expires")
    app.logger.debug(organization_roles.get_by_user_uuid(new_user["user_uuid"]))
    new_user["organizations"] = [dict(x) for x in organization_roles.get_by_user_uuid(new_user["user_uuid"])]

    return make_response(json.dumps(new_user), 201 if new_user["activated"] else 400)


# /tests-admin/users/register, POST
@local_tests_mode_required
def register_test_user():
    email = request.json.get("email")
    inactive_user = models.users_me.create_inactive_user(email)

    token_variables = {
        "activation_key": str(inactive_user["activation_key"]),
        "activation_key_expires": str(inactive_user["activation_key_expires"]),
        "email": email
    }

    return make_response(json.dumps({
        "activation_key": encode_activation_token(token_variables)
    }), 201)


# /tests-admin/organizations, POST
@local_tests_mode_required
def create_organization():
    name = request.json.get("name")
    uuid = guid.uuid4()
    name = name.lstrip().rstrip()
    organizations.add_organization(uuid=uuid, name=name)
    return make_response(jsonify(name=name, uuid=uuid), 201)


#  /tests-admin/organizations/{org_uuid}/users, post
@local_tests_mode_required
def add_user_to_org(org_uuid):
    user_uuid = request.json.get("uuid")
    org_role = request.json.get("role")

    user = users.get_by_uuid(user_uuid)
    if not user:
        return make_response("User does not exist", 400)
    if not organizations.get_by_uuid(org_uuid):
        return make_response("Organization does not exist", 400)

    if organization_roles.get_organization_role(org_uuid, user_uuid) is not None:
        return make_response("User is already in organization", 400)

    organization_roles.set_organization_role(org_uuid, user_uuid, org_role)
    return make_response("", 200)


# /tests-admin/organizations/{org_uuid}/users, DELETE
@local_tests_mode_required
def remove_user_from_org(org_uuid):
    user_uuid = request.json.get("uuid")
    organization_roles.drop_organization_role(org_uuid, user_uuid)
    return make_response("", 204)

