from contextlib import contextmanager
import psycopg2
import psycopg2.extensions
import psycopg2.extras
from server import app

DSN = app.config['DB_DSN']
CONNECTION = None

def connect():
    try:
        connection = psycopg2.connect(DSN)
        connection.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        return connection
    except Exception as err:
        print("Cannot connect to PgSQL database.", err)
        raise err

@contextmanager
def get_connection():
    global CONNECTION
    if not CONNECTION:
        CONNECTION = connect()
    try:
        yield CONNECTION
    except Exception:
        CONNECTION.rollback()
        raise
    else:
        CONNECTION.commit()

def add_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printers (name, hostname, ip, version, active, client, mac) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                psycopg2.extras.Json(kwargs['version']), kwargs['active'], kwargs['client'], kwargs['mac']
            )
        )
        cursor.close()

def update_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printers SET name = %s, hostname = %s, ip = %s, version = %s, active = %s, client = %s where mac = %s",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                psycopg2.extras.Json(kwargs['version']), kwargs['active'], kwargs['client'], kwargs['mac']
            )
        )
        cursor.close()

def get_printers(active=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if active is not None:
            cursor.execute("SELECT name, hostname, ip, mac, version, client, active FROM printers where active = %s", (active,))
        else:
            cursor.execute("SELECT name, hostname, ip, mac, version, client, active FROM printers")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_printer(mac):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT name, hostname, ip, mac, version, client, active FROM printers where mac = %s", (mac,))
        data = cursor.fetchone()
        cursor.close()
        return data
