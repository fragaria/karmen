import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection, prepare_list_statement
from server import app

FIELDS = [
    "uuid",
    "path",
    "filename",
    "display",
    "organization_uuid",
    "absolute_path",
    "uploaded",
    "size",
    "analysis",
    "user_uuid",
]

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_gcodes(
    org_uuid,
    order_by=None,
    limit=None,
    start_with=None,
    filter=None,
    fulltext_search=None,
):
    with get_connection() as connection:
        statement = prepare_list_statement(
            connection,
            "gcodes",
            FIELDS,
            order_by=order_by,
            limit=limit,
            start_with=start_with,
            filter=filter,
            where=sql.SQL("organization_uuid = {}").format(sql.Literal(org_uuid)),
            pk_column="uuid",
            fulltext_search=fulltext_search,
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_gcode(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from gcodes where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def add_gcode(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO gcodes (uuid, path, filename, display, absolute_path, size, analysis, user_uuid, organization_uuid) values (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING uuid",
            (
                kwargs["uuid"],
                kwargs["path"],
                kwargs["filename"],
                kwargs["display"],
                kwargs["absolute_path"],
                kwargs["size"],
                psycopg2.extras.Json(kwargs.get("analysis", {})),
                kwargs["user_uuid"],
                kwargs["organization_uuid"],
            ),
        )
        data = cursor.fetchone()
        cursor.close()
        return data[0]


def delete_gcode(uuid):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM gcodes WHERE uuid = %s", (uuid,))
        cursor.close()


def set_analysis(gcode_uuid, analysis):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE gcodes SET analysis = %s where uuid = %s",
            (psycopg2.extras.Json(analysis), gcode_uuid),
        )
        cursor.close()
