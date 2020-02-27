import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

FIELDS = [
    "uuid",
    "username",
    "email",
    "system_role",
    "providers",
    "providers_data",
    "suspended",
    "activation_key_hash",
    "activation_key_expires",
    "activated",
]


def get_by_username(username):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from users where username = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(username),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def get_by_email(email):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from users where email = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(email)
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def get_by_uuid(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from users where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid)
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def add_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (uuid, username, email, system_role, providers, providers_data, activation_key_hash, activation_key_expires, activated) values (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                kwargs["uuid"],
                kwargs["username"],
                kwargs["email"],
                kwargs["system_role"],
                kwargs["providers"],
                psycopg2.extras.Json(kwargs.get("providers_data", None)),
                kwargs.get("activation_key_hash", None),
                kwargs.get("activation_key_expires", None),
                kwargs.get("activated", None),
            ),
        )
        cursor.close()


def update_user(**kwargs):
    if kwargs.get("uuid") is None:
        raise ValueError("Missing uuid in kwargs")
    updates = []
    for field in FIELDS:
        if field in kwargs and field != "providers_data":
            updates.append(
                sql.SQL("{} = {}").format(
                    sql.Identifier(field), sql.Literal(kwargs[field])
                )
            )
    if kwargs.get("providers_data"):
        updates.append(
            sql.SQL("{} = {}").format(
                sql.Identifier("providers_data"),
                sql.Literal(psycopg2.extras.Json(kwargs["providers_data"])),
            )
        )
    query = sql.SQL("UPDATE users SET {} where uuid = {}").format(
        sql.SQL(", ").join(updates), sql.Literal(kwargs["uuid"])
    )
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(query)
        cursor.close()


def get_users_by_uuids(uuids):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from users where uuid::text = any({})").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuids)
        )
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data
