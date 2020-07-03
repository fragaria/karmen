import uuid as guid
from contextlib import contextmanager
import psycopg2
from psycopg2 import sql
import psycopg2.extras
import psycopg2.extensions
from server import app

DSN = "host='%s' port=%s dbname='%s' user='%s' password='%s'" % (
    app.config["POSTGRES_HOST"],
    app.config["POSTGRES_PORT"],
    app.config["POSTGRES_DB"],
    app.config["POSTGRES_USER"],
    app.config["POSTGRES_PASSWORD"],
)
CONNECTION = None


def adapt_uuid(uuid):
    return psycopg2.extensions.adapt(str(uuid))


psycopg2.extensions.register_adapter(guid.UUID, adapt_uuid)


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
    where=None,
    pk_column="id",
    fulltext_search=None,
):
    where_clause = []
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
                sql.Identifier(order_by_column),
                sql.Identifier(tablename),
                sql.Identifier(pk_column),
                sql.Literal(start_with),
            )
            cursor.execute(statement)
            data = cursor.fetchone()
            cursor.close()
            if data:
                # TODO the else clause of this should probably not fail silently
                where_clause.append(
                    sql.SQL("{} {} {}").format(
                        sql.Identifier(order_by_column),
                        sql.SQL("<=" if order_by_direction == "DESC" else ">="),
                        sql.Literal(data[order_by_column]),
                    )
                )
        else:
            where_clause.append(
                sql.SQL("{} {} {}").format(
                    sql.Identifier(pk_column),
                    sql.SQL("<=" if order_by_direction == "DESC" else ">="),
                    sql.Literal(start_with),
                )
            )

    # TODO: drop filter
    if filter:
        filter_splitted = filter.split(":", 1)
        if len(filter_splitted) == 2 and filter_splitted[0] in columns:
            # TODO filter can work only with strings, the cast is slow
            where_clause.append(
                sql.SQL("cast({} as varchar) ~* cast({} as varchar)").format(
                    sql.Identifier(filter_splitted[0]), sql.Literal(filter_splitted[1]),
                ),
            )
        # TODO this should not fail silently
        # else:
        #     raise ValueError("Invalid filter.")

    if fulltext_search:
        [search_text, columns_to_search] = fulltext_search
        search_sql = []
        for c in columns_to_search:
            search_sql.append(
                sql.SQL("LOWER({}) LIKE LOWER({})").format(
                    sql.Identifier(c), sql.Literal(f"%{search_text}%")
                )
            )
        # all wheres are joined by AND, so we need to put these ORs in brackets
        where_clause.append(
            sql.SQL(" ").join(
                [sql.SQL(" ( "), sql.SQL(" OR ").join(search_sql), sql.SQL(" ) "),]
            )
        )

    if where:
        if isinstance(where, tuple):
            where = list(where)
        if isinstance(where, list):
            where_clause.extend(where)
        else:
            where_clause.append(where)

    if limit and limit != "all":
        limit_clause = sql.SQL(" ").join(
            [sql.SQL("limit"), sql.Literal(int(limit + 1))]
        )

    if where_clause:
        where_clause = sql.SQL(" ").join(
            (sql.SQL("WHERE"), sql.SQL(" AND ").join(where_clause))
        )
    else:
        where_clause = sql.SQL(" ")

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
