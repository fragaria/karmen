--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-1.pgdg18.04+1)
-- Dumped by pg_dump version 11.5 (Ubuntu 11.5-1.pgdg18.04+1)

-- Started on 2019-09-05 09:42:42 CEST

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

SET default_with_oids = false;

--
-- TOC entry 197 (class 1259 OID 16402)
-- Name: network_devices; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.network_devices (
    ip character varying(15) NOT NULL,
    retry_after timestamp without time zone,
    disabled boolean DEFAULT false
);


ALTER TABLE public.network_devices OWNER TO print3d;

--
-- TOC entry 196 (class 1259 OID 16389)
-- Name: printers; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.printers (
    client_props json,
    name character varying(255) NOT NULL,
    ip character varying(15) NOT NULL,
    hostname character varying(255),
    client character varying(64) NOT NULL
);


ALTER TABLE public.printers OWNER TO print3d;

--
-- TOC entry 2793 (class 2606 OID 16416)
-- Name: network_devices network_devices_ip_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.network_devices
    ADD CONSTRAINT network_devices_ip_pkey PRIMARY KEY (ip);


--
-- TOC entry 2791 (class 2606 OID 16418)
-- Name: printers printers_ip_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_ip_pkey PRIMARY KEY (ip);


-- Completed on 2019-09-05 09:42:42 CEST

--
-- PostgreSQL database dump complete
--

