import psycopg2
import psycopg2.extras
from server.database import get_connection


def get_by_user_uuid(user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT o.uuid, o.name, o.slug, ox.role from organizations o join organization_roles ox on ox.organization_uuid = o.uuid where ox.user_uuid = %s",
            (user_uuid,),
        )
        data = cursor.fetchall()
        cursor.close()
        return data


def get_organization_role(organization_uuid, user_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT role from organization_roles where user_uuid = %s and organization_uuid = %s",
            (user_uuid, organization_uuid),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def get_by_uuid(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, name, slug, created from organizations where uuid = %s",
            (uuid,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data
