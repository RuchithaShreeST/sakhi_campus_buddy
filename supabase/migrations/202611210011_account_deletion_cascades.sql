alter table public.user_roles
  drop constraint if exists user_roles_granted_by_fkey,
  add constraint user_roles_granted_by_fkey
    foreign key (granted_by) references public.profiles(id) on delete set null;

alter table public.reports
  drop constraint if exists reports_moderator_id_fkey,
  add constraint reports_moderator_id_fkey
    foreign key (moderator_id) references public.profiles(id) on delete set null;

alter table public.audit_log
  drop constraint if exists audit_log_actor_id_fkey,
  add constraint audit_log_actor_id_fkey
    foreign key (actor_id) references public.profiles(id) on delete set null;

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  delete from auth.users where id = current_user_id;
  if not found then
    raise exception 'Authenticated account was not found';
  end if;
end;
$$;

revoke all on function public.delete_current_user() from public, anon, authenticated;
grant execute on function public.delete_current_user() to authenticated;
