import psycopg2
import psycopg2.extras
from server.database import get_connection, prepare_list_statement

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_printjobs(order_by=None, limit=None, start_with=None, filter=None):
    columns = ["id", "gcode_id", "printer_ip", "started"]
    with get_connection() as connection:
        statement = prepare_list_statement(connection, "printjobs", columns, order_by=order_by, limit=limit, start_with=start_with, filter=filter)
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
        cursor.execute("SELECT id, gcode_id, printer_ip, started from printjobs where id = %s", (id,))
        data = cursor.fetchone()
        cursor.close()
        return data

def add_printjob(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printjobs (gcode_id, printer_ip) values (%s, %s) RETURNING id",
            (
                kwargs["gcode_id"], kwargs["printer_ip"]
            )
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

def delete_printjobs_by_gcode(gcode_id):
    try:
        if isinstance(gcode_id, str):
            gcode_id = int(gcode_id, base=10)
    except ValueError:
        pass
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE gcode_id = %s", (gcode_id,))
        cursor.close()

def delete_printjobs_by_printer(printer_ip):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE printer_ip = %s", (printer_ip,))
        cursor.close()
