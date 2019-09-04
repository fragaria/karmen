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
            "INSERT INTO printers (name, hostname, ip, client, client_props, mac) VALUES (%s, %s, %s, %s, %s, %s)",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                kwargs['client'], psycopg2.extras.Json(kwargs['client_props']), kwargs['mac']
            )
        )
        cursor.close()

def update_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printers SET name = %s, hostname = %s, ip = %s, client = %s, client_props = %s where mac = %s",
            (
                kwargs['name'], kwargs['hostname'], kwargs['ip'],
                kwargs['client'], psycopg2.extras.Json(kwargs['client_props']), kwargs['mac']
            )
        )
        cursor.close()

def get_printers():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT name, hostname, ip, mac, client, client_props FROM printers")
        data = cursor.fetchall()
        cursor.close()
        return data

def get_printer(mac):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute("SELECT name, hostname, ip, mac, client, client_props FROM printers where mac = %s", (mac,))
        data = cursor.fetchone()
        cursor.close()
        return data

def delete_printer(mac):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where mac = %s", (mac,))
        cursor.close()

def get_network_devices(mac=None, ip=None):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        if mac or ip:
            cursor.execute("SELECT ip, mac, is_printer, retry_after, disabled FROM network_devices where mac = %s or ip = %s", (mac, ip))
        else:
            cursor.execute("SELECT ip, mac, is_printer, retry_after, disabled FROM network_devices")
        data = cursor.fetchall()
        cursor.close()
        return data

def upsert_network_device(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO network_devices (ip, mac, is_printer, retry_after, disabled) values (%s, %s, %s, %s, %s) ON CONFLICT ON CONSTRAINT mac_ip_pair DO UPDATE SET ip = %s, is_printer = %s, retry_after = %s, disabled = %s",
            (
                kwargs["ip"], kwargs["mac"], kwargs["is_printer"], kwargs["retry_after"], kwargs["disabled"],
                kwargs["ip"], kwargs["is_printer"], kwargs["retry_after"], kwargs["disabled"]
            )
        )
        cursor.close()
