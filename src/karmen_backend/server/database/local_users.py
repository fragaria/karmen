import psycopg2
import psycopg2.extras
from psycopg2 import sql
from server.database import get_connection

FIELDS = [
    "user_uuid",
    "pwd_hash",
    "force_pwd_change",
    "pwd_reset_key_hash",
    "pwd_reset_key_expires",
]


def get_local_user(user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from local_users where user_uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(user_uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def add_local_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO local_users (user_uuid, pwd_hash, force_pwd_change, pwd_reset_key_hash, pwd_reset_key_expires) values (%s, %s, %s, %s, %s)",
            (
                kwargs["user_uuid"],
                kwargs["pwd_hash"],
                kwargs.get("force_pwd_change", False),
                kwargs.get("pwd_reset_key_hash", None),
                kwargs.get("pwd_reset_key_expires", None),
            ),
        )
        cursor.close()


def update_local_user(**kwargs):
    if kwargs.get("user_uuid") is None:
        raise ValueError("Missing user_uuid in kwargs")
    updates = []
    for field in FIELDS:
        if field in kwargs and field != "providers_data":
            updates.append(
                sql.SQL("{} = {}").format(
                    sql.Identifier(field), sql.Literal(kwargs[field])
                )
            )
    query = sql.SQL("UPDATE local_users SET {} where user_uuid = {}").format(
        sql.SQL(", ").join(updates), sql.Literal(kwargs["user_uuid"])
    )
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(query)
        cursor.close()
