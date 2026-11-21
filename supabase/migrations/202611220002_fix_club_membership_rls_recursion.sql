create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_club_member(p_club_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select auth.uid() is not null
    and auth.role() = 'authenticated'
    and exists (
      select 1
      from public.club_members cm
      where cm.club_id = p_club_id
        and cm.user_id = auth.uid()
        and cm.deleted_at is null
    );
$$;

revoke all on function private.is_club_member(uuid) from public, anon, authenticated;
grant execute on function private.is_club_member(uuid) to authenticated;

drop policy if exists "club memberships read" on public.club_members;
create policy "club memberships read" on public.club_members for select
to authenticated
using (
  auth.uid() = user_id
  or private.is_club_member(club_id)
);
