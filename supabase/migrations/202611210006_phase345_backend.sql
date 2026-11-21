alter table public.direct_messages
  add column if not exists delivered_at timestamptz,
  add column if not exists read_at timestamptz;

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, endpoint)
);

alter table public.push_subscriptions enable row level security;
create policy "push subscriptions owner all" on public.push_subscriptions for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.sakhi_ai_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_start timestamptz not null default now(),
  request_count integer not null default 0
);

create table if not exists public.dsa_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  topic text not null,
  completed_count integer not null default 0,
  target_count integer not null default 0,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, topic)
);

create table if not exists public.aptitude_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  section text not null,
  score integer,
  attempts integer not null default 0,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique(user_id, section)
);

create table if not exists public.resume_data (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  resume_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.mock_interviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null,
  questions jsonb not null default '[]'::jsonb,
  responses jsonb not null default '[]'::jsonb,
  score integer,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.sakhi_ai_rate_limits enable row level security;
alter table public.dsa_progress enable row level security;
alter table public.aptitude_progress enable row level security;
alter table public.resume_data enable row level security;
alter table public.mock_interviews enable row level security;

create policy "owner ai rate limit" on public.sakhi_ai_rate_limits for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner dsa progress" on public.dsa_progress for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner aptitude progress" on public.aptitude_progress for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner resume data" on public.resume_data for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "owner mock interviews" on public.mock_interviews for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.join_club(p_club_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.club_members(club_id, user_id)
  values(p_club_id, auth.uid())
  on conflict(club_id,user_id) do update set deleted_at=null, joined_at=now();
  insert into public.audit_log(actor_id, action, target_type, target_id)
  values(auth.uid(), 'club.join', 'club', p_club_id);
end; $$;

create or replace function public.detect_burnout(p_days integer default 7)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare
  days_count integer := greatest(3,least(coalesce(p_days,7),30));
  avg_sleep numeric;
  low_mood_count integer;
  trend_count integer;
  signal boolean;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select coalesce(avg(sleep_hours),0),count(*) filter(where mood in ('low','stressed','tired')),count(*)
  into avg_sleep,low_mood_count,trend_count
  from public.wellness_logs
  where user_id=auth.uid()
    and logged_on>=current_date-days_count+1
    and deleted_at is null;
  signal := trend_count>=3 and (avg_sleep<6.5 or low_mood_count>=greatest(2,trend_count/2));
  return jsonb_build_object(
    'signal',signal,
    'suggestion',case when signal
      then 'Consider a smaller study workload today, one real break, and an earlier wind-down.'
      else 'No strong burnout signal was found in the available recent check-ins.'
    end,
    'medical_disclaimer','Sakhi is not a medical assessment. Seek a qualified professional or trusted person if you feel unsafe or overwhelmed.'
  );
end; $$;

create or replace function public.create_daily_nudges()
returns integer language plpgsql security definer set search_path=public as $$
declare
  created_count integer := 0;
  profile_row record;
begin
  for profile_row in
    select id, display_name from public.profiles where deleted_at is null
  loop
    insert into public.notifications(user_id,category,title,body)
    select profile_row.id,'wellness','A gentle pause','A glass of water or a short break can be enough.'
    where not exists (
      select 1 from public.notifications n
      where n.user_id=profile_row.id
        and n.category='wellness'
        and n.created_at>=current_date
        and n.deleted_at is null
    );
    created_count:=created_count+1;
  end loop;
  return created_count;
end; $$;

create or replace function public.leave_club(p_club_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.club_members set deleted_at=now()
  where club_id=p_club_id and user_id=auth.uid();
  insert into public.audit_log(actor_id, action, target_type, target_id)
  values(auth.uid(), 'club.leave', 'club', p_club_id);
end; $$;

create or replace function public.register_event(p_event_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare
  event_capacity integer;
  active_count integer;
  result text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select capacity into event_capacity from public.events where id=p_event_id and deleted_at is null;
  if not found then raise exception 'Event not found'; end if;
  select count(*) into active_count from public.event_registrations
  where event_id=p_event_id and status='registered' and deleted_at is null;
  if event_capacity is not null and active_count >= event_capacity then
    result='waitlisted';
  else result='registered'; end if;
  insert into public.event_registrations(event_id,user_id,status)
  values(p_event_id,auth.uid(),result)
  on conflict(event_id,user_id) do update set status=result, deleted_at=null, registered_at=now();
  insert into public.audit_log(actor_id,action,target_type,target_id)
  values(auth.uid(),'event.register', 'event',p_event_id);
  return result;
end; $$;

create or replace function public.register_placement(p_placement_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  insert into public.placement_registrations(placement_id,user_id)
  values(p_placement_id,auth.uid())
  on conflict(placement_id,user_id) do update set deleted_at=null,registered_at=now();
  insert into public.audit_log(actor_id,action,target_type,target_id)
  values(auth.uid(),'placement.register','placement',p_placement_id);
end; $$;

create or replace function public.request_connection(p_recipient uuid, p_reason text default null)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if auth.uid()=p_recipient then raise exception 'Cannot connect to yourself'; end if;
  if public.is_blocked(auth.uid(),p_recipient) then raise exception 'Connection is blocked'; end if;
  insert into public.connections(requester_id,recipient_id,match_reason)
  values(auth.uid(),p_recipient,p_reason)
  on conflict(requester_id,recipient_id) do update set status='pending',match_reason=excluded.match_reason,deleted_at=null;
end; $$;

create or replace function public.block_user(p_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if auth.uid()=p_user_id then raise exception 'Cannot block yourself'; end if;
  insert into public.blocks(blocker_id,blocked_id) values(auth.uid(),p_user_id)
  on conflict(blocker_id,blocked_id) do update set deleted_at=null;
  update public.connections set status='blocked',deleted_at=now()
  where (requester_id=auth.uid() and recipient_id=p_user_id)
     or (recipient_id=auth.uid() and requester_id=p_user_id);
  insert into public.audit_log(actor_id,action,target_type,target_id)
  values(auth.uid(),'user.block','user',p_user_id);
end; $$;

create or replace function public.report_content(p_target_type text,p_target_id uuid,p_reason text,p_details text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare
  report_id uuid;
  recent_count integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(coalesce(p_reason,''))<3 then raise exception 'Invalid report reason'; end if;
  select count(*) into recent_count
  from public.reports
  where reporter_id=auth.uid() and created_at >= now()-interval '10 minutes';
  if recent_count >= 5 then raise exception 'Reporting is temporarily throttled'; end if;
  insert into public.reports(reporter_id,target_type,target_id,reason,details,status)
  values(auth.uid(),p_target_type,p_target_id,p_reason,p_details,'reported')
  returning id into report_id;
  insert into public.audit_log(actor_id,action,target_type,target_id)
  values(auth.uid(),'content.report',p_target_type,p_target_id);
  return report_id;
end; $$;

do $$
begin
  begin
    alter publication supabase_realtime add table public.direct_messages;
  exception when duplicate_object then null; end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null; end;
end $$;

create or replace function public.get_wellness_summary(p_days integer default 7)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare
  days_count integer := greatest(1, least(coalesce(p_days,7),30));
  sleep_avg numeric;
  water_avg numeric;
  mood_count integer;
  breakdown jsonb;
  trend jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select coalesce(avg(sleep_hours),0),coalesce(avg(water_ml),0),count(*) filter(where mood is not null)
  into sleep_avg,water_avg,mood_count
  from public.wellness_logs
  where user_id=auth.uid() and logged_on>=current_date-days_count+1 and deleted_at is null;
  breakdown=jsonb_build_object(
    'sleep', round(greatest(0,least(24,coalesce(sleep_avg/8*24,0)))::numeric,1),
    'hydration', round(greatest(0,least(14,coalesce(water_avg/2000*14,0)))::numeric,1),
    'mood', round(greatest(0,least(16,case when mood_count>0 then 12 else 0 end))::numeric,1),
    'activity', 0,
    'rest', 0,
    'social_joy', 0
  );
  trend=(select coalesce(jsonb_agg(jsonb_build_object('logged_on',logged_on,'sleep_hours',sleep_hours,'water_ml',water_ml,'mood',mood) order by logged_on),'[]'::jsonb)
         from public.wellness_logs
         where user_id=auth.uid() and logged_on>=current_date-days_count+1 and deleted_at is null);
  return jsonb_build_object('days',days_count,'breakdown',breakdown,'trend',trend,'medical_disclaimer','Sakhi wellness insights are supportive and are not medical advice.');
end; $$;

create or replace function public.get_sakhi_today()
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare
  next_item jsonb;
  top_announcement jsonb;
  streak integer := 0;
  wellness jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select jsonb_build_object('id',id,'title',title,'date_key',date_key,'start_time',start_time)
  into next_item from public.planner_items
  where user_id=auth.uid() and completed=false and deleted_at is null
    and (date_key is null or date_key>=current_date)
  order by date_key asc nulls last,start_time asc nulls last limit 1;
  select jsonb_build_object('id',id,'title',title,'trust_label',trust_label)
  into top_announcement from public.announcements
  where deleted_at is null and moderation_status='active'
  order by created_at desc limit 1;
  with ordered_dates as (
    select logged_on,
           row_number() over (order by logged_on desc) as rn
    from (select distinct logged_on
          from public.wellness_logs
          where user_id=auth.uid() and deleted_at is null) d
  )
  select count(*)::integer into streak
  from ordered_dates
  where logged_on = current_date - (rn - 1);
  wellness := public.get_wellness_summary(7);
  return jsonb_build_object(
    'next_item',next_item,
    'wellness_nudge','A short pause for water or rest can help.',
    'growth_nudge','Choose one small study or placement task.',
    'top_announcement',top_announcement,
    'streak',greatest(streak,0),
    'wellness',wellness
  );
end; $$;
