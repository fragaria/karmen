import hashlib
from datetime import datetime, timedelta
import uuid as guid
import bcrypt
from server.database import (
    users,
    local_users,
    organizations,
    organization_roles,
)
from server.services.validators import is_email


def create_inactive_user(email):
    existing = users.get_by_email(email)
    # activated users
    if existing and existing["activated"] is not None:
        return {"created": False, "user_uuid": existing["uuid"]}

    activation_key = guid.uuid4()
    activation_key_expires = datetime.now().astimezone() + timedelta(minutes=10)
    user_uuid = guid.uuid4()
    # reissue activation_key
    if existing:
        users.update_user(
            uuid=existing["uuid"],
            activation_key_hash=hashlib.sha256(
                str(activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=activation_key_expires,
        )
        user_uuid = existing["uuid"]
    # completely new user
    else:
        users.add_user(
            uuid=user_uuid,
            username=email,
            email=email,
            system_role="user",
            providers=[],
            activation_key_hash=hashlib.sha256(
                str(activation_key).encode("utf-8")
            ).hexdigest(),
            activation_key_expires=activation_key_expires,
        )
    return {
        "created": True,
        "activation_key": str(activation_key),
        "activation_key_expires": activation_key_expires,
        "email": email,
        "user_uuid": user_uuid,
    }


def activate_user(email, activation_key, password, password_confirmation):
    email_valid = is_email(email)
    if not email_valid[0]:
        return abort(make_response(jsonify(message=email_valid[1]), 400))
    if not password:
        return {"activated": False, "message": "Missing password"}
    if not activation_key:
        return {"activated": False, "message": "Missing activation_key"}
    if password != password_confirmation:
        return {"activated": False, "message": "Passwords do not match"}

    existing = users.get_by_email(email)
    if not existing:
        return {"activated": False, "message": "Cannot activate"}
    if existing["activated"] is not None:
        return {
            "activated": False,
            "already_activated": True,
            "message": "Already activated",
        }

    if (
        hashlib.sha256(str(activation_key).encode("utf-8")).hexdigest()
        != existing["activation_key_hash"]
    ):
        return {"activated": False, "message": "Cannot activate"}
    if existing["activation_key_expires"] < datetime.now().astimezone():
        return {"activated": False, "message": "Activation key expired"}

    memberships = organization_roles.get_by_user_uuid(existing["uuid"])
    if len(memberships) == 0:
        orguuid = guid.uuid4()
        organizations.add_organization(uuid=orguuid, name="Default organization")
        organization_roles.set_organization_role(orguuid, existing["uuid"], "admin")

    pwd_hash = bcrypt.hashpw(password.encode("utf8"), bcrypt.gensalt())
    users.update_user(
        uuid=existing["uuid"],
        activated=datetime.now().astimezone(),
        providers=["local"],
        providers_data={},
    )
    local_users.add_local_user(
        user_uuid=existing["uuid"],
        pwd_hash=pwd_hash.decode("utf8"),
        force_pwd_change=False,
    )
    return {"activated": True, "user_uuid": existing["uuid"]}


# method for creation of local tests users
def create_tests_user(email, password):
    inactive_user = create_inactive_user(email)
    if inactive_user["created"]:
        new_user = activate_user(
            email=email,
            activation_key=inactive_user["activation_key"],
            password=password,
            password_confirmation=password,
        )
        return new_user
    else:
        return {"activated": True, "user_uuid": inactive_user["user_uuid"]}
