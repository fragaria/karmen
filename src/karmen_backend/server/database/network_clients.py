import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

FIELDS = [
    "uuid",
    "client",
    "protocol",
    "ip",
    "hostname",
    "port",
    "path",
    "token",
]


def add_network_client(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO network_clients (uuid, client, protocol, ip, hostname, port, path, token) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
            (
                kwargs["uuid"],
                kwargs["client"],
                kwargs.get("protocol", "http"),
                kwargs["ip"],
                kwargs.get("hostname", ""),
                kwargs.get("port", 0),
                kwargs.get("path", ""),
                kwargs.get("token", None),
            ),
        )
        cursor.close()


def update_network_client(**kwargs):
    if kwargs.get("uuid") is None:
        raise ValueError("Missing uuid in kwargs")
    updates = []
    for field in FIELDS:
        if field in kwargs:
            data = kwargs[field]
            updates.append(
                sql.SQL("{} = {}").format(sql.Identifier(field), sql.Literal(data))
            )
    query = sql.SQL("UPDATE network_clients SET {} where uuid = {}").format(
        sql.SQL(", ").join(updates), sql.Literal(kwargs["uuid"])
    )
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(query)
        cursor.close()


def get_network_client_by_props(hostname, ip, port, path):
    def _is_or_equal(column, value):
        if value is None:
            return sql.SQL("{} is null").format(sql.Identifier(column))
        else:
            return sql.SQL("{} = {}").format(sql.Identifier(column), sql.Literal(value))

    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        basequery = sql.SQL("SELECT {} from network_clients WHERE").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS])
        )
        query = sql.SQL(" ").join(
            [
                basequery,
                sql.SQL(" AND ").join(
                    [
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


def get_network_client_by_socket_token(token):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from network_clients WHERE token = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(token),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def get_network_clients_by_uuids(uuids):
    with get_connection() as connection:
        query = sql.SQL(
            "SELECT {} from network_clients where uuid::text = any({})"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuids)
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_network_client(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from network_clients where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid)
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def delete_network_client(uuid):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM network_clients where uuid = %s", (uuid,))
        cursor.close()
