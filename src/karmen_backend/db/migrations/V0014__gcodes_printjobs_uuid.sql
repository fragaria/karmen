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
    ADD COLUMN IF NOT EXISTS uuid uuid DEFAULT MD5(RANDOM()::TEXT || ':' || CURRENT_TIMESTAMP)::UUID NOT NULL;

ALTER TABLE public.printjobs
    ADD COLUMN IF NOT EXISTS gcode_uuid uuid,
    ADD COLUMN IF NOT EXISTS uuid uuid DEFAULT MD5(RANDOM()::TEXT || ':' || CURRENT_TIMESTAMP)::UUID NOT NULL;

UPDATE public.printjobs pj set gcode_uuid = (select uuid from public.gcodes g where g.id = pj.gcode_id) where pj.gcode_uuid is null;

update public.printjobs pj1
  set gcode_data = gcode_data || (select concat('{"uuid": "'||concat(gcode_uuid, '')||'"}')::text from public.printjobs pj2 where pj2.uuid = pj1.uuid)::jsonb
  where gcode_data->>'uuid' is null and gcode_uuid is not null;

update public.printjobs
  set gcode_data = jsonb (gcode_data - 'id')
  where gcode_data->>'id' is not null and gcode_uuid is not null;

ALTER TABLE ONLY public.gcodes
    DROP CONSTRAINT IF EXISTS gcodes_pkey;

ALTER TABLE ONLY public.printjobs
    DROP CONSTRAINT IF EXISTS printjobs_pkey;

ALTER TABLE public.printjobs
    DROP COLUMN IF EXISTS gcode_id;

ALTER TABLE public.printjobs
    DROP COLUMN IF EXISTS id;

ALTER TABLE public.gcodes
    DROP COLUMN IF EXISTS id;

ALTER TABLE ONLY public.gcodes
    ADD CONSTRAINT gcodes_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjobs_pkey PRIMARY KEY (uuid);

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjob_gcode_uuid FOREIGN KEY (gcode_uuid) REFERENCES public.gcodes(uuid) ON DELETE SET NULL;

DROP SEQUENCE IF EXISTS public.gcodes_id_seq;

DROP SEQUENCE IF EXISTS public.printjobs_id_seq;