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

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

ALTER TABLE public.printers ALTER COLUMN uuid DROP DEFAULT;
ALTER TABLE public.gcodes ALTER COLUMN uuid DROP DEFAULT;
ALTER TABLE public.printjobs ALTER COLUMN uuid DROP DEFAULT;

-- invalid printjobs uuids - we don't need to iterate, there is no FK for printjobs
update public.printjobs set uuid = public.gen_random_uuid() where substring(uuid::varchar from 15 for 1) != '4' or substring(uuid::varchar from 20 for 1) not in ('8', '9', 'a', 'b');



-- invalid gcodes uuids
DROP FUNCTION IF EXISTS public.update_gcodes();
CREATE OR REPLACE FUNCTION public.update_gcodes()
  RETURNS VOID AS $BODY$
DECLARE temprow record;
DECLARE nuid uuid;
BEGIN
  FOR temprow IN
    select uuid from public.gcodes where substring(uuid::varchar from 15 for 1) != '4' or substring(uuid::varchar from 20 for 1) not in ('8', '9', 'a', 'b')
  LOOP
    nuid = public.gen_random_uuid();
    UPDATE public.gcodes SET uuid = nuid WHERE uuid = temprow.uuid;
    UPDATE public.printjobs SET gcode_uuid = nuid WHERE gcode_uuid = temprow.uuid;
  END LOOP;
  update public.printjobs pj1
    set gcode_data = gcode_data || (select concat('{"uuid": "'||concat(gcode_uuid, '')||'"}')::text from public.printjobs pj2 where pj2.uuid = pj1.uuid)::jsonb
    where gcode_data->>'uuid'::text !=  gcode_uuid::text;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

ALTER TABLE ONLY public.printjobs
    DROP CONSTRAINT IF EXISTS printjob_gcode_uuid;

SELECT 1 from public.update_gcodes();

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjob_gcode_uuid FOREIGN KEY (gcode_uuid) REFERENCES public.gcodes(uuid) ON DELETE SET NULL;



-- invalid printers uuids
DROP FUNCTION IF EXISTS public.update_printers();
CREATE OR REPLACE FUNCTION public.update_printers()
  RETURNS VOID AS $BODY$
DECLARE temprow record;
DECLARE nuid uuid;
BEGIN
  FOR temprow IN
    select uuid from public.printers where substring(uuid::varchar from 15 for 1) != '4' or substring(uuid::varchar from 20 for 1) not in ('8', '9', 'a', 'b')
  LOOP
    nuid = public.gen_random_uuid();
    UPDATE public.printers SET uuid = nuid WHERE uuid = temprow.uuid;
    UPDATE public.printjobs SET printer_uuid = nuid WHERE printer_uuid = temprow.uuid;
  END LOOP;
END$BODY$
  LANGUAGE plpgsql VOLATILE;

ALTER TABLE ONLY public.printjobs
    DROP CONSTRAINT IF EXISTS printjobs_printer_uuid_fk;

SELECT 1 from public.update_printers();

ALTER TABLE public.printjobs
  ADD CONSTRAINT printjobs_printer_uuid_fk FOREIGN KEY (printer_uuid)
      REFERENCES public.printers (uuid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE SET NULL;

DROP FUNCTION IF EXISTS public.update_gcodes();
DROP FUNCTION IF EXISTS public.update_printers();
