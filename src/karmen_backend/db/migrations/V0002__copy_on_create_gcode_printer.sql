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


-- Add the copy-on-create metadata columns
ALTER TABLE public.printjobs
    ADD COLUMN IF NOT EXISTS gcode_data json;
ALTER TABLE public.printjobs
    ADD COLUMN IF NOT EXISTS printer_data json;

-- Populate data of the existing records
update public.printjobs pj set gcode_data = (
  select row_to_json(tmp) from (select id, filename, size from public.gcodes gc where gc.id = pj.gcode_id) tmp
) where gcode_data is null;
update public.printjobs pj set printer_data = (
  select row_to_json(tmp) from (select ip, name, client from public.printers p where p.ip = pj.printer_ip) tmp
) where printer_data is null;

-- Dropping foreign key constraints to be able to remove the parent records
ALTER TABLE public.printjobs DROP CONSTRAINT IF EXISTS printjob_gcode_id;
ALTER TABLE public.printjobs DROP CONSTRAINT IF EXISTS printjob_printer_ip;

-- Indexing the columns previously indexed by foreign key constraint
CREATE INDEX IF NOT EXISTS printjobs_gcode_id_idx
    ON public.printjobs USING btree
    (gcode_id ASC NULLS LAST)
    TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS printjobs_printer_ip_idx
    ON public.printjobs USING btree
    (printer_ip ASC NULLS LAST)
    TABLESPACE pg_default;
