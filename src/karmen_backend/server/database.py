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
            "INSERT INTO printers (name, hostname, ip, client, client_props) VALUES (%s, %s, %s, %s, %s)",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                kwargs['client'], psycopg2.extras.Json(kwargs['client_props']),
            )
        )
        cursor.close()

def update_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printers SET name = %s, hostname = %s, ip = %s, client = %s, client_props = %s where ip = %s",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                kwargs['client'], psycopg2.extras.Json(kwargs['client_props']), kwargs['ip']
            )
        )
        cursor.close()

def get_printers():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT name, hostname, ip, client, client_props FROM printers")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_printer(ip):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT name, hostname, ip, client, client_props FROM printers where ip = %s", (ip,))
        data = cursor.fetchone()
        cursor.close()
        return data

def delete_printer(ip):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where ip = %s", (ip,))
        cursor.close()

def get_network_devices(ip=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if ip:
            cursor.execute("SELECT ip, retry_after, disabled FROM network_devices where ip = %s", (ip,))
        else:
            cursor.execute("SELECT ip, retry_after, disabled FROM network_devices")
        data = cursor.fetchall()
        cursor.close()
        return data

def upsert_network_device(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO network_devices (ip, retry_after, disabled) values (%s, %s, %s) ON CONFLICT ON CONSTRAINT network_devices_ip_pkey DO UPDATE SET retry_after = %s, disabled = %s",
            (
                kwargs["ip"], kwargs["retry_after"], kwargs["disabled"],
                kwargs["retry_after"], kwargs["disabled"]
            )
        )
        cursor.close()
