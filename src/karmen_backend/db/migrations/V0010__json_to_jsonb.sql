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

ALTER TABLE public.gcodes
  ALTER COLUMN analysis
  SET DATA TYPE jsonb
  USING analysis::jsonb;

ALTER TABLE public.printers
  ALTER COLUMN printer_props
  SET DATA TYPE jsonb
  USING printer_props::jsonb;

ALTER TABLE public.printjobs
  ALTER COLUMN gcode_data
  SET DATA TYPE jsonb
  USING gcode_data::jsonb;

ALTER TABLE public.printjobs
  ALTER COLUMN printer_data
  SET DATA TYPE jsonb
  USING printer_data::jsonb;
