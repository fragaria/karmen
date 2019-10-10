import psycopg2
from psycopg2 import sql
import psycopg2.extras
from server.database import get_connection

from server import app

# This intentionally selects limit+1 results in order to properly determine next start_with for pagination
# Take that into account when processing results
def get_gcodes(order_by=None, limit=None, start_with=None, filter=None):
    columns = ["id", "path", "filename", "display", "absolute_path", "uploaded", "size"]
    with get_connection() as connection:
        cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
        where_clause = sql.SQL('')
        limit_clause = sql.SQL('')
        order_by_clause = sql.SQL('ORDER BY {}').format(sql.Identifier("id"))
        order_by_column = "id"
        order_by_direction = "ASC"

        if order_by:
            direction = order_by[0:1] if order_by[0:1] in ['+', '-'] else '+'
            order_by_direction = 'DESC' if direction == '-' else 'ASC'
            order_by_column = order_by[1:].strip() if order_by[0] == direction else order_by.strip()
            order_by_clause = sql.SQL('ORDER BY {}, {}').format(sql.SQL(' ').join([sql.Identifier(order_by_column), sql.SQL(order_by_direction)]), sql.Identifier("id"))

        if start_with:
            if order_by:
                statement = sql.SQL("SELECT {} FROM gcodes where id = %s").format(sql.SQL(', ').join([sql.Identifier(c) for c in columns]))
                cursor.execute(statement.as_string(connection) % start_with)
                data = cursor.fetchone()
                if data:
                    where_clause = sql.SQL('WHERE {} {} {}').format(sql.Identifier(order_by_column), sql.SQL('<=' if order_by_direction == 'DESC' else '>='), sql.Literal(data[order_by_column]))
                else:
                    where_clause = sql.SQL('WHERE id {} {}').format(sql.SQL('<=' if order_by_direction == 'DESC' else '>='), sql.Literal(start_with))
            else:
                where_clause = sql.SQL('WHERE id >= {}').format(sql.Literal(start_with))

        if filter:
            filter_splitted = filter.split(':')
            if len(filter_splitted) == 2 and filter_splitted[0] in columns:
                if start_with:
                    where_clause = sql.SQL(' ').join([
                        where_clause,
                        sql.SQL('AND {} ~* {}').format(sql.Identifier(filter_splitted[0]), sql.Literal(filter_splitted[1]))
                    ])
                else:
                    where_clause = sql.SQL(' ').join([
                        where_clause,
                        sql.SQL('WHERE {} ~* {}').format(sql.Identifier(filter_splitted[0]), sql.Literal(filter_splitted[1]))
                    ])

        if limit:
            limit_clause = sql.SQL(' ').join([sql.SQL('limit'), sql.Literal(int(limit + 1))])

        statement = sql.SQL(' ').join([
            sql.SQL("SELECT {} FROM gcodes").format(sql.SQL(', ').join([sql.Identifier(c) for c in columns])),
            where_clause,
            order_by_clause,
            limit_clause
        ])
        app.logger.info(statement.as_string(connection))

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
        cursor.execute("SELECT id, path, filename, display, absolute_path, uploaded, size from gcodes where id = %s", (id,))
        data = cursor.fetchone()
        cursor.close()
        return data

def add_gcode(**kwargs):
    with get_connection() as connection:
        cursor = connection.cursor()
        cursor.execute(
            "INSERT INTO gcodes (path, filename, display, absolute_path, size) values (%s, %s, %s, %s, %s) RETURNING id",
            (
                kwargs["path"], kwargs["filename"], kwargs["display"], kwargs["absolute_path"], kwargs["size"]
            )
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
