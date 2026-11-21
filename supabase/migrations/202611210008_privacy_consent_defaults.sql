alter table public.profiles
  alter column discovery_visible set default false;

alter table public.consents
  alter column discovery_visible set default false;

update public.profiles
set discovery_visible = false
where discovery_visible is distinct from false;

update public.consents
set discovery_visible = false
where discovery_visible is distinct from false;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.profiles(id, display_name, discovery_visible)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''), false);

  insert into public.consents(
    user_id,
    ai_memory_opt_in,
    cycle_tracking_opt_in,
    discovery_visible
  )
  values (new.id, false, false, false)
  on conflict (user_id) do nothing;

  insert into public.user_roles(user_id, role)
  values (new.id, 'student')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;
