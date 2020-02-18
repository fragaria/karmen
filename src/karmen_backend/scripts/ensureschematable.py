import sys
import os
from datetime import datetime
from contextlib import contextmanager
import psycopg2
import psycopg2.extensions
import psycopg2.extras

DSN = "host='%s' port=%s dbname='print3d' user='print3d' password='print3d'" % (os.environ.get("POSTGRES_HOST", "127.0.0.1"), os.environ.get("POSTGRES_PORT", "5433"))
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

with get_connection() as connection:
    cursor = connection.cursor(cursor_factory=psycopg2.extras.DictCursor)
    cursor.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_catalog = 'print3d' AND table_name = 'printers');")
    printers_table_exists = cursor.fetchone()[0]
    cursor.execute("SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_catalog = 'print3d' AND table_name = 'schema_version');")
    schema_version_exists = cursor.fetchone()[0]
    if schema_version_exists and printers_table_exists:
        print("Both printers and schema_version tables exist, everything seems to be ok")
        sys.exit(0)
    if not schema_version_exists and not printers_table_exists:
        print("No tables, let pgmigrate handle this")
        sys.exit(0)
    if schema_version_exists and not printers_table_exists:
        print("schema_version table exists, not printers though, let pgmigrate handle this")
        sys.exit(0)
    if not schema_version_exists and printers_table_exists:
        print("printers table exists, no schema_version though, this is pre-pgmigrate installation, making schema_version...")

        cursor.execute("CREATE TYPE public.schema_version_type AS ENUM ('auto', 'manual')")
        cursor.execute("ALTER TYPE public.schema_version_type OWNER TO print3d;")
        create_schema_sql = """CREATE TABLE public.schema_version
        (
            version bigint NOT NULL,
            description text COLLATE pg_catalog."default" NOT NULL,
            type schema_version_type NOT NULL DEFAULT 'auto'::schema_version_type,
            installed_by text COLLATE pg_catalog."default" NOT NULL,
            installed_on timestamp without time zone NOT NULL DEFAULT now(),
            CONSTRAINT schema_version_pkey PRIMARY KEY (version)
        )
        WITH (
            OIDS = FALSE
        );"""
        cursor.execute(create_schema_sql)
        cursor.execute("INSERT INTO public.schema_version(version, description, type, installed_by, installed_on) VALUES (1, 'initial schema', 'auto', 'print3d', current_timestamp)")
        sys.exit(0)
