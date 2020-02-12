SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

-- props to https://stackoverflow.com/questions/48102295/rename-column-only-if-exists
DROP FUNCTION IF EXISTS public.column_exists(text,text);
CREATE OR REPLACE FUNCTION public.column_exists(ptable TEXT, pcolumn TEXT)
  RETURNS BOOLEAN AS $BODY$
DECLARE result bool;
BEGIN
    -- Does the requested column exist?
    SELECT COUNT(*) INTO result
    FROM information_schema.columns
    WHERE
      table_name = ptable and
      column_name = pcolumn;
    RETURN result;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

DROP FUNCTION IF EXISTS public.rename_column_if_exists(text,text,text);
CREATE OR REPLACE FUNCTION public.rename_column_if_exists(ptable TEXT, pcolumn TEXT, new_name TEXT)
  RETURNS VOID AS $BODY$
BEGIN
    -- Rename the column if it exists.
    IF public.column_exists(ptable, pcolumn) THEN
        EXECUTE FORMAT('ALTER TABLE public.%I RENAME COLUMN %I TO %I;',
            ptable, pcolumn, new_name);
    END IF;
END$BODY$
  LANGUAGE plpgsql VOLATILE;


SELECT 1 from public.rename_column_if_exists('printers', 'ip', 'host');
SELECT 1 from public.rename_column_if_exists('printjobs', 'printer_ip', 'printer_host');

DROP FUNCTION IF EXISTS public.column_exists(text,text);
DROP FUNCTION IF EXISTS public.rename_column_if_exists(text,text,text);
