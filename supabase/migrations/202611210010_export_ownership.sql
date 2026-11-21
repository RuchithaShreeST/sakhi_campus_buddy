alter table public.posts
  add column if not exists user_id uuid references public.profiles(id) on delete cascade,
  add column if not exists is_anonymous boolean not null default false;

update public.posts
set user_id = author_id
where user_id is null and author_id is not null;

alter table public.comments
  add column if not exists user_id uuid references public.profiles(id) on delete cascade;

update public.comments
set user_id = author_id
where user_id is null and author_id is not null;

create or replace function public.set_circle_content_owner()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  new.user_id := auth.uid();
  if tg_table_name = 'posts' then
    new.author_id := case when new.is_anonymous then null else auth.uid() end;
  else
    new.author_id := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists posts_set_content_owner on public.posts;
create trigger posts_set_content_owner
before insert on public.posts
for each row execute function public.set_circle_content_owner();

drop trigger if exists comments_set_content_owner on public.comments;
create trigger comments_set_content_owner
before insert on public.comments
for each row execute function public.set_circle_content_owner();

drop policy if exists "posts owner insert" on public.posts;
drop policy if exists "posts owner update" on public.posts;
create policy "posts owner read" on public.posts for select
using (auth.uid() = user_id);
create policy "posts owner insert" on public.posts for insert
with check (
  auth.uid() = user_id
  and (
    (is_anonymous and author_id is null)
    or (not is_anonymous and author_id = auth.uid())
  )
);
create policy "posts owner update" on public.posts for update
using (auth.uid() = user_id)
with check (
  auth.uid() = user_id
  and (
    (is_anonymous and author_id is null)
    or (not is_anonymous and author_id = auth.uid())
  )
);

drop policy if exists "comments owner insert" on public.comments;
drop policy if exists "comments owner update" on public.comments;
create policy "comments owner read" on public.comments for select
using (auth.uid() = user_id);
create policy "comments owner insert" on public.comments for insert
with check (auth.uid() = user_id and auth.uid() = author_id);
create policy "comments owner update" on public.comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id and auth.uid() = author_id);

create policy "audit actor read" on public.audit_log for select
using (auth.uid() = actor_id);

revoke all on function public.set_circle_content_owner() from public, anon, authenticated;

revoke insert (author_id, campus_id, title, body, category)
  on public.posts from authenticated;
grant insert (campus_id, title, body, category, is_anonymous)
  on public.posts to authenticated;

revoke insert (author_id, post_id, body)
  on public.comments from authenticated;
grant insert (post_id, body)
  on public.comments to authenticated;
