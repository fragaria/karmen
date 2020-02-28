import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection, prepare_list_statement

FIELDS = [
    "uuid",
    "gcode_uuid",
    "organization_uuid",
    "printer_uuid",
    "started",
    "gcode_data",
    "printer_data",
    "user_uuid",
]

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_printjobs(org_uuid, order_by=None, limit=None, start_with=None, filter=None):
    with get_connection() as connection:
        statement = prepare_list_statement(
            connection,
            "printjobs",
            FIELDS,
            order_by=order_by,
            limit=limit,
            start_with=start_with,
            filter=filter,
            where=sql.SQL("organization_uuid = {}").format(sql.Literal(org_uuid)),
            pk_column="uuid",
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printjob(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from printjobs where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def add_printjob(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printjobs (uuid, gcode_uuid, organization_uuid, printer_uuid, gcode_data, printer_data, user_uuid) values (%s, %s, %s, %s, %s, %s, %s) RETURNING uuid",
            (
                kwargs["uuid"],
                kwargs["gcode_uuid"],
                kwargs["organization_uuid"],
                kwargs["printer_uuid"],
                psycopg2.extras.Json(kwargs.get("gcode_data", None)),
                psycopg2.extras.Json(kwargs.get("printer_data", None)),
                kwargs.get("user_uuid", None),
            ),
        )
        data = cursor.fetchone()
        cursor.close()
        return data[0]


def update_gcode_data(gcode_uuid, gcode_data):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printjobs SET gcode_data = %s where gcode_uuid = %s",
            (psycopg2.extras.Json(gcode_data), gcode_uuid),
        )
        cursor.close()
