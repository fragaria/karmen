import psycopg2
import psycopg2.extras
from psycopg2 import sql
from server.database import get_connection, prepare_list_statement


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


def get_all_users(organization_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT user_uuid, role from organization_roles where organization_uuid = %s",
            (organization_uuid,),
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


def get_organizations_by_uuids(uuids):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, name, slug, created from organizations where uuid::text = any(%s)",
            (uuids,),
        )
        data = cursor.fetchall()
        cursor.close()
        return data
