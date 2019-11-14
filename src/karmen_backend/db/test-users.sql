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

insert into public.users (uuid, username, role, providers, providers_data)
  values ('6480fa7d-ce18-4ae2-818b-f1d200050806', 'test-admin', 'admin', '{"local"}', '{}')
  on conflict do nothing;

-- password is admin-password
insert into public.local_users (uuid, pwd_hash, force_pwd_change)
  values ('6480fa7d-ce18-4ae2-818b-f1d200050806', '$2y$12$CRQGOVhX80/3heHKZJ3smOGy8LJ/vcwQDuwGY8LGI5u209rw7LvYO', false)
  on conflict do nothing;

insert into public.users (uuid, username, role, providers, providers_data)
  values ('77315957-8ebb-4a44-976c-758dbf28bb9f', 'test-user', 'user', '{"local"}', '{}')
  on conflict do nothing;

-- password is user-password
insert into public.local_users (uuid, pwd_hash, force_pwd_change)
  values ('77315957-8ebb-4a44-976c-758dbf28bb9f', '$2y$12$Ps7.CAGKkSRmx9AhDxk33.B9G.W6TI9KwnLeU1qUrXAWiwjCzO76C', false)
  on conflict do nothing;

insert into public.users (uuid, username, role, providers, providers_data)
  values ('e076b705-a484-4d24-844d-02594ac40b12', 'test-user-2', 'user', '{"local"}', '{}')
  on conflict do nothing;

-- password is user-password
insert into public.local_users (uuid, pwd_hash, force_pwd_change)
  values ('e076b705-a484-4d24-844d-02594ac40b12', '$2y$12$Ps7.CAGKkSRmx9AhDxk33.B9G.W6TI9KwnLeU1qUrXAWiwjCzO76C', false)
  on conflict do nothing;
