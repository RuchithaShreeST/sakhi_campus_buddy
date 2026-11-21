create or replace function public.has_role(required_role public.app_role)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.user_roles
    where user_id = auth.uid()
      and role = required_role
  );
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select auth.uid() is not null
    and (public.has_role('moderator') or public.has_role('admin'));
$$;

create or replace function public.is_blocked(sender uuid, recipient uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.uid() not in (sender, recipient) then
    raise exception 'Caller must be a message participant';
  end if;

  return exists (
    select 1
    from public.blocks
    where deleted_at is null
      and (
        (blocker_id = sender and blocked_id = recipient)
        or (blocker_id = recipient and blocked_id = sender)
      )
  );
end;
$$;

create or replace function public.signup_domain_is_allowed(campus_id uuid, email text)
returns boolean
language sql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
  select campus_id is null
    or exists (
      select 1
      from public.campuses c
      cross join lateral unnest(c.allowed_email_domains) domain
      where c.id = signup_domain_is_allowed.campus_id
        and lower(email) like '%@' || lower(domain)
    );
$$;

create or replace function public.verify_campus_email(campus_id uuid)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  requester_email text;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select email into requester_email
  from auth.users
  where id = auth.uid()
    and email_confirmed_at is not null;

  if requester_email is null then
    raise exception 'A confirmed email address is required';
  end if;

  if not public.signup_domain_is_allowed(campus_id, requester_email) then
    raise exception 'Email domain is not allowed for this campus';
  end if;

  update public.profiles
  set campus_id = verify_campus_email.campus_id,
      campus_email_verified = true,
      campus_verification_method = 'allowed_email_domain',
      verification_requested_at = now()
  where id = auth.uid();

  if not found then
    raise exception 'Profile not found';
  end if;

  insert into public.campus_memberships(user_id, campus_id, role, verified_at)
  values (auth.uid(), verify_campus_email.campus_id, 'student', now())
  on conflict (user_id, campus_id)
  do update set verified_at = now(), deleted_at = null, role = 'student';

  return true;
end;
$$;

create or replace function public.handle_consent_withdrawal()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
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

create or replace function public.sync_profile_discovery()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null
     or auth.role() <> 'authenticated'
     or auth.uid() <> new.user_id then
    raise exception 'Only the consent owner may change discoverability';
  end if;

  update public.profiles
  set discovery_visible = new.discovery_visible
  where id = new.user_id;

  return new;
end;
$$;

drop trigger if exists consents_sync_discovery on public.consents;
create trigger consents_sync_discovery
after update of discovery_visible on public.consents
for each row
when (old.discovery_visible is distinct from new.discovery_visible)
execute function public.sync_profile_discovery();

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

create or replace function public.join_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.clubs
    where id = p_club_id
      and deleted_at is null
      and moderation_status = 'active'
  ) then
    raise exception 'Club not found';
  end if;

  insert into public.club_members(club_id, user_id)
  values (p_club_id, auth.uid())
  on conflict (club_id, user_id)
  do update set deleted_at = null, joined_at = now(), role = 'member';

  insert into public.audit_log(actor_id, action, target_type, target_id)
  values (auth.uid(), 'club.join', 'club', p_club_id);
end;
$$;

create or replace function public.detect_burnout(p_days integer default 7)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  days_count integer := greatest(3, least(coalesce(p_days, 7), 30));
  avg_sleep numeric;
  low_mood_count integer;
  trend_count integer;
  signal boolean;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select coalesce(avg(sleep_hours), 0),
         count(*) filter (where mood in ('low', 'stressed', 'tired')),
         count(*)
  into avg_sleep, low_mood_count, trend_count
  from public.wellness_logs
  where user_id = auth.uid()
    and logged_on >= current_date - days_count + 1
    and deleted_at is null;

  signal := trend_count >= 3
    and (avg_sleep < 6.5 or low_mood_count >= greatest(2, trend_count / 2));

  return jsonb_build_object(
    'signal', signal,
    'suggestion', case when signal
      then 'Consider a smaller study workload today, one real break, and an earlier wind-down.'
      else 'No strong burnout signal was found in the available recent check-ins.'
    end,
    'medical_disclaimer', 'Sakhi is not a medical assessment. Seek a qualified professional or trusted person if you feel unsafe or overwhelmed.'
  );
