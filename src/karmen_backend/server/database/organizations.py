import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

FIELDS = [
    "uuid",
    "name",
    "created",
]


def get_by_uuid(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from organizations where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def add_organization(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "INSERT INTO organizations (uuid, name) VALUES (%s, %s)",
            (kwargs["uuid"], kwargs["name"]),
        )
        cursor.close()


def update_organization(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "UPDATE organizations SET name = %s WHERE uuid = %s",
            (kwargs["name"], kwargs["uuid"]),
        )
        cursor.close()


def get_organizations_by_uuids(uuids):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT {} from organizations where uuid::text = any({})"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuids),
        )
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data
