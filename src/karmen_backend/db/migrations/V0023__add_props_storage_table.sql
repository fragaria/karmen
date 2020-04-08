create table public.props_storage
(
	name varchar not null,
	props json
);

create unique index props_storage_name_uindex
	on public.props_storage (name);

alter table public.props_storage
	add constraint props_storage_pk
		primary key (name);

