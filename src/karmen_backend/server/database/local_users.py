import psycopg2
import psycopg2.extras
from server.database import get_connection


def get_local_user(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, pwd_hash, force_pwd_change from local_users where uuid = %s",
            (uuid,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def add_local_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO local_users (uuid, pwd_hash, force_pwd_change) values (%s, %s, %s)",
            (kwargs["uuid"], kwargs["pwd_hash"], kwargs["force_pwd_change"]),
        )
        cursor.close()


def update_local_user(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE local_users SET pwd_hash = %s, force_pwd_change = %s where uuid = %s",
            (kwargs["pwd_hash"], kwargs["force_pwd_change"], kwargs["uuid"]),
        )
        cursor.close()
