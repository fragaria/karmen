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

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS email character varying;

UPDATE public.users SET email = username||'@karmen.local' where email IS NULL;

ALTER TABLE public.users
  ALTER COLUMN email SET NOT NULL;

ALTER TABLE public.users
  ADD CONSTRAINT uq_user_email UNIQUE (email);
