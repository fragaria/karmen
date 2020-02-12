import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection, prepare_list_statement

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_printjobs(site_id, order_by=None, limit=None, start_with=None, filter=None):
    columns = [
        "id",
        "gcode_id",
        "printer_uuid",
        "started",
        "gcode_data",
        "printer_data",
        "user_uuid",
        "site_id",
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
            where=sql.SQL('site_id = {}').format(sql.Literal(site_id)),
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printjob(site_id, id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        return None
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT id, gcode_id, printer_uuid, started, gcode_data, printer_data, user_uuid from printjobs WHERE id = %s AND site_id = %s",
            (id, site_id),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def add_printjob(site_id, **kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printjobs (site_id, gcode_id, printer_uuid, gcode_data, printer_data, user_uuid) values (%s, %s, %s, %s, %s, %s) RETURNING id",
            (
                site_id,
                kwargs["gcode_id"],
                kwargs["printer_uuid"],
                psycopg2.extras.Json(kwargs.get("gcode_data", None)),
                psycopg2.extras.Json(kwargs.get("printer_data", None)),
                kwargs.get("user_uuid", None),
            ),
        )
        data = cursor.fetchone()
        cursor.close()
        return data[0]


def delete_printjob(site_id, id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        pass
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE id = %s AND site_id = %s", (id, site_id))
        cursor.close()


def update_gcode_data(site_id, gcode_id, gcode_data):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printjobs SET gcode_data = %s WHERE gcode_id = %s AND site_id = %s",
            (psycopg2.extras.Json(gcode_data), gcode_id, site_id),
        )
        cursor.close()
