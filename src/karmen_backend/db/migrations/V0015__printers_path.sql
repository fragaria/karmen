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

ALTER TABLE public.printers
    ADD COLUMN IF NOT EXISTS path character varying DEFAULT '';


ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printer_uq_ip_port_org;
DROP INDEX IF EXISTS public.printer_uq_ip_port_org;
ALTER TABLE public.printers
  ADD CONSTRAINT printer_uq_ip_port_path_org UNIQUE(organization_uuid, ip, port, path);