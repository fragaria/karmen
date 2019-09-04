--
-- PostgreSQL database dump
--

-- Dumped from database version 10.10 (Ubuntu 10.10-1.pgdg18.04+1)
-- Dumped by pg_dump version 11.5 (Ubuntu 11.5-1.pgdg18.04+1)

-- Started on 2019-09-04 17:04:32 CEST

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
-- TOC entry 198 (class 1259 OID 16402)
-- Name: network_devices; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.network_devices (
    mac character varying(17) NOT NULL,
    ip character varying(15) NOT NULL,
    is_printer boolean DEFAULT false NOT NULL,
    retry_after timestamp without time zone,
    disabled boolean DEFAULT false
);


ALTER TABLE public.network_devices OWNER TO print3d;

--
-- TOC entry 197 (class 1259 OID 16389)
-- Name: printers; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.printers (
    client_props json,
    name character varying(255) NOT NULL,
    mac character varying(17) NOT NULL,
    ip character varying(15) NOT NULL,
    id integer NOT NULL,
    hostname character varying(255),
    client character varying(64) NOT NULL
);


ALTER TABLE public.printers OWNER TO print3d;

--
-- TOC entry 196 (class 1259 OID 16387)
-- Name: printers_id_seq; Type: SEQUENCE; Schema: public; Owner: print3d
--

CREATE SEQUENCE public.printers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.printers_id_seq OWNER TO print3d;

--
-- TOC entry 2926 (class 0 OID 0)
-- Dependencies: 196
-- Name: printers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: print3d
--

ALTER SEQUENCE public.printers_id_seq OWNED BY public.printers.id;


--
-- TOC entry 2791 (class 2604 OID 16392)
-- Name: printers id; Type: DEFAULT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printers ALTER COLUMN id SET DEFAULT nextval('public.printers_id_seq'::regclass);


--
-- TOC entry 2799 (class 2606 OID 16414)
-- Name: network_devices mac_ip_pair; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.network_devices
    ADD CONSTRAINT mac_ip_pair PRIMARY KEY (mac, ip);


--
-- TOC entry 2795 (class 2606 OID 16397)
-- Name: printers printers_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_pkey PRIMARY KEY (id);


--
-- TOC entry 2797 (class 2606 OID 16401)
-- Name: printers uq_mac; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT uq_mac UNIQUE (mac);


-- Completed on 2019-09-04 17:04:32 CEST

--
-- PostgreSQL database dump complete
--

