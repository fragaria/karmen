import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection, prepare_list_statement

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_gcodes(site_id, order_by=None, limit=None, start_with=None, filter=None):
    columns = [
        "id",
        "path",
        "filename",
        "display",
        "absolute_path",
        "uploaded",
        "size",
        "analysis",
        "user_uuid",
        "site_id",
    ]
    with get_connection() as connection:
        statement = prepare_list_statement(
            connection,
            "gcodes",
            columns,
            where=sql.SQL('site_id = {}').format(sql.Literal(site_id)),
            order_by=order_by,
            limit=limit,
            start_with=start_with,
            filter=filter,
        )
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(statement)
        data = cursor.fetchall()
        cursor.close()
        return data


def get_gcode(id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        return None
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cursor.execute(
            "SELECT id, path, filename, display, absolute_path, uploaded, size, analysis, user_uuid, site_id from gcodes where id = %s",
            (id,),
        )
        data = cursor.fetchone()
        cursor.close()
        return data


def add_gcode(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO gcodes (path, filename, display, absolute_path, size, site_id, analysis, user_uuid) values (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
            (
                kwargs["path"],
                kwargs["filename"],
                kwargs["display"],
                kwargs["absolute_path"],
                kwargs["size"],
                kwargs.get("site_id"),
                psycopg2.extras.Json(kwargs.get("analysis", {})),
                kwargs.get("user_uuid", None),
            ),
        )
        data = cursor.fetchone()
        cursor.close()
        return data[0]


def delete_gcode(id):
    try:
        if isinstance(id, str):
            id = int(id, base=10)
    except ValueError:
        pass
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute("DELETE FROM gcodes WHERE id = %s", (id,))
        cursor.close()


def set_analysis(gcode_id, analysis):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "UPDATE gcodes SET analysis = %s where id = %s",
            (psycopg2.extras.Json(analysis), gcode_id),
        )
        cursor.close()
