create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('student', 'club_lead', 'campus_admin', 'placement_cell', 'community_lead', 'moderator', 'admin');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.trust_label as enum ('official', 'verified', 'community', 'ai_assisted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.moderation_status as enum ('active', 'reported', 'under_review', 'actioned', 'dismissed', 'deleted');
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  pronouns text,
  bio text,
  avatar_url text,
  campus_name text,
  course text,
  year text,
  city text,
  interests text[] not null default '{}',
  looking_for text[] not null default '{}',
  discovery_visible boolean not null default true,
  verified boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

create table if not exists public.campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  state text,
  allowed_email_domains text[] not null default '{}',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger campuses_updated_at before update on public.campuses
for each row execute function public.set_updated_at();

create table if not exists public.campus_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  campus_id uuid not null references public.campuses(id) on delete cascade,
  role public.app_role not null default 'student',
  verified_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, campus_id)
);
create trigger campus_memberships_updated_at before update on public.campus_memberships
for each row execute function public.set_updated_at();

create table if not exists public.user_roles (
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_at timestamptz not null default now(),
  granted_by uuid references public.profiles(id),
  primary key(user_id, role)
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_name text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, interest_name)
);

create table if not exists public.consents (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  ai_memory_opt_in boolean not null default false,
  cycle_tracking_opt_in boolean not null default false,
  discovery_visible boolean not null default true,
  ai_memory_consent_at timestamptz,
  cycle_tracking_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger consents_updated_at before update on public.consents
for each row execute function public.set_updated_at();

create table if not exists public.wellness_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  logged_on date not null,
  mood text,
  mood_note text,
  sleep_hours numeric(4,2),
  water_ml integer,
  steps integer,
  exercise_minutes integer,
  activity_minutes integer,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, logged_on)
);
create trigger wellness_logs_updated_at before update on public.wellness_logs
for each row execute function public.set_updated_at();

create table if not exists public.cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  start_date date not null,
  end_date date,
  flow text,
  symptoms text[] not null default '{}',
  cramps_severity integer check (cramps_severity between 0 and 10),
  bloating boolean default false,
  headache boolean default false,
  fatigue boolean default false,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger cycle_entries_updated_at before update on public.cycle_entries
for each row execute function public.set_updated_at();

create table if not exists public.sakhi_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null,
  value text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger sakhi_memories_updated_at before update on public.sakhi_memories
for each row execute function public.set_updated_at();

create table if not exists public.sakhi_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  summary text,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.planner_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null,
  date_key date,
  start_time time,
  duration_minutes integer,
  completed boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger planner_items_updated_at before update on public.planner_items
for each row execute function public.set_updated_at();

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references public.campuses(id) on delete cascade,
  name text not null,
  category text not null,
  description text,
  meeting_time text,
  location text,
  lead_name text,
  trust_label public.trust_label not null default 'community',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  deleted_at timestamptz,
  joined_at timestamptz not null default now(),
  primary key(club_id, user_id)
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references public.campuses(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  venue text,
  organizer text,
  category text,
  description text,
  capacity integer,
  trust_label public.trust_label not null default 'community',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'registered' check (status in ('registered', 'waitlisted', 'cancelled')),
  registered_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key(event_id, user_id)
);

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references public.campuses(id) on delete cascade,
  company text not null,
  role text not null,
  type text,
  ctc text,
  eligibility text,
  deadline timestamptz,
  description text,
  trust_label public.trust_label not null default 'verified',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.placement_registrations (
  placement_id uuid not null references public.placements(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  registered_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key(placement_id, user_id)
);

create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references public.campuses(id) on delete cascade,
  title text not null,
  body text not null,
  author_name text,
  trust_label public.trust_label not null default 'official',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  campus_id uuid references public.campuses(id) on delete set null,
  title text not null,
  body text not null,
  category text not null,
  trust_label public.trust_label not null default 'community',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid references public.profiles(id) on delete set null,
  body text not null,
  trust_label public.trust_label not null default 'community',
  moderation_status public.moderation_status not null default 'active',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('upvote', 'heart', 'helpful')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check ((post_id is not null) <> (comment_id is not null))
);
create unique index if not exists reactions_unique_post
  on public.reactions(user_id, post_id, reaction_type)
  where post_id is not null and deleted_at is null;
create unique index if not exists reactions_unique_comment
  on public.reactions(user_id, comment_id, reaction_type)
  where comment_id is not null and deleted_at is null;

create table if not exists public.connections (
  requester_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  match_reason text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked', 'dismissed')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(requester_id, recipient_id),
  check(requester_id <> recipient_id)
);

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  text text not null,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  check(sender_id <> recipient_id)
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null,
  target_id uuid,
  reason text not null,
  details text,
  status public.moderation_status not null default 'reported',
  moderator_id uuid references public.profiles(id),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  primary key(blocker_id, blocked_id),
  check(blocker_id <> blocked_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text,
  read_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', ''));
  insert into public.consents(user_id) values (new.id) on conflict do nothing;
  insert into public.user_roles(user_id, role) values (new.id, 'student') on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'clubs','events','placements','announcements','posts','comments',
    'connections','reports'
  ]
  loop
    execute format(
      'drop trigger if exists %I_updated_at on public.%I',
      table_name,
      table_name
    );
    execute format(
      'create trigger %I_updated_at before update on public.%I
       for each row execute function public.set_updated_at()',
      table_name,
      table_name
    );
  end loop;
end;
$$;
