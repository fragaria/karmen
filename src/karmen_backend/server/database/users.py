import psycopg2
import psycopg2.extras
from server.database import get_connection, prepare_list_statement


def get_by_username(username):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, username, email, system_role, providers, providers_data, suspended from users where username = %s",
            (username,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def get_by_email(email):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, username, email, system_role, providers, providers_data, suspended from users where email = %s",
            (email,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def get_by_uuid(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, username, email, system_role, providers, providers_data, suspended, created from users where uuid = %s",
            (uuid,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def add_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO users (uuid, username, email, system_role, providers, providers_data) values (%s, %s, %s, %s, %s, %s)",
            (
                kwargs["uuid"],
                kwargs["username"],
                kwargs["email"],
                kwargs["system_role"],
                kwargs["providers"],
                psycopg2.extras.Json(kwargs.get("providers_data", None)),
            ),
        )
        cursor.close()


def update_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE users SET uuid = %s, username = %s, email = %s, system_role = %s, providers = %s, providers_data = %s, suspended = %s where uuid = %s",
            (
                kwargs["uuid"],
                kwargs["username"],
                kwargs["email"],
                kwargs["system_role"],
                kwargs["providers"],
                psycopg2.extras.Json(kwargs.get("providers_data", None)),
                kwargs["suspended"],
                kwargs["uuid"],
            ),
        )
        cursor.close()


def get_users_by_uuids(uuids):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, username, email, system_role, suspended from users where uuid::text = any(%s)",
            (uuids,),
        )
        data = cursor.fetchall()
        cursor.close()
        return data
