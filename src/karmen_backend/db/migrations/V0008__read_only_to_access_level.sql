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

update public.printers p
set client_props = (
  select json_build_object('access_level', 'unlocked',
    'version', (select (pa.client_props -> 'version') from public.printers pa where pa.host = p.host),
    'connected', (select (pb.client_props -> 'connected') from public.printers pb where pb.host = p.host))
) where p.client_props -> 'access_level' is null;