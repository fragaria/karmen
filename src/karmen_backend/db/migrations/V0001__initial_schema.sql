--
-- PostgreSQL database dump
--

-- Dumped from database version 11.5 (Debian 11.5-1.pgdg90+1)
-- Dumped by pg_dump version 11.5 (Ubuntu 11.5-1.pgdg18.04+1)

-- Started on 2019-09-25 12:36:10 CEST

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
-- TOC entry 196 (class 1259 OID 16385)
-- Name: gcodes; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.gcodes (
    id integer NOT NULL,
    path character varying NOT NULL,
    filename character varying NOT NULL,
    display character varying NOT NULL,
    absolute_path character varying NOT NULL,
    uploaded timestamp with time zone DEFAULT now() NOT NULL,
    size integer NOT NULL
);


--
-- TOC entry 197 (class 1259 OID 16392)
-- Name: gcodes_id_seq; Type: SEQUENCE; Schema: public; Owner: print3d
--

CREATE SEQUENCE public.gcodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 2905 (class 0 OID 0)
-- Dependencies: 197
-- Name: gcodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: print3d
--

ALTER SEQUENCE public.gcodes_id_seq OWNED BY public.gcodes.id;


--
-- TOC entry 198 (class 1259 OID 16394)
-- Name: network_devices; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.network_devices (
    ip character varying(21) NOT NULL,
    retry_after timestamp without time zone,
    disabled boolean DEFAULT false
);



--
-- TOC entry 199 (class 1259 OID 16398)
-- Name: printers; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.printers (
    client_props json,
    name character varying(255) NOT NULL,
    ip character varying(21) NOT NULL,
    hostname character varying(255),
    client character varying(64) NOT NULL
);



--
-- TOC entry 200 (class 1259 OID 16404)
-- Name: printjobs; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.printjobs (
    id integer NOT NULL,
    started timestamp with time zone DEFAULT now() NOT NULL,
    gcode_id integer NOT NULL,
    printer_ip character varying(21) NOT NULL
);



--
-- TOC entry 201 (class 1259 OID 16407)
-- Name: printjobs_id_seq; Type: SEQUENCE; Schema: public; Owner: print3d
--

CREATE SEQUENCE public.printjobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;



--
-- TOC entry 2906 (class 0 OID 0)
-- Dependencies: 201
-- Name: printjobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: print3d
--

ALTER SEQUENCE public.printjobs_id_seq OWNED BY public.printjobs.id;


--
-- TOC entry 202 (class 1259 OID 16409)
-- Name: settings; Type: TABLE; Schema: public; Owner: print3d
--

CREATE TABLE public.settings (
    key character varying NOT NULL,
    val character varying
);



--
-- TOC entry 2762 (class 2604 OID 16415)
-- Name: gcodes id; Type: DEFAULT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.gcodes ALTER COLUMN id SET DEFAULT nextval('public.gcodes_id_seq'::regclass);


--
-- TOC entry 2764 (class 2604 OID 16416)
-- Name: printjobs id; Type: DEFAULT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printjobs ALTER COLUMN id SET DEFAULT nextval('public.printjobs_id_seq'::regclass);


--
-- TOC entry 2767 (class 2606 OID 16418)
-- Name: gcodes gcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.gcodes
    ADD CONSTRAINT gcodes_pkey PRIMARY KEY (id);


--
-- TOC entry 2769 (class 2606 OID 16420)
-- Name: network_devices network_devices_ip_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.network_devices
    ADD CONSTRAINT network_devices_ip_pkey PRIMARY KEY (ip);


--
-- TOC entry 2771 (class 2606 OID 16422)
-- Name: printers printers_ip_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printers
    ADD CONSTRAINT printers_ip_pkey PRIMARY KEY (ip);


--
-- TOC entry 2773 (class 2606 OID 16424)
-- Name: printjobs printjobs_pkey; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjobs_pkey PRIMARY KEY (id);


--
-- TOC entry 2776 (class 2606 OID 16426)
-- Name: settings settings_key_uqc; Type: CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_uqc UNIQUE (key);


--
-- TOC entry 2774 (class 1259 OID 16427)
-- Name: settings_key_uq; Type: INDEX; Schema: public; Owner: print3d
--

CREATE UNIQUE INDEX settings_key_uq ON public.settings USING btree (key);


--
-- TOC entry 2777 (class 2606 OID 16428)
-- Name: printjobs printjob_gcode_id; Type: FK CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjob_gcode_id FOREIGN KEY (gcode_id) REFERENCES public.gcodes(id);


--
-- TOC entry 2778 (class 2606 OID 16433)
-- Name: printjobs printjob_printer_ip; Type: FK CONSTRAINT; Schema: public; Owner: print3d
--

ALTER TABLE ONLY public.printjobs
    ADD CONSTRAINT printjob_printer_ip FOREIGN KEY (printer_ip) REFERENCES public.printers(ip);


-- Completed on 2019-09-25 12:36:10 CEST

--
-- PostgreSQL database dump complete
--

