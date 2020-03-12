import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

FIELDS = [
    "uuid",
    "network_client_uuid",
    "organization_uuid",
    "name",
    "client_props",
    "printer_props",
]


def add_printer(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO printers (uuid, network_client_uuid, organization_uuid, name, client_props, printer_props) VALUES (%s, %s, %s, %s, %s, %s)",
            (
                kwargs["uuid"],
                kwargs["network_client_uuid"],
                kwargs["organization_uuid"],
                kwargs["name"],
                psycopg2.extras.Json(kwargs["client_props"]),
                psycopg2.extras.Json(kwargs.get("printer_props", None)),
            ),
        )
        cursor.close()


def update_printer(**kwargs):
    if kwargs.get("uuid") is None:
        raise ValueError("Missing uuid in kwargs")
    updates = []
    for field in FIELDS:
        if field in kwargs:
            data = kwargs[field]
            if field in ["client_props", "printer_props"]:
                data = psycopg2.extras.Json(kwargs[field])
            updates.append(
                sql.SQL("{} = {}").format(sql.Identifier(field), sql.Literal(data))
            )
    query = sql.SQL("UPDATE printers SET {} where uuid = {}").format(
        sql.SQL(", ").join(updates), sql.Literal(kwargs["uuid"])
    )
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(query)
        cursor.close()


def get_printers(organization_uuid=None):
    with get_connection() as connection:
        query = sql.SQL("SELECT {} from printers").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS])
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


def get_printers_by_network_client_uuid(network_client_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT {} from printers where network_client_uuid = {}"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(network_client_uuid),
        )
        cursor.execute(query)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_printer(uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL("SELECT {} from printers where uuid = {}").format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]), sql.Literal(uuid)
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def get_printer_by_network_client_uuid(organization_uuid, network_client_uuid):
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        query = sql.SQL(
            "SELECT {} from printers where organization_uuid = {} and network_client_uuid = {}"
        ).format(
            sql.SQL(",").join([sql.Identifier(f) for f in FIELDS]),
            sql.Literal(organization_uuid),
            sql.Literal(network_client_uuid),
        )
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data


def delete_printer(uuid):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM printers where uuid = %s", (uuid,))
        cursor.close()
