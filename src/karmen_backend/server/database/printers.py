import psycopg2
import psycopg2.extras
from server.database import get_connection


def add_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printers (name, hostname, ip, client, client_props) VALUES (%s, %s, %s, %s, %s)",
            (
                kwargs["name"],
                kwargs["hostname"],
                kwargs["ip"],
                kwargs["client"],
                psycopg2.extras.Json(kwargs["client_props"]),
            ),
        )
        cursor.close()


def update_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE printers SET name = %s, hostname = %s, ip = %s, client = %s, client_props = %s where ip = %s",
            (
                kwargs["name"],
                kwargs["hostname"],
                kwargs["ip"],
                kwargs["client"],
                psycopg2.extras.Json(kwargs["client_props"]),
                kwargs["ip"],
            ),
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
        cursor.execute(
            "SELECT name, hostname, ip, client, client_props FROM printers where ip = %s",
            (ip,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def delete_printer(ip):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where ip = %s", (ip,))
        cursor.close()
