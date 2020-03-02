import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

FIELDS = [
    "user_uuid",
    "organization_uuid",
    "role",
]


def get_by_user_uuid(user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT o.uuid, o.name, ox.role from organizations o join organization_roles ox on ox.organization_uuid = o.uuid where ox.user_uuid = %s",
            (user_uuid,),
        )
        data = cursor.fetchall()
        cursor.close()
        return data


def get_all_users(organization_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT {} from organization_roles where organization_uuid = {}"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(organization_uuid),
        )
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_organization_role(organization_uuid, user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT {} from organization_roles where organization_uuid = {} and user_uuid = {}"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(organization_uuid),
            sql.Literal(user_uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def set_organization_role(organization_uuid, user_uuid, role):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            """INSERT INTO organization_roles (organization_uuid, user_uuid, role) VALUES (%s, %s, %s)
            ON CONFLICT (organization_uuid, user_uuid) DO UPDATE SET role = %s""",
            (organization_uuid, user_uuid, role, role),
        )
        cursor.close()


def drop_organization_role(organization_uuid, user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "DELETE FROM organization_roles WHERE organization_uuid = %s AND user_uuid = %s",
            (organization_uuid, user_uuid),
        )
        cursor.close()
