import psycopg2
import psycopg2.extras
from server import app
from server.database import get_connection

def normalize_val(val):
    if isinstance(val, str) and val.isdigit():
        val = int(val)
    if val in ('true', '1', 'yes'):
        return True
    if val in ('false', '0', 'no'):
        return False
    return val

def get_all_settings():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT key, val FROM settings")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_val(key):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT key, val FROM settings where key = %s", (key,))
        data = cursor.fetchone()
        cursor.close()
        if data and data["val"] is not None:
            return normalize_val(data["val"])
        try:
            return app.config[key.upper()]
        except KeyError:
            return None

def upsert_val(key, val):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO settings (key, val) values (%s, %s) ON CONFLICT ON CONSTRAINT settings_key_uqc DO UPDATE SET val = %s",
            (
                key.lower(), val, val
            )
        )
        cursor.close()
