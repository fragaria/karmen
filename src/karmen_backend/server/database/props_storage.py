import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection


def get_props(name):
    with get_connection() as connection:
        query = sql.SQL("SELECT  props FROM props_storage")
        query = sql.SQL(" ").join(
            [query, sql.SQL("WHERE name = {}").format(sql.Literal(name)),]
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(query)
        data = cursor.fetchone()
        cursor.close()
        return data[0] if data else None


def set_props(name, props):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO props_storage ( name, props) VALUES (%s, %s) "
            "ON CONFLICT (name) DO "
            "UPDATE SET props=%s ",
            (name, psycopg2.extras.Json(props), psycopg2.extras.Json(props),),
        )
        cursor.close()


def delete_props(name):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM props_storage where name = %s", (name,))
        cursor.close()
