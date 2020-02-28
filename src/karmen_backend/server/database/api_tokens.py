import psycopg2
import psycopg2.extras
from psycopg2 import sql
from server.database import get_connection

FIELDS = [
    "user_uuid",
    "organization_uuid",
    "jti",
    "name",
    "created",
    "revoked",
]


def add_token(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO api_tokens (user_uuid, jti, organization_uuid, name) values (%s, %s, %s, %s)",
            (
                kwargs["user_uuid"],
                kwargs["jti"],
                kwargs["organization_uuid"],
                kwargs["name"],
            ),
        )
        cursor.close()


def get_token(jti):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from api_tokens where jti = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(jti),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def revoke_token(jti):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("UPDATE api_tokens set revoked=TRUE where jti = %s", (jti,))
        cursor.close()


def revoke_all_tokens(user_uuid, organization_uuid):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE api_tokens set revoked=TRUE where user_uuid = %s and organization_uuid = %s",
            (user_uuid, organization_uuid),
        )
        cursor.close()


def get_tokens_for_user_uuid(user_uuid, revoked=None, org_uuid=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        statement = sql.SQL("SELECT {} from api_tokens where user_uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(user_uuid),
        )
        if revoked is not None:
            statement = sql.SQL(" ").join(
                [statement, sql.SQL("AND revoked = {}").format(sql.Literal(revoked))]
            )
        if org_uuid is not None:
            statement = sql.SQL(" ").join(
                [
                    statement,
                    sql.SQL("AND organization_uuid = {}").format(sql.Literal(org_uuid)),
                ]
            )
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data
