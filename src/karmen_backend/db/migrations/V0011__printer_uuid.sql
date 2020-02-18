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

---- helpers -------

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

------ end helpers -----

-- Add the columns to printers
ALTER TABLE public.printers
    ADD COLUMN IF NOT EXISTS uuid uuid DEFAULT MD5(RANDOM()::TEXT || ':' || CURRENT_TIMESTAMP)::UUID NOT NULL,
    ADD COLUMN IF NOT EXISTS port integer DEFAULT NULL;

-- Bring printjobs up to date
ALTER TABLE public.printjobs
    ADD COLUMN IF NOT EXISTS printer_uuid uuid;

update public.printjobs pj
  set printer_uuid = (select uuid from public.printers p where p.host = pj.printer_host)
  where printer_uuid is null;

-- add ip, port, hostname to printer_data
update public.printjobs pj1
  set printer_data = (select jsonb_set(printer_data, '{port}', nullif(split_part(printer_data->>'host', ':', 2), '')::jsonb) from public.printjobs pj2 where pj1.id = pj2.id)
  where nullif(split_part(printer_data->>'host', ':', 2), '') is not null;

update public.printjobs pj1
  set printer_data = (printer_data)||(((select concat('{"ip":"', split_part(printer_data->>'host', ':', 1), '"}') from public.printjobs pj2 where pj1.id = pj2.id)::text)::jsonb)
  where nullif(split_part(printer_data->>'host', ':', 1), '') is not null;

update public.printjobs pj1
  set printer_data = printer_data || (select concat('{"hostname": "'||concat(hostname, '')||'"}')::text from public.printers p where p.uuid = pj1.printer_uuid)::jsonb
  where printer_data->>'hostname' is null and (select hostname from public.printers p2 where p2.uuid = pj1.printer_uuid) is not null;

update public.printjobs
  set printer_data = jsonb (printer_data - 'host')
  where printer_data->>'host' is not null;

-- Handle ip and port and rename host back to ip
SELECT 1 from public.rename_column_if_exists('printers', 'host', 'ip');

update public.printers p
  set port = (select nullif(split_part(ip, ':', 2), '') as port from public.printers r where r.uuid = p.uuid)::integer
  where port is null;

update public.printers p
  set ip = (select nullif(split_part(ip, ':', 1), '') as addr from public.printers r where r.uuid = p.uuid);

-- Setup new constraints on printers and printjobs
ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printers_ip_pkey;
ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printers_uuid_pkey;
ALTER TABLE public.printers
  ADD CONSTRAINT printers_uuid_pkey PRIMARY KEY(uuid);

ALTER TABLE public.printjobs
  DROP COLUMN IF EXISTS printer_host;

ALTER TABLE public.printjobs
  DROP CONSTRAINT IF EXISTS printjobs_printer_uuid_fk;
ALTER TABLE public.printjobs
  ADD CONSTRAINT printjobs_printer_uuid_fk FOREIGN KEY (printer_uuid) REFERENCES public.printers (uuid)
   ON UPDATE NO ACTION ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS fki_printjobs_printer_uuid_fk 
  ON public.printjobs(printer_uuid);

CREATE UNIQUE INDEX IF NOT EXISTS printer_hostname_ip_port 
  ON public.printers(hostname, ip, port);


DROP FUNCTION IF EXISTS public.column_exists(text,text);
DROP FUNCTION IF EXISTS public.rename_column_if_exists(text,text,text);
