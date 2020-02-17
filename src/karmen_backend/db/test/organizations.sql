INSERT INTO public.organizations(uuid, name, slug) VALUES ('b3060e41-e319-4a9b-8ac4-e0936c75f275', 'Default organization', 'default-organization')
  on conflict do nothing;

INSERT INTO public.organizations(uuid, name, slug) VALUES ('d973e553-122b-46bb-b852-d6ab4472dbd5', 'Another', 'another')
  on conflict do nothing;
