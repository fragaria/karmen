import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection


def add_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printers (uuid, organization_uuid, name, hostname, ip, port, path, token, client, client_props, printer_props, protocol) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                kwargs["uuid"],
                kwargs["organization_uuid"],
                kwargs["name"],
                kwargs["hostname"],
                kwargs["ip"],
                kwargs.get("port"),
                kwargs.get("path", ""),
                kwargs.get("token", ""),
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
            "UPDATE printers SET name = %s, organization_uuid = %s, hostname = %s, ip = %s, port = %s, path = %s, client = %s, client_props = %s, printer_props = %s, protocol = %s where uuid = %s",
            (
                kwargs["name"],
                kwargs["organization_uuid"],
                kwargs["hostname"],
                kwargs["ip"],
                kwargs.get("port"),
                kwargs.get("path", ""),
                kwargs["client"],
                psycopg2.extras.Json(kwargs["client_props"]),
                psycopg2.extras.Json(kwargs["printer_props"]),
                kwargs["protocol"],
                kwargs["uuid"],
            ),
        )
        cursor.close()


def get_printers(organization_uuid=None):
    with get_connection() as connection:
        query = sql.SQL(
            "SELECT uuid, organization_uuid, name, hostname, ip, port, path, token, client, client_props, printer_props, protocol FROM printers"
        )
        if organization_uuid:
            query = sql.SQL(" ").join(
                [
                    query,
                    sql.SQL("WHERE organization_uuid = {}").format(
                        sql.Literal(organization_uuid)
                    ),
                ]
            )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printer(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT uuid, organization_uuid, name, hostname, ip, port, path, client, client_props, printer_props, protocol FROM printers where uuid = %s",
            (uuid,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def get_printer_by_network_props(org_uuid, hostname, ip, port, path):
    def _is_or_equal(column, value):
        if value is None:
            return sql.SQL("{} is null").format(sql.Identifier(column))
        else:
            return sql.SQL("{} = {}").format(sql.Identifier(column), sql.Literal(value))

    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)

        basequery = sql.SQL(
            "SELECT uuid, organization_uuid, name, hostname, ip, port, path, client, client_props, printer_props, protocol FROM printers WHERE"
        )
        query = sql.SQL(" ").join(
            [
                basequery,
                sql.SQL(" AND ").join(
                    [
                        _is_or_equal("organization_uuid", org_uuid),
                        _is_or_equal("hostname", hostname),
                        _is_or_equal("ip", ip),
                        _is_or_equal("port", port),
                        _is_or_equal("path", path),
                    ]
                ),
            ]
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data

def get_printer_by_socket_token(org_uuid, token):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT uuid, organization_uuid, name, hostname, ip, port, path, client, client_props, printer_props, protocol "
            "FROM printers "
            "WHERE protocol = 'sock' AND organization_uuid = %s AND token = %s"
        )
        cursor.execute(query, (org_uuid, token))



def delete_printer(uuid):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where uuid = %s", (uuid,))
        cursor.close()
