import hashlib
from datetime import datetime, timedelta
import uuid as guid
import bcrypt
from werkzeug.exceptions import BadRequest, Unauthorized
from flask import jsonify, request, abort, make_response
from flask_cors import cross_origin
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    fresh_jwt_required,
    jwt_refresh_token_required,
    get_jwt_identity,
    get_current_user,
    decode_token,
    set_access_cookies,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from server import app
from server.database import (
    users,
    local_users,
    api_tokens,
    organizations,
    organization_roles,
)
from server.services.validators import is_email
from server.tasks.send_mail import send_mail
import server.models as models

ACCESS_TOKEN_EXPIRES_AFTER = timedelta(minutes=15)
REFRESH_TOKEN_EXPIRES_AFTER = timedelta(days=7)


# registers new user - does not save any password
# /users/me, POST
def create_inactive_user():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    email = data.get("email", "").lstrip().rstrip().lower()
    if not email or not is_email(email):
        return abort(make_response(jsonify(message="Missing or bad email"), 400))

    new_user = models.users_me.create_inactive_user(email=email)

    if new_user["created"]:
        send_mail.delay(
            [email],
            "REGISTRATION_VERIFICATION_EMAIL",
            {
                "activation_key": new_user["activation_key"],
                "activation_key_expires": int(
                    new_user["activation_key_expires"].timestamp()
                ),
                "email": email,
            },
        )
    return "", 202


# sets a first password to a user
# /users/me/activate, POST
def activate_user():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    email = data.get("email", "").lstrip().rstrip().lower()
    activation_key = data.get("activation_key", None)
    password = data.get("password", None)
    password_confirmation = data.get("password_confirmation", None)

    activated_user = models.users_me.activate_user(
        email=email,
        activation_key=activation_key,
        password=password,
        password_confirmation=password_confirmation,
    )

    if activated_user["activated"]:
        return "", 204
    else:
        if activated_user.get("already_activated", False):
            return abort(make_response(jsonify(message=activated_user["message"]), 409))
        return abort(make_response(jsonify(message=activated_user["message"]), 400))


# /users/me/request-password-reset, POST
def request_password_reset():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    email = data.get("email", "").lstrip().rstrip().lower()
    if not email or not is_email(email):
        return abort(make_response(jsonify(message="Missing or bad email"), 400))
    existing = users.get_by_email(email)
    # we are not leaking used or unused e-mails, that's why this responds 202
    if not existing or existing["activated"] is None:
        return "", 202
    local = local_users.get_local_user(existing["uuid"])
    if not local:
        return abort(
            make_response(jsonify(message="User does not have a password"), 400)
        )
    pwd_reset_key = guid.uuid4()
    pwd_reset_key_expires = datetime.now().astimezone() + timedelta(hours=1)
    local_users.update_local_user(
        user_uuid=existing["uuid"],
        pwd_reset_key_hash=hashlib.sha256(
            str(pwd_reset_key).encode("utf-8")
        ).hexdigest(),
        pwd_reset_key_expires=pwd_reset_key_expires,
    )
    send_mail.delay(
        [email],
        "PASSWORD_RESET_LINK",
        {
            "pwd_reset_key": pwd_reset_key,
            "pwd_reset_key_expires": int(pwd_reset_key_expires.timestamp()),
            "email": email,
        },
    )
    return "", 202


# /users/me/reset-password, POST
def reset_password():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    email = data.get("email", "").lstrip().rstrip().lower()
    pwd_reset_key = data.get("pwd_reset_key", None)
    password = data.get("password", None)
    password_confirmation = data.get("password_confirmation", None)

    if not email or not is_email(email):
        return abort(make_response(jsonify(message="Missing or bad email"), 400))
    if not password:
        return abort(make_response(jsonify(message="Missing password"), 400))
    if not pwd_reset_key:
        return abort(make_response(jsonify(message="Missing reset key"), 400))
    if password != password_confirmation:
        return abort(make_response(jsonify(message="Password mismatch"), 400))

    existing = users.get_by_email(email)
    if not existing:
        return abort(make_response(jsonify(message="Cannot reset"), 400))
    local = local_users.get_local_user(existing["uuid"])
    if not local:
        return abort(
            make_response(jsonify(message="User does not have a password"), 400)
        )

    if (
        hashlib.sha256(str(pwd_reset_key).encode("utf-8")).hexdigest()
        != local["pwd_reset_key_hash"]
    ):
        return abort(make_response(jsonify(message="Cannot reset"), 400))
    if local["pwd_reset_key_expires"] < datetime.now().astimezone():
        return abort(make_response(jsonify(message="Reset key expired"), 400))

    pwd_hash = bcrypt.hashpw(password.encode("utf8"), bcrypt.gensalt())
    local_users.update_local_user(
        user_uuid=existing["uuid"],
        pwd_hash=pwd_hash.decode("utf8"),
        pwd_reset_key_hash=None,
        pwd_reset_key_expires=None,
        force_pwd_change=False,
    )
    send_mail.delay(
        [email], "PASSWORD_RESET_CONFIRMATION", {"email": email,},
    )
    return "", 204