end;
$$;

create or replace function public.create_daily_nudges()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  created_count integer := 0;
  profile_row record;
begin
  if auth.uid() is not null or session_user <> 'postgres' then
    raise exception 'Scheduled database execution required';
  end if;

  for profile_row in
    select id from public.profiles where deleted_at is null
  loop
    insert into public.notifications(user_id, category, title, body)
    select profile_row.id, 'wellness', 'A gentle pause', 'A glass of water or a short break can be enough.'
    where not exists (
      select 1 from public.notifications n
      where n.user_id = profile_row.id
        and n.category = 'wellness'
        and n.created_at >= current_date
        and n.deleted_at is null
    );

    created_count := created_count + 1;
  end loop;

  return created_count;
end;
$$;

create or replace function public.leave_club(p_club_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  update public.club_members
  set deleted_at = now()
  where club_id = p_club_id
    and user_id = auth.uid()
    and deleted_at is null;

  if found then
    insert into public.audit_log(actor_id, action, target_type, target_id)
    values (auth.uid(), 'club.leave', 'club', p_club_id);
  end if;
end;
$$;

create or replace function public.register_event(p_event_id uuid)
returns text
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  event_capacity integer;
  active_count integer;
  result text;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select capacity into event_capacity
  from public.events
  where id = p_event_id
    and deleted_at is null
    and moderation_status = 'active'
  for update;

  if not found then
    raise exception 'Event not found';
  end if;

  select count(*) into active_count
  from public.event_registrations
  where event_id = p_event_id
    and status = 'registered'
    and deleted_at is null;

  if event_capacity is not null and active_count >= event_capacity then
    result := 'waitlisted';
  else
    result := 'registered';
  end if;

  insert into public.event_registrations(event_id, user_id, status)
  values (p_event_id, auth.uid(), result)
  on conflict (event_id, user_id)
  do update set status = excluded.status, deleted_at = null, registered_at = now();

  insert into public.audit_log(actor_id, action, target_type, target_id)
  values (auth.uid(), 'event.register', 'event', p_event_id);

  return result;
end;
$$;

create or replace function public.register_placement(p_placement_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if not exists (
    select 1 from public.placements
    where id = p_placement_id
      and deleted_at is null
      and moderation_status = 'active'
  ) then
    raise exception 'Placement not found';
  end if;

  insert into public.placement_registrations(placement_id, user_id)
  values (p_placement_id, auth.uid())
  on conflict (placement_id, user_id)
  do update set deleted_at = null, registered_at = now();

  insert into public.audit_log(actor_id, action, target_type, target_id)
  values (auth.uid(), 'placement.register', 'placement', p_placement_id);
end;
$$;

create or replace function public.request_connection(p_recipient uuid, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if auth.uid() = p_recipient then
    raise exception 'Cannot connect to yourself';
  end if;

  if length(coalesce(p_reason, '')) > 500 then
    raise exception 'Connection reason is too long';
  end if;

  if public.is_blocked(auth.uid(), p_recipient) then
    raise exception 'Connection is blocked';
  end if;

  if not exists (
    select 1 from public.profiles
    where id = p_recipient
      and discovery_visible
      and deleted_at is null
  ) then
    raise exception 'Profile is not discoverable';
  end if;

  insert into public.connections(requester_id, recipient_id, match_reason)
  values (auth.uid(), p_recipient, p_reason)
  on conflict (requester_id, recipient_id)
  do update set status = 'pending', match_reason = excluded.match_reason, deleted_at = null;
end;
$$;

create or replace function public.block_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if auth.uid() = p_user_id then
    raise exception 'Cannot block yourself';
  end if;

  insert into public.blocks(blocker_id, blocked_id)
  values (auth.uid(), p_user_id)
  on conflict (blocker_id, blocked_id)
  do update set deleted_at = null;

  update public.connections
  set status = 'blocked', deleted_at = now()
  where (requester_id = auth.uid() and recipient_id = p_user_id)
     or (recipient_id = auth.uid() and requester_id = p_user_id);

  insert into public.audit_log(actor_id, action, target_type, target_id)
  values (auth.uid(), 'user.block', 'user', p_user_id);
end;
$$;

create or replace function public.report_content(
  p_target_type text,
  p_target_id uuid,
  p_reason text,
  p_details text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  report_id uuid;
  recent_count integer;
  target_exists boolean := false;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  if p_target_id is null
     or length(btrim(coalesce(p_reason, ''))) < 3
     or length(p_reason) > 200
     or length(coalesce(p_details, '')) > 2000 then
    raise exception 'Invalid report details';
  end if;

  case p_target_type
    when 'post' then
      select exists(select 1 from public.posts where id = p_target_id and deleted_at is null) into target_exists;
    when 'comment' then
      select exists(select 1 from public.comments where id = p_target_id and deleted_at is null) into target_exists;
    when 'profile' then
      select exists(select 1 from public.profiles where id = p_target_id and deleted_at is null) into target_exists;
    when 'event' then
      select exists(select 1 from public.events where id = p_target_id and deleted_at is null) into target_exists;
    when 'club' then
      select exists(select 1 from public.clubs where id = p_target_id and deleted_at is null) into target_exists;
    when 'placement' then
      select exists(select 1 from public.placements where id = p_target_id and deleted_at is null) into target_exists;
    when 'announcement' then
      select exists(select 1 from public.announcements where id = p_target_id and deleted_at is null) into target_exists;
    else
      raise exception 'Unsupported report target';
  end case;

  if not target_exists then
    raise exception 'Report target not found';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text, 0));

  select count(*) into recent_count
  from public.reports
  where reporter_id = auth.uid()
    and created_at >= now() - interval '10 minutes';

  if recent_count >= 5 then
    raise exception 'Reporting is temporarily throttled';
  end if;

  insert into public.reports(reporter_id, target_type, target_id, reason, details, status)
  values (auth.uid(), p_target_type, p_target_id, btrim(p_reason), nullif(btrim(p_details), ''), 'reported')
  returning id into report_id;

  insert into public.audit_log(actor_id, action, target_type, target_id)
  values (auth.uid(), 'content.report', p_target_type, p_target_id);

  return report_id;
end;
$$;

create or replace function public.get_wellness_summary(p_days integer default 7)
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  days_count integer := greatest(1, least(coalesce(p_days, 7), 30));
  sleep_avg numeric;
  water_avg numeric;
  mood_count integer;
  breakdown jsonb;
  trend jsonb;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select coalesce(avg(sleep_hours), 0),
         coalesce(avg(water_ml), 0),
         count(*) filter (where mood is not null)
  into sleep_avg, water_avg, mood_count
  from public.wellness_logs
  where user_id = auth.uid()
    and logged_on >= current_date - days_count + 1
    and deleted_at is null;

  breakdown := jsonb_build_object(
    'sleep', round(greatest(0, least(24, coalesce(sleep_avg / 8 * 24, 0)))::numeric, 1),
    'hydration', round(greatest(0, least(14, coalesce(water_avg / 2000 * 14, 0)))::numeric, 1),
    'mood', round(greatest(0, least(16, case when mood_count > 0 then 12 else 0 end))::numeric, 1),
    'activity', 0,
    'rest', 0,
    'social_joy', 0
  );

  trend := (
    select coalesce(
      jsonb_agg(
        jsonb_build_object(
          'logged_on', logged_on,
          'sleep_hours', sleep_hours,
          'water_ml', water_ml,
          'mood', mood
        ) order by logged_on
      ),
      '[]'::jsonb
    )
    from public.wellness_logs
    where user_id = auth.uid()
      and logged_on >= current_date - days_count + 1
      and deleted_at is null
  );

  return jsonb_build_object(
    'days', days_count,
    'breakdown', breakdown,
    'trend', trend,
    'medical_disclaimer', 'Sakhi wellness insights are supportive and are not medical advice.'
  );
end;
$$;

create or replace function public.get_sakhi_today()
returns jsonb
language plpgsql
stable
security invoker
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  next_item jsonb;
  top_announcement jsonb;
  streak integer := 0;
  wellness jsonb;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  select jsonb_build_object('id', id, 'title', title, 'date_key', date_key, 'start_time', start_time)
  into next_item
  from public.planner_items
  where user_id = auth.uid()
    and completed = false
    and deleted_at is null
    and (date_key is null or date_key >= current_date)
  order by date_key asc nulls last, start_time asc nulls last
  limit 1;

  select jsonb_build_object('id', id, 'title', title, 'trust_label', trust_label)
  into top_announcement
  from public.announcements
  where deleted_at is null and moderation_status = 'active'
  order by created_at desc
  limit 1;

  with ordered_dates as (
    select logged_on, row_number() over (order by logged_on desc) as rn
    from (
      select distinct logged_on
      from public.wellness_logs
      where user_id = auth.uid() and deleted_at is null
    ) d
  )
  select count(*)::integer into streak
  from ordered_dates
  where logged_on = current_date - (rn - 1);

  wellness := public.get_wellness_summary(7);

  return jsonb_build_object(
    'next_item', next_item,
    'wellness_nudge', 'A short pause for water or rest can help.',
    'growth_nudge', 'Choose one small study or placement task.',
    'top_announcement', top_announcement,
    'streak', greatest(streak, 0),
    'wellness', wellness
  );
end;
$$;

create or replace function public.consume_sakhi_ai_rate_limit()
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, auth, pg_temp
as $$
declare
  v_request_count integer;
begin
  if auth.uid() is null or auth.role() <> 'authenticated' then
    raise exception 'Authentication required';
  end if;

  insert into public.sakhi_ai_rate_limits as limits(user_id, window_start, request_count)
  values (auth.uid(), now(), 1)
  on conflict (user_id) do update
  set window_start = case
        when limits.window_start <= now() - interval '1 minute' then excluded.window_start
        else limits.window_start
      end,
      request_count = case
        when limits.window_start <= now() - interval '1 minute' then 1
        else limits.request_count + 1
      end
  returning request_count into v_request_count;

  return v_request_count <= 20;
end;
$$;

drop policy if exists "posts public read" on public.posts;
create policy "posts public read" on public.posts for select
using (deleted_at is null and moderation_status = 'active');
create policy "posts moderators reported read" on public.posts for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'post'
      and r.target_id = posts.id
      and r.status in ('reported', 'under_review')
  )
);

