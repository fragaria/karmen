import psycopg2
import psycopg2.extras
from server import app
from server.database import get_connection


def normalize_val(val):
    if isinstance(val, str):
        if val.isdigit():
            return int(val)
        if val.lower() in ("true", "1", "yes", "on"):
            return True
        if val.lower() in ("false", "0", "no", "off"):
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
        # TODO refactor organization_uuid
        cursor.execute(
            "INSERT INTO settings (key, val, organization_uuid) values (%s, %s, 'b3060e41-e319-4a9b-8ac4-e0936c75f275') ON CONFLICT ON CONSTRAINT settings_uq_key_org DO UPDATE SET val = %s",
            (key.lower(), val, val),
        )
        cursor.close()