def get_user_identity(userdata, token_freshness):
    membership = {}
    for org in organization_roles.get_by_user_uuid(userdata.get("uuid")):
        membership[org.get("uuid")] = {
            "uuid": org.get("uuid"),
            "name": org.get("name"),
            "role": org.get("role"),
        }
    return {
        "identity": userdata.get("uuid"),
        "system_role": userdata.get("system_role", "user"),
        "username": userdata.get("username"),
        "email": userdata.get("email"),
        "force_pwd_change": userdata.get("force_pwd_change", False),
        "fresh": token_freshness,
        "expires_on": datetime.now() + ACCESS_TOKEN_EXPIRES_AFTER,
        "organizations": membership,
    }


def authenticate_base(include_refresh_token):
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    username = data.get("username", None)
    password = data.get("password", None)
    if not username or not password:
        raise BadRequest("Missing username or password in request body.")
    user = users.get_by_email(username.lstrip().rstrip().lower())
    # fallback to legacy username login
    if not user:
        user = users.get_by_username(username)
    if not user:
        raise Unauthorized("Invalid credentials.")

    if user["suspended"]:
        raise Unauthorized("Account suspended")

    local = local_users.get_local_user(user["uuid"])
    if not local:
        raise Unauthorized("Invalid credentials.")
    if not bcrypt.checkpw(password.encode("utf8"), local["pwd_hash"].encode("utf8")):
        raise Unauthorized("Invalid credentials.")
    # drop reset pwd key if any
    if local["pwd_reset_key_hash"]:
        local_users.update_local_user(
            user_uuid=user["uuid"], pwd_reset_key_hash=None, pwd_reset_key_expires=None
        )

    userdata = dict(user)
    userdata.update(local)
    response = jsonify(get_user_identity(userdata, True))
    access_token = create_access_token(
        identity=userdata, fresh=True, expires_delta=ACCESS_TOKEN_EXPIRES_AFTER
    )
    set_access_cookies(response, access_token)
    if include_refresh_token:
        refresh_token = create_refresh_token(
            identity=userdata, expires_delta=REFRESH_TOKEN_EXPIRES_AFTER
        )
        set_refresh_cookies(response, refresh_token, 7 * 24 * 60 * 60)
    return response, 200


# This is intentionally not called login as we might use that for the OAuth process in the future
# This returns a fresh access token and a refresh token
# /users/me/authenticate, POST
@cross_origin()
def authenticate():
    return authenticate_base(True)


# This returns a fresh access token and no refresh token
# /users/me/authenticate-fresh, POST
@cross_origin()
def authenticate_fresh():
    return authenticate_base(False)


# This returns a non fresh access token and no refresh token
# /users/me/authenticate-refresh, POST
@jwt_refresh_token_required
def authenticate_refresh():
    user = get_current_user()
    if not user:
        return abort(make_response(jsonify(message="Unauthorized"), 401))

    local = local_users.get_local_user(user["uuid"])
    if not local:
        return abort(make_response(jsonify(message="Unauthorized"), 401))
    userdata = dict(user)
    userdata.update(local)
    response = jsonify(get_user_identity(userdata, False))
    access_token = create_access_token(
        identity=userdata, fresh=False, expires_delta=ACCESS_TOKEN_EXPIRES_AFTER
    )
    set_access_cookies(response, access_token)
    return response, 200


# /users/me/logout, POST
def logout():
    response = jsonify({"logout": True})
    unset_jwt_cookies(response)
    return response, 200


