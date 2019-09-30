import psycopg2
import psycopg2.extras
from server.database import get_connection

def get_printjobs():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, gcode_id, printer_ip, started FROM printjobs")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_printjob(id):
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
            "INSERT INTO printjobs (gcode_id, printer_ip) values (%s, %s)",
            (
                kwargs["gcode_id"], kwargs["printer_ip"]
            )
        )
        cursor.close()

def delete_printjob(id):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE id = %s", (id,))
        cursor.close()

def delete_printjobs_by_gcode(gcode_id):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE gcode_id = %s", (gcode_id,))
        cursor.close()

def delete_printjobs_by_printer(printer_ip):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printjobs WHERE printer_ip = %s", (printer_ip,))
        cursor.close()
