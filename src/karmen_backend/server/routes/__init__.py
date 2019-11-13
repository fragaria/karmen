import functools
from flask import jsonify, request, abort
from flask_cors import cross_origin
from flask_jwt_extended import jwt_required, get_jwt_claims, get_jwt_identity
from server import app, __version__
from server.database import users as db_users


def jwt_requires_role(required_role):
    def jwt_token_decorator(func):
        @functools.wraps(func)
        @jwt_required
        def wrap(*args, **kwargs):
            claims = get_jwt_claims()
            role = claims.get("role", None)
            if not role or role != required_role:
                return abort(401)
            # check current situation, the token might be from a role-change or user delete period
            admin_uuid = get_jwt_identity()
            user = db_users.get_by_uuid(admin_uuid)
            if not user:
                return abort(401)
            if user["role"] != required_role:
                return abort(401)
            return func(*args, **kwargs)

        return wrap

    return jwt_token_decorator


@app.route("/", methods=["GET", "OPTIONS"])
@cross_origin()
def index():
    return jsonify(
        {
            "app": "karmen_backend",
            "docs": "https://karmen.readthedocs.io",
            "version": __version__,
        }
    )


import server.routes.gcodes
import server.routes.octoprintemulator
import server.routes.printers
import server.routes.printjobs
import server.routes.settings
import server.routes.tasks
import server.routes.users
import server.routes.admin_users
