import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection, prepare_list_statement

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_printjobs(org_uuid, order_by=None, limit=None, start_with=None, filter=None):
    columns = [
        "id",
        "gcode_id",
        "organization_uuid",
        "printer_uuid",
        "started",
        "gcode_data",
        "printer_data",
        "user_uuid",
    ]
    with get_connection() as connection:
        statement = prepare_list_statement(
            connection,
            "printjobs",
            columns,
            order_by=order_by,
            limit=limit,
            start_with=start_with,
            filter=filter,
            where=sql.SQL("organization_uuid = {}").format(sql.Literal(org_uuid)),
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printjob(id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        return None
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT id, gcode_id, organization_uuid, printer_uuid, started, gcode_data, printer_data, user_uuid from printjobs where id = %s",
            (id,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def add_printjob(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printjobs (gcode_id, organization_uuid, printer_uuid, gcode_data, printer_data, user_uuid) values (%s, %s, %s, %s, %s, %s) RETURNING id",
            (
                kwargs["gcode_id"],
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


def delete_printjob(id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        pass
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE id = %s", (id,))
        cursor.close()


def update_gcode_data(gcode_id, gcode_data):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printjobs SET gcode_data = %s where gcode_id = %s",
            (psycopg2.extras.Json(gcode_data), gcode_id),
        )
        cursor.close()
