import psycopg2
import psycopg2.extras
from server.database import get_connection


def add_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printers (name, hostname, host, client, client_props, printer_props, protocol) VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (
                kwargs["name"],
                kwargs["hostname"],
                kwargs["host"],
                kwargs["client"],
                psycopg2.extras.Json(kwargs["client_props"]),
                psycopg2.extras.Json(kwargs.get("printer_props", None)),
                kwargs.get("protocol", "http"),
            ),
        )
        cursor.close()


def update_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printers SET name = %s, hostname = %s, host = %s, client = %s, client_props = %s, printer_props = %s, protocol = %s where host = %s",
            (
                kwargs["name"],
                kwargs["hostname"],
                kwargs["host"],
                kwargs["client"],
                psycopg2.extras.Json(kwargs["client_props"]),
                psycopg2.extras.Json(kwargs["printer_props"]),
                kwargs["protocol"],
                kwargs["host"],
            ),
        )
        cursor.close()


def get_printers():
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT name, hostname, host, client, client_props, printer_props, protocol FROM printers"
        )
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printer(host):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT name, hostname, host, client, client_props, printer_props, protocol FROM printers where host = %s",
            (host,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def delete_printer(host):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where host = %s", (host,))
        cursor.close()
