import functools
import uuid as guid
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_claims, get_current_user
from server import app, jwt, __version__
from server.database import (
    users as db_users,
    local_users as db_local_users,
    api_tokens,
    organizations as db_organizations,
)


def validate_org_access(required_role=None):
    def validate_org_decorator(func):
        @functools.wraps(func)
        @jwt_required
        def wrap(org_uuid, *args, **kwargs):
            try:
                guid.UUID(org_uuid, version=4)
            except ValueError:
                return abort(make_response("", 400))
            user = get_current_user()
            if not user:
                return abort(make_response("", 401))
            role = db_organizations.get_organization_role(org_uuid, user["uuid"])
            if role is None:
                return abort(
                    make_response(
                        jsonify(message="Cannot access this organization"), 403
                    )
                )
            if required_role is not None and role["role"] != required_role:
                return abort(
                    make_response(
                        jsonify(
                            message="User does not have the required system role of %s"
                            % required_role
                        ),
                        403,
                    )
                )
            return func(org_uuid, *args, **kwargs)

        return wrap

    return validate_org_decorator


def jwt_requires_system_role(required_role):
    def jwt_token_decorator(func):
        @functools.wraps(func)
        @jwt_required
        def wrap(*args, **kwargs):
            if request.method == "OPTIONS":
                return func(*args, **kwargs)
            user = get_current_user()
            if not user:
                return abort(make_response("", 401))
            if user["system_role"] != required_role or user["system_role"] != "admin":
                return abort(
                    make_response(
                        jsonify(
                            message="User does not have the required system role of %s or admin"
                            % required_role
                        ),
                        401,
                    )
                )
            return func(*args, **kwargs)

        return wrap

    return jwt_token_decorator


def jwt_force_password_change(func):
    @functools.wraps(func)
    @jwt_required
    def wrap(*args, **kwargs):
        if request.method == "OPTIONS":
            return func(*args, **kwargs)
        claims = get_jwt_claims()
        force_pwd_change = claims.get("force_pwd_change", None)
        user = get_current_user()
        if not user:
            return abort(make_response("", 401))
        if "local" in user["providers"] and force_pwd_change:
            luser = db_local_users.get_local_user(user["uuid"])
            if luser["force_pwd_change"]:
                return abort(
                    make_response(
                        jsonify(message="Password change is enforced on this account!"),
                        401,
                    )
                )
        return func(*args, **kwargs)

    return wrap


@jwt.user_claims_loader
def add_claims_to_access_token(user):
    return {
        "username": user.get("username"),
        "email": user.get("email"),
        "force_pwd_change": user.get("force_pwd_change", False),
    }


@jwt.token_in_blacklist_loader
def check_if_token_revoked(decrypted_token):
    # check only tokens without expiration, this can be extended in
    # the future in exchange for a decreased performance
    if "exp" not in decrypted_token:
        token = api_tokens.get_token(decrypted_token["jti"])
        if token and token["revoked"]:
            return True
    return False


@jwt.user_identity_loader
def user_identity_lookup(user):
    return user["uuid"]


@jwt.user_loader_callback_loader
def user_loader_callback(identity):
    user = db_users.get_by_uuid(identity)
    if user["suspended"]:
        return abort(
            make_response(jsonify(message="This account has been suspended"), 401)
        )
    return user


@app.route("/", methods=["GET"])
@cross_origin()
def index():
    return jsonify(
        {
            "app": "karmen_backend",
            "docs": "https://karmen.readthedocs.io",
            "version": __version__,
        }
    )


@app.route("/sentry-report")
@cross_origin()
def trigger_error():
    division_by_zero = 1 / 0


# me has to come before users
import server.routes.users_me
import server.routes.octoprintemulator
import server.routes.organizations
import server.routes.gcodes
import server.routes.printers
import server.routes.printjobs
import server.routes.tasks
import server.routes.users
