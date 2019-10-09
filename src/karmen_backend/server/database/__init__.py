from contextlib import contextmanager
import psycopg2
from psycopg2 import sql
import psycopg2.extensions
from server import app

DSN = app.config['DB_DSN']
CONNECTION = None

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

def compose_order_by(columns, order_by):
    if not order_by:
        return sql.SQL('')

    order_bys = []
    for order in order_by:
        direction = order[0:1] if order[0:1] in ['+', '-'] else '+'
        column = order[1:] if order[0] == direction else order
        if column in columns:
            order_bys.append(sql.SQL(' ').join([sql.Identifier(column), sql.SQL('DESC' if direction == '-' else 'ASC')]))
    return sql.SQL("order by {}").format(sql.SQL(', ').join(order_bys))
