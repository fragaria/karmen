import psycopg2
import psycopg2.extras
from server.database import get_connection

def get_gcodes():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, path, filename, display, absolute_path, uploaded, size FROM gcodes")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_gcode(id):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT id, path, filename, display, absolute_path, uploaded, size from gcodes where id = %s", (id,))
        data = cursor.fetchone()
        cursor.close()
        return data

def add_gcode(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO gcodes (path, filename, display, absolute_path, size) values (%s, %s, %s, %s, %s)",
            (
                kwargs["path"], kwargs["filename"], kwargs["display"], kwargs["absolute_path"], kwargs["size"]
            )
        )
        cursor.close()

def delete_gcode(id):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM gcodes WHERE id = %s", (id,))
        cursor.close()
