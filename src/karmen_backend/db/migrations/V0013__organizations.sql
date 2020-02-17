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

CREATE TABLE public.organizations (
    uuid uuid NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255),
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT organizations_pkey PRIMARY KEY (uuid),
    CONSTRAINT uq_organizations_slug UNIQUE (slug)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;

-- create default organization for a migration
INSERT INTO public.organizations(uuid, name, slug) VALUES ('b3060e41-e319-4a9b-8ac4-e0936c75f275', 'Default organization', 'default-organization');

CREATE TABLE public.organization_roles (
    organization_uuid uuid NOT NULL,
    user_uuid uuid NOT NULL,
    role character varying(16) COLLATE pg_catalog."default" NOT NULL DEFAULT 'user',
    created timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT uq_org_role UNIQUE (organization_uuid, user_uuid)
)
WITH (
    OIDS = FALSE
)
TABLESPACE pg_default;


ALTER TABLE public.printers
    ADD COLUMN IF NOT EXISTS organization_uuid uuid;

ALTER TABLE public.settings
    ADD COLUMN IF NOT EXISTS organization_uuid uuid;

ALTER TABLE public.gcodes
    ADD COLUMN IF NOT EXISTS organization_uuid uuid;

ALTER TABLE public.printjobs
    ADD COLUMN IF NOT EXISTS organization_uuid uuid;

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS system_role character varying(16) COLLATE pg_catalog."default" NOT NULL DEFAULT 'user';

ALTER TABLE public.api_tokens
  ADD COLUMN IF NOT EXISTS organization_uuid uuid;

-- migrate
update public.printers set organization_uuid = 'b3060e41-e319-4a9b-8ac4-e0936c75f275' where organization_uuid = null;
update public.settings set organization_uuid = 'b3060e41-e319-4a9b-8ac4-e0936c75f275' where organization_uuid = null;
update public.gcodes set organization_uuid = 'b3060e41-e319-4a9b-8ac4-e0936c75f275' where organization_uuid = null;
update public.printjobs set organization_uuid = 'b3060e41-e319-4a9b-8ac4-e0936c75f275' where organization_uuid = null;
update public.api_tokens set organization_uuid = 'b3060e41-e319-4a9b-8ac4-e0936c75f275' where organization_uuid = null;

DROP FUNCTION IF EXISTS public.migrate_roles();
CREATE OR REPLACE FUNCTION public.migrate_roles()
RETURNS VOID AS $$
DECLARE rec RECORD;
BEGIN
    FOR rec IN SELECT uuid, role 
          FROM public.users
    LOOP 
   insert into public.organization_roles (organization_uuid, user_uuid, role) values ('b3060e41-e319-4a9b-8ac4-e0936c75f275', rec.uuid, rec.role);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

select public.migrate_roles();

-- migrate system roles
ALTER TABLE public.users
  DROP COLUMN IF EXISTS role;

update public.users set system_role = 'admin'
  where uuid = '1b59f2e0-336f-4a1c-8caf-1f074fc43744';

-- update indices
ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printer_uq_ip_port;
DROP INDEX IF EXISTS public.printer_uq_ip_port;
ALTER TABLE public.printers
  ADD CONSTRAINT printer_uq_ip_port_org UNIQUE(organization_uuid, ip, port);

ALTER TABLE public.settings
  DROP CONSTRAINT IF EXISTS settings_key_uqc;
DROP INDEX IF EXISTS public.settings_key_uqc;
ALTER TABLE public.settings
  ADD CONSTRAINT settings_uq_key_org UNIQUE(organization_uuid, key);

-- drop settings
DROP TABLE IF EXISTS public.settings;

DROP FUNCTION IF EXISTS public.migrate_roles();

