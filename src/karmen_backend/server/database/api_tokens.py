import psycopg2
import psycopg2.extras
from psycopg2 import sql
from server.database import get_connection


def add_token(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO api_tokens (uuid, jti, name) values (%s, %s, %s)",
            (kwargs["uuid"], kwargs["jti"], kwargs["name"]),
        )
        cursor.close()


def get_token(jti):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, jti, created, name, revoked from api_tokens where jti = %s",
            (jti,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def revoke_token(jti):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("UPDATE api_tokens set revoked=TRUE where jti = %s", (jti,))
        cursor.close()


def get_tokens_for_uuid(uuid, revoked=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        statement = sql.SQL(
            "SELECT uuid, jti, created, name, revoked from api_tokens where uuid = {}"
        ).format(sql.Placeholder())
        if revoked is not None:
            statement = sql.SQL(" ").join(
                [statement, sql.SQL("AND revoked = {}").format(sql.Literal(revoked))]
            )
        cursor.execute(statement, (uuid,))
        data = cursor.fetchall()
        cursor.close()
        return data
