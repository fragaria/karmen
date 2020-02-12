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

insert into public.printers (site_id, uuid, client_props, name, ip, port, hostname, client, printer_props, protocol)
  values (0, '20e91c14-c3e4-4fe9-a066-e69d53324a20', '{"version": {"api": "0.1", "server": "0.0.1", "text": "octoprint fake"}, "connected": false, "access_level": "unlocked"}', 'fake 1', '172.16.236.11', '8080', NULL, 'octoprint', '{"filament_type": "PETG", "filament_color": "black", "bed_type": "Powder coated PEI", "tool0_diameter": 0.25}', 'http')
  on conflict do nothing;
insert into public.printers (site_id, uuid, client_props, name, ip, port, hostname, client, printer_props, protocol)
  values (0, 'e24a9711-aabc-48f0-b790-eac056c43f07', '{"version": {"api": "0.1", "server": "0.0.1", "text": "octoprint fake"}, "connected": false, "access_level": "unlocked"}',	'fake 2',	'172.16.236.12', '8080', NULL,	'octoprint', '{"filament_type": "PLA", "filament_color": "red", "bed_type": "Flat PEI", "tool0_diameter": 0.4}', 'http')
  on conflict do nothing;

insert into public.printers (site_id, uuid, client_props, name, ip, port, hostname, client, printer_props, protocol)
  values (1, '20e91c14-c3e4-4fe9-a066-e69d53324a21', '{"version": {"api": "0.1", "server": "0.0.1", "text": "octoprint fake"}, "connected": false, "access_level": "unlocked"}', 'fake 1 on site 1', '172.16.236.11', '8080', NULL, 'octoprint', '{"filament_type": "PETG", "filament_color": "black", "bed_type": "Powder coated PEI", "tool0_diameter": 0.25}', 'http')
  on conflict do nothing;
insert into public.printers (site_id, uuid, client_props, name, ip, port, hostname, client, printer_props, protocol)
  values (1, 'e24a9711-aabc-48f0-b790-eac056c43f08', '{"version": {"api": "0.1", "server": "0.0.1", "text": "octoprint fake"}, "connected": false, "access_level": "unlocked"}',	'fake 2 on site 1',	'172.16.236.12', '8080', NULL,	'octoprint', '{"filament_type": "PLA", "filament_color": "red", "bed_type": "Flat PEI", "tool0_diameter": 0.4}', 'http')
  on conflict do nothing;

-- Completed on 2019-09-13 11:59:44 CEST

--
-- PostgreSQL database dump complete
--

