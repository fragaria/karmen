insert into public.users (uuid, username, email, system_role, providers, providers_data)
  values ('1b59f2e0-336f-4a1c-8caf-1f074fc43744', 'karmen', 'karmen@karmen.local', 'admin', '{"local"}', '{}')
  on conflict do nothing;

update public.users set system_role = 'admin'
  where uuid = '1b59f2e0-336f-4a1c-8caf-1f074fc43744';

-- password is karmen3D
insert into public.local_users (user_uuid, pwd_hash, force_pwd_change)
  values ('1b59f2e0-336f-4a1c-8caf-1f074fc43744', '$2y$12$6w9ml13UTA2Re2GcqDHFJuVHB3WLlPPyg430vrve/hrjR5yWO0LYm', true)
  on conflict do nothing;

----