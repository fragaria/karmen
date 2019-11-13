import uuid
from contextlib import contextmanager
import psycopg2
from psycopg2 import sql
import psycopg2.extras
import psycopg2.extensions
from server import app

DSN = app.config["DB_DSN"]
CONNECTION = None


def adapt_uuid(uuid):
    return psycopg2.extensions.adapt(str(uuid))


psycopg2.extensions.register_adapter(uuid.UUID, adapt_uuid)


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


def prepare_list_statement(
    connection,
    tablename,
    columns,
    order_by=None,
    limit=None,
    start_with=None,
    filter=None,
    pk_column="id",
):
    where_clause = sql.SQL("")
    limit_clause = sql.SQL("")
    order_by_clause = sql.SQL("ORDER BY {}").format(sql.Identifier(pk_column))
    order_by_column = pk_column
    order_by_direction = "ASC"

    if order_by:
        direction = order_by[0:1] if order_by[0:1] in ["+", "-"] else "+"
        order_by_direction = "DESC" if direction == "-" else "ASC"
        order_by_column = (
            order_by[1:].strip() if order_by[0] == direction else order_by.strip()
        )
        order_by_clause = sql.SQL("ORDER BY {}, {}").format(
            sql.SQL(" ").join(
                [sql.Identifier(order_by_column), sql.SQL(order_by_direction)]
            ),
            sql.Identifier(pk_column),
        )

    if start_with:
        if order_by:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
            statement = sql.SQL("SELECT {} FROM {} where {} = {}").format(
                sql.SQL(", ").join([sql.Identifier(c) for c in columns]),
                sql.Identifier(tablename),
                sql.Identifier(pk_column),
                sql.Placeholder(),
            )
            cursor.execute(statement.as_string(connection), (start_with,))
            data = cursor.fetchone()
            cursor.close()
            if data:
                where_clause = sql.SQL("WHERE {} {} {}").format(
                    sql.Identifier(order_by_column),
                    sql.SQL("<=" if order_by_direction == "DESC" else ">="),
                    sql.Literal(data[order_by_column]),
                )
            else:
                where_clause = sql.SQL("WHERE {} {} {}").format(
                    sql.Identifier(pk_column),
                    sql.SQL("<=" if order_by_direction == "DESC" else ">="),
                    sql.Literal(start_with),
                )
        else:
            where_clause = sql.SQL("WHERE {} >= {}").format(
                sql.Identifier(pk_column), sql.Literal(start_with)
            )

    if filter:
        filter_splitted = filter.split(":", 1)
        if len(filter_splitted) == 2 and filter_splitted[0] in columns:
            if start_with:
                # TODO filter can work only with strings, the cast is slow
                where_clause = sql.SQL(" ").join(
                    [
                        where_clause,
                        sql.SQL(
                            "AND cast({} as varchar) ~* cast({} as varchar)"
                        ).format(
                            sql.Identifier(filter_splitted[0]),
                            sql.Literal(filter_splitted[1]),
                        ),
                    ]
                )
            else:
                where_clause = sql.SQL(" ").join(
                    [
                        where_clause,
                        sql.SQL(
                            "WHERE cast({} as varchar) ~* cast({} as varchar)"
                        ).format(
                            sql.Identifier(filter_splitted[0]),
                            sql.Literal(filter_splitted[1]),
                        ),
                    ]
                )

    if limit:
        limit_clause = sql.SQL(" ").join(
            [sql.SQL("limit"), sql.Literal(int(limit + 1))]
        )

    return sql.SQL(" ").join(
        [
            sql.SQL("SELECT {} FROM {}").format(
                sql.SQL(", ").join([sql.Identifier(c) for c in columns]),
                sql.Identifier(tablename),
            ),
            where_clause,
            order_by_clause,
            limit_clause,
        ]
    )
