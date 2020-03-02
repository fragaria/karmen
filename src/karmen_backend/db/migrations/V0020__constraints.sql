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


ALTER TABLE public.organization_roles
  DROP CONSTRAINT IF EXISTS fk_organization_uuid;

ALTER TABLE public.organization_roles
  ADD CONSTRAINT fk_organization_uuid FOREIGN KEY (organization_uuid) REFERENCES public.organizations (uuid)
   ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_oroles_org_uuid
  ON public.organization_roles(organization_uuid);

ALTER TABLE public.organization_roles
  DROP CONSTRAINT IF EXISTS fk_user_uuid;

ALTER TABLE public.organization_roles
  ADD CONSTRAINT fk_user_uuid FOREIGN KEY (user_uuid) REFERENCES public.users (uuid)
   ON UPDATE CASCADE ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_oroles_user_uuid
  ON public.organization_roles(user_uuid);

ALTER TABLE public.api_tokens
  DROP CONSTRAINT IF EXISTS api_tokens_org_uuid;

ALTER TABLE public.api_tokens
  ADD CONSTRAINT api_tokens_org_uuid FOREIGN KEY (organization_uuid) REFERENCES public.organizations (uuid)
   ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_api_tokens_org_uuid
  ON public.api_tokens(organization_uuid);

ALTER TABLE public.api_tokens
  DROP CONSTRAINT IF EXISTS api_tokens_user_uuid;

ALTER TABLE public.api_tokens
  ADD CONSTRAINT api_tokens_user_uuid FOREIGN KEY (user_uuid) REFERENCES public.users (uuid)
   ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_api_tokens_user_uuid
  ON public.api_tokens(user_uuid);

ALTER TABLE public.gcodes
  DROP CONSTRAINT IF EXISTS gcode_user_uuid_fk;
ALTER TABLE public.gcodes
  DROP CONSTRAINT IF EXISTS gcode_user_uuid;

ALTER TABLE public.gcodes
  ADD CONSTRAINT gcode_user_uuid FOREIGN KEY (user_uuid) REFERENCES public.users (uuid)
   ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_gcodes_user_uuid
  ON public.gcodes(user_uuid);

ALTER TABLE public.gcodes
  DROP CONSTRAINT IF EXISTS gcodes_organization_uuid;

ALTER TABLE public.gcodes
  ADD CONSTRAINT gcodes_organization_uuid FOREIGN KEY (organization_uuid)
      REFERENCES public.organizations (uuid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_gcodes_org_uuid
  ON public.gcodes(organization_uuid);

ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printer_organization_uuid;

ALTER TABLE public.printers
  ADD CONSTRAINT printer_organization_uuid FOREIGN KEY (organization_uuid) REFERENCES public.organizations (uuid)
   ON UPDATE NO ACTION ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS fki_printers_org_uuid
  ON public.gcodes(organization_uuid);