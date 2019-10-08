--
-- PostgreSQL database dump
--

-- Dumped from database version 11.5 (Debian 11.5-1.pgdg90+1)
-- Dumped by pg_dump version 11.5 (Ubuntu 11.5-1.pgdg18.04+1)

-- Started on 2019-09-13 11:59:43 CEST

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

--
-- TOC entry 2868 (class 0 OID 16389)
-- Dependencies: 197
-- Data for Name: printers; Type: TABLE DATA; Schema: public; Owner: print3d
--

insert into public.printers (client_props, name, ip, hostname, client)
  values ('{"version": {"api": "0.1", "server": "0.0.1", "text": "Fake octoprint"}, "connected": false, "read_only": false}', 'fake 1', '172.16.236.11:8080', NULL, 'octoprint')
  on conflict do nothing;
insert into public.printers (client_props, name, ip, hostname, client)
  values ('{"version": {"api": "0.1", "server": "0.0.1", "text": "Fake octoprint"}, "connected": false, "read_only": false}',	'fake 2',	'172.16.236.12:8080', NULL,	'octoprint')
  on conflict do nothing;


-- Completed on 2019-09-13 11:59:44 CEST

--
-- PostgreSQL database dump complete
--