drop policy if exists "comments public read" on public.comments;
create policy "comments public read" on public.comments for select
using (deleted_at is null and moderation_status = 'active');
create policy "comments moderators reported read" on public.comments for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'comment'
      and r.target_id = comments.id
      and r.status in ('reported', 'under_review')
  )
);

drop policy if exists "clubs public read" on public.clubs;
create policy "clubs public read" on public.clubs for select
using (deleted_at is null and moderation_status = 'active');
create policy "clubs moderators reported read" on public.clubs for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'club'
      and r.target_id = clubs.id
      and r.status in ('reported', 'under_review')
  )
);

drop policy if exists "events public read" on public.events;
create policy "events public read" on public.events for select
using (deleted_at is null and moderation_status = 'active');
create policy "events moderators reported read" on public.events for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'event'
      and r.target_id = events.id
      and r.status in ('reported', 'under_review')
  )
);

drop policy if exists "placements public read" on public.placements;
create policy "placements public read" on public.placements for select
using (deleted_at is null and moderation_status = 'active');
create policy "placements moderators reported read" on public.placements for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'placement'
      and r.target_id = placements.id
      and r.status in ('reported', 'under_review')
  )
);

drop policy if exists "announcements public read" on public.announcements;
create policy "announcements public read" on public.announcements for select
using (deleted_at is null and moderation_status = 'active');
create policy "announcements moderators reported read" on public.announcements for select
using (
  deleted_at is null
  and moderation_status in ('reported', 'under_review')
  and public.is_moderator()
  and exists (
    select 1 from public.reports r
    where r.target_type = 'announcement'
      and r.target_id = announcements.id
      and r.status in ('reported', 'under_review')
  )
);

revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(public.app_role) from public, anon, authenticated;
revoke all on function public.is_moderator() from public, anon, authenticated;
revoke all on function public.is_blocked(uuid, uuid) from public, anon, authenticated;
revoke all on function public.signup_domain_is_allowed(uuid, text) from public, anon, authenticated;
revoke all on function public.verify_campus_email(uuid) from public, anon, authenticated;
revoke all on function public.handle_consent_withdrawal() from public, anon, authenticated;
revoke all on function public.sync_profile_discovery() from public, anon, authenticated;
revoke all on function public.delete_current_user() from public, anon, authenticated;
revoke all on function public.join_club(uuid) from public, anon, authenticated;
revoke all on function public.detect_burnout(integer) from public, anon, authenticated;
revoke all on function public.create_daily_nudges() from public, anon, authenticated;
revoke all on function public.leave_club(uuid) from public, anon, authenticated;
revoke all on function public.register_event(uuid) from public, anon, authenticated;
revoke all on function public.register_placement(uuid) from public, anon, authenticated;
revoke all on function public.request_connection(uuid, text) from public, anon, authenticated;
revoke all on function public.block_user(uuid) from public, anon, authenticated;
revoke all on function public.report_content(text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.get_wellness_summary(integer) from public, anon, authenticated;
revoke all on function public.get_sakhi_today() from public, anon, authenticated;
revoke all on function public.consume_sakhi_ai_rate_limit() from public, anon, authenticated;

grant execute on function public.has_role(public.app_role) to authenticated;
grant execute on function public.is_moderator() to authenticated;
grant execute on function public.is_blocked(uuid, uuid) to authenticated;
grant execute on function public.signup_domain_is_allowed(uuid, text) to authenticated;
grant execute on function public.verify_campus_email(uuid) to authenticated;
grant execute on function public.delete_current_user() to authenticated;
grant execute on function public.join_club(uuid) to authenticated;
grant execute on function public.detect_burnout(integer) to authenticated;
grant execute on function public.create_daily_nudges() to postgres;
grant execute on function public.leave_club(uuid) to authenticated;
grant execute on function public.register_event(uuid) to authenticated;
grant execute on function public.register_placement(uuid) to authenticated;
grant execute on function public.request_connection(uuid, text) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.report_content(text, uuid, text, text) to authenticated;
grant execute on function public.get_wellness_summary(integer) to authenticated;
grant execute on function public.get_sakhi_today() to authenticated;
grant execute on function public.consume_sakhi_ai_rate_limit() to authenticated;

revoke update on public.profiles from public, anon, authenticated;
grant update (
  display_name, pronouns, bio, avatar_url, campus_name, course, year, city,
  interests, looking_for
) on public.profiles to authenticated;
revoke update on public.consents from public, anon, authenticated;
revoke insert, delete on public.consents from public, anon, authenticated;
grant update (ai_memory_opt_in, cycle_tracking_opt_in, discovery_visible)
  on public.consents to authenticated;

revoke insert, update, delete on public.campus_memberships from public, anon, authenticated;
revoke insert, update, delete on public.club_members from public, anon, authenticated;
revoke insert, update, delete on public.event_registrations from public, anon, authenticated;
revoke insert, update, delete on public.placement_registrations from public, anon, authenticated;

revoke insert, update, delete on public.connections from public, anon, authenticated;
revoke update on public.direct_messages from public, anon, authenticated;
grant update (read_at) on public.direct_messages to authenticated;

revoke insert, update, delete on public.reports from public, anon, authenticated;
grant update (status, moderator_id, deleted_at) on public.reports to authenticated;

revoke insert, update, delete on public.sakhi_ai_rate_limits from public, anon, authenticated;
grant select on public.sakhi_ai_rate_limits to authenticated;
drop policy if exists "owner ai rate limit" on public.sakhi_ai_rate_limits;
create policy "owner ai rate limit read" on public.sakhi_ai_rate_limits for select
using (auth.uid() = user_id);

revoke insert, update, delete on public.posts from public, anon, authenticated;
grant insert (author_id, campus_id, title, body, category) on public.posts to authenticated;
grant update (title, body, category) on public.posts to authenticated;
revoke insert, update, delete on public.comments from public, anon, authenticated;
grant insert (author_id, post_id, body) on public.comments to authenticated;
grant update (body) on public.comments to authenticated;
