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

-- we are going to be generating uuids
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;

CREATE TABLE public.network_clients
(
  uuid uuid NOT NULL,
  client character varying(64) NOT NULL,
  protocol character varying(5) NOT NULL DEFAULT 'http'::character varying,
  ip character varying(21) NOT NULL,
  hostname character varying(255),
  port integer,
  path character varying DEFAULT ''::character varying,
  token character varying DEFAULT NULL,
  CONSTRAINT network_clients_uuid_pkey PRIMARY KEY (uuid),
  CONSTRAINT network_clients_identification UNIQUE (protocol, ip, port, path, token)
);

-- alter printers
ALTER TABLE public.printers
    ADD COLUMN IF NOT EXISTS network_client_uuid uuid;

-- migrate data
--   copy over unique network_clients

insert into public.network_clients(uuid, client, protocol, ip, hostname, port, path, token)
  select public.gen_random_uuid(), client, protocol, ip, hostname, port, path, token from public.printers group by (client, protocol, ip, hostname, port, path, token);

--   set network_client_uuid in printers
update public.printers p set network_client_uuid = (
  select uuid from public.network_clients nc where nc.ip = p.ip and nc.protocol = p.protocol and nc.client = p.client and nc.hostname = p.hostname and nc.port = p.port and nc.path = p.path and nc.token = p.token
) where network_client_uuid is null;

--   cleanup token column - empty string to nulls
update public.network_clients set token = null where token = '';


-- reconnect foreign keys and set constraints
ALTER TABLE public.printers
  ADD CONSTRAINT printer_network_client_uuid FOREIGN KEY (network_client_uuid)
      REFERENCES public.network_clients (uuid) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE CASCADE;

ALTER TABLE public.printers
  DROP CONSTRAINT IF EXISTS printer_uq_ip_port_path_org;

ALTER TABLE public.printers
  ADD CONSTRAINT printer_org_network_client UNIQUE(organization_uuid, network_client_uuid);

ALTER TABLE public.printers
  ALTER COLUMN network_client_uuid SET NOT NULL;

-- drop columns from printers
ALTER TABLE public.printers
  DROP COLUMN IF EXISTS client,
  DROP COLUMN IF EXISTS protocol,
  DROP COLUMN IF EXISTS ip,
  DROP COLUMN IF EXISTS hostname,
  DROP COLUMN IF EXISTS port,
  DROP COLUMN IF EXISTS path,
  DROP COLUMN IF EXISTS token;
