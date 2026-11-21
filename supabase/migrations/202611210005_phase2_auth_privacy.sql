alter table public.profiles
  add column if not exists campus_id uuid references public.campuses(id),
  add column if not exists campus_email_verified boolean not null default false,
  add column if not exists campus_verification_method text,
  add column if not exists verification_requested_at timestamptz;

create or replace function public.signup_domain_is_allowed(campus_id uuid, email text)
returns boolean language sql stable security definer set search_path = public as $$
  select
    campus_id is null
    or exists (
      select 1
      from public.campuses c
      cross join lateral unnest(c.allowed_email_domains) domain
      where c.id = signup_domain_is_allowed.campus_id
        and lower(email) like '%@' || lower(domain)
    );
$$;

create or replace function public.verify_campus_email(campus_id uuid)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  requester_email text;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  select email into requester_email
  from auth.users
  where id = auth.uid();

  if not public.signup_domain_is_allowed(campus_id, requester_email) then
    raise exception 'Email domain is not allowed for this campus';
  end if;

  update public.profiles
  set campus_id = verify_campus_email.campus_id,
      campus_email_verified = true,
      campus_verification_method = 'allowed_email_domain',
      verification_requested_at = now()
  where id = auth.uid();

  insert into public.campus_memberships(user_id, campus_id, role, verified_at)
  values (auth.uid(), verify_campus_email.campus_id, 'student', now())
  on conflict(user_id, campus_id)
  do update set verified_at = now(), deleted_at = null;

  return true;
end;
$$;

revoke all on function public.verify_campus_email(uuid) from public;
grant execute on function public.verify_campus_email(uuid) to authenticated;

create or replace function public.handle_consent_withdrawal()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.cycle_tracking_opt_in and not new.cycle_tracking_opt_in then
    delete from public.cycle_entries where user_id = new.user_id;
  end if;

  if old.ai_memory_opt_in and not new.ai_memory_opt_in then
    delete from public.sakhi_memories where user_id = new.user_id;
  end if;

  if not new.cycle_tracking_opt_in then
    new.cycle_tracking_consent_at = null;
  elsif old.cycle_tracking_opt_in is distinct from new.cycle_tracking_opt_in then
    new.cycle_tracking_consent_at = now();
  end if;

  if not new.ai_memory_opt_in then
    new.ai_memory_consent_at = null;
  elsif old.ai_memory_opt_in is distinct from new.ai_memory_opt_in then
    new.ai_memory_consent_at = now();
  end if;

  return new;
end;
$$;

drop trigger if exists consents_withdrawal on public.consents;
create trigger consents_withdrawal
before update on public.consents
for each row execute function public.handle_consent_withdrawal();

create or replace function public.delete_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  delete from public.sakhi_conversations where user_id = current_user_id;
  delete from public.sakhi_memories where user_id = current_user_id;
  delete from public.cycle_entries where user_id = current_user_id;
  delete from public.wellness_logs where user_id = current_user_id;
  delete from public.planner_items where user_id = current_user_id;
  delete from public.notifications where user_id = current_user_id;
  delete from public.interests where user_id = current_user_id;
  delete from public.consents where user_id = current_user_id;
  delete from public.campus_memberships where user_id = current_user_id;
  delete from public.user_roles where user_id = current_user_id;
  delete from public.blocks where blocker_id = current_user_id or blocked_id = current_user_id;
  delete from public.connections where requester_id = current_user_id or recipient_id = current_user_id;
  delete from public.direct_messages where sender_id = current_user_id or recipient_id = current_user_id;
  delete from public.reactions where user_id = current_user_id;
  delete from public.reports where reporter_id = current_user_id;
  delete from public.event_registrations where user_id = current_user_id;
  delete from public.placement_registrations where user_id = current_user_id;
  delete from public.club_members where user_id = current_user_id;
  delete from public.comments where author_id = current_user_id;
  delete from public.posts where author_id = current_user_id;
  delete from public.profiles where id = current_user_id;
  delete from auth.users where id = current_user_id;
end;
$$;

revoke all on function public.delete_current_user() from public;
grant execute on function public.delete_current_user() to authenticated;