# This returns fresh access_token with reset force_pwd_change user claim
# Token is fresh, because you already need a fresh one to call this method
# /users/me/password, PATCH
@cross_origin()
@jwt_required
@fresh_jwt_required
def change_password():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    password = data.get("password", None)
    new_password = data.get("new_password", None)
    new_password_confirmation = data.get("new_password_confirmation", None)
    if (
        not password
        or not new_password
        or not new_password_confirmation
        or new_password != new_password_confirmation
    ):
        return abort(make_response(jsonify(message="Password issues"), 400))

    user = get_current_user()
    if not user:
        return abort(make_response(jsonify(message="Unauthorized"), 401))

    local = local_users.get_local_user(user["uuid"])
    if not local:
        return abort(make_response(jsonify(message="Unauthorized"), 401))

    if not bcrypt.checkpw(password.encode("utf8"), local["pwd_hash"].encode("utf8")):
        return abort(make_response(jsonify(message="Unauthorized"), 401))

    pwd_hash = bcrypt.hashpw(new_password.encode("utf8"), bcrypt.gensalt())
    local_users.update_local_user(
        pwd_hash=pwd_hash.decode("utf8"), force_pwd_change=False, user_uuid=user["uuid"]
    )
    userdata = dict(user)

    response = jsonify(get_user_identity(userdata, True))
    access_token = create_access_token(
        identity=userdata, fresh=True, expires_delta=ACCESS_TOKEN_EXPIRES_AFTER
    )
    set_access_cookies(response, access_token)
    return response, 200


# /users/me, PATCH
@cross_origin()
@jwt_required
@fresh_jwt_required
def patch_user():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    username = data.get("username", None)
    if not username:
        return abort(make_response(jsonify(message="Missing username"), 400))

    user = get_current_user()
    if not user:
        return abort(make_response(jsonify(message="Unauthorized"), 401))

    existing = users.get_by_username(username)
    if existing and existing["uuid"] != user["uuid"]:
        return abort(make_response(jsonify(message="Cannot patch"), 400))

    users.update_user(uuid=user["uuid"], username=username)
    userdata = dict(user)
    userdata["username"] = username
    response = jsonify(get_user_identity(userdata, True))
    return response, 200


# /users/me/tokens, GET
@cross_origin()
@jwt_required
@fresh_jwt_required
def list_api_tokens():
    items = []
    tokens = api_tokens.get_tokens_for_user_uuid(get_jwt_identity(), revoked=False)
    org_mapping = {
        o["uuid"]: o["name"]
        for o in organizations.get_organizations_by_uuids(
            [t["organization_uuid"] for t in tokens]
        )
    }
    for token in tokens:
        items.append(
            {
                "jti": token["jti"],
                "name": token["name"],
                "organization": {
                    "uuid": token["organization_uuid"],
                    "name": org_mapping[token["organization_uuid"]],
                },
                "created": token["created"].isoformat(),
            }
        )
    return jsonify({"items": items}), 200


# /users/me/tokens, POST
@cross_origin()
@jwt_required
@fresh_jwt_required
def create_api_token():
    data = request.json
    if not data:
        return abort(make_response(jsonify(message="Missing payload"), 400))
    name = data.get("name", None)
    if not name:
        return abort(make_response(jsonify(message="Missing name"), 400))
    org_uuid = data.get("organization_uuid", None)
    if not org_uuid:
        return abort(make_response(jsonify(message="Missing organization_uuid"), 400))

    user = get_current_user()
    if not user:
        return abort(make_response(jsonify(message="Unauthorized"), 401))
    is_member = organization_roles.get_organization_role(org_uuid, user["uuid"])
    if not is_member:
        return abort(make_response(jsonify(message="Unauthorized"), 401))
    organization = organizations.get_by_uuid(org_uuid)
    token = create_access_token(
        identity=user,
        expires_delta=False,
        user_claims={
            "username": user.get("username"),
            "email": user.get("email"),
            "organization_uuid": organization["uuid"],
            "organization_name": organization["name"],
        },
    )
    jti = decode_token(token)["jti"]
    api_tokens.add_token(
        user_uuid=user["uuid"], jti=jti, name=name, organization_uuid=org_uuid
    )
    response = {
        "access_token": token,
        "name": name,
        "jti": jti,
        "organization": {"uuid": organization["uuid"], "name": organization["name"],},
        "created": datetime.now().isoformat(),
    }
    return jsonify(response), 201


# /users/me/tokens/<jti>, DELETE
@cross_origin()
@jwt_required
@fresh_jwt_required
def revoke_api_token(jti):
    token = api_tokens.get_token(jti)
    if token is None or token["revoked"]:
        return abort(make_response(jsonify(message="Not found"), 404))
    if get_jwt_identity() != token["user_uuid"]:
        return abort(make_response(jsonify(message="Unauthorized"), 401))
    api_tokens.revoke_token(jti)
    return "", 204
