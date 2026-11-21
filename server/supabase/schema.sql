-- SAKHI PRODUCTION DATABASE SCHEMA & ROW LEVEL SECURITY (RLS) POLICIES
-- Apply in Supabase SQL Editor or via Supabase CLI migrations.

-- 1. USERS & PROFILES
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  bio text,
  campus_name text default 'State University',
  year text default '2nd Year',
  avatar_url text,
  verified boolean default false,
  discovery_visible boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. CAMPUSES & MEMBERS
create table if not exists campuses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  city text,
  state text,
  created_at timestamptz default now()
);

create table if not exists campus_members (
  user_id uuid references profiles(id) on delete cascade,
  campus_id uuid references campuses(id) on delete cascade,
  role text default 'student', -- 'student', 'club_admin', 'campus_admin', 'moderator'
  verified_at timestamptz,
  primary key (user_id, campus_id)
);

-- 3. INTERESTS & USER MEMORIES
create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  interest_name text not null
);

create table if not exists sakhi_memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  label text not null,
  value text not null,
  created_at timestamptz default now()
);

-- 4. WELLNESS & CYCLE LOGS
create table if not exists wellness_daily (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  date_key text not null, -- 'YYYY-MM-DD'
  mood_score int default 7,
  stress_score int default 3,
  sleep_hours numeric default 7.5,
  water_ml int default 1500,
  exercise_mins int default 20,
  study_mins int default 90,
  unique (user_id, date_key)
);

create table if not exists cycle_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  start_date text not null,
  flow text,
  cramps_severity int default 0,
  bloating boolean default false,
  headache boolean default false,
  fatigue boolean default false,
  notes text,
  created_at timestamptz default now()
);

create table if not exists activity_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  activity_type text not null,
  duration_mins int not null,
  completed_at timestamptz default now()
);

-- 5. CLUBS & EVENTS
create table if not exists clubs (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campuses(id),
  name text not null,
  category text not null,
  description text,
  meeting_time text,
  lead_name text,
  trust_label text default 'COMMUNITY', -- 'OFFICIAL', 'VERIFIED', 'COMMUNITY'
  created_at timestamptz default now()
);

create table if not exists club_members (
  club_id uuid references clubs(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (club_id, user_id)
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campuses(id),
  title text not null,
  starts_at timestamptz not null,
  venue text not null,
  organizer text not null,
  category text not null,
  description text,
  trust_label text default 'COMMUNITY',
  created_at timestamptz default now()
);

create table if not exists event_registrations (
  event_id uuid references events(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  primary key (event_id, user_id)
);

-- 6. PLACEMENTS & ANNOUNCEMENTS
create table if not exists official_announcements (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campuses(id),
  title text not null,
  body text not null,
  author text default 'Campus Admin',
  created_at timestamptz default now()
);

create table if not exists placements (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid references campuses(id),
  company text not null,
  role text not null,
  ctc text,
  eligibility text,
  deadline text,
  status text default 'open',
  official boolean default true,
  created_at timestamptz default now()
);

create table if not exists placement_registrations (
  placement_id uuid references placements(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  registered_at timestamptz default now(),
  primary key (placement_id, user_id)
);

-- 7. SOCIAL CIRCLE, POSTS & MESSAGING
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references profiles(id) on delete cascade,
  category text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  author_id uuid references profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz default now()
);

create table if not exists connections (
  requester_id uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  match_reason text,
  status text default 'pending', -- 'pending', 'accepted', 'blocked'
  created_at timestamptz default now(),
  primary key (requester_id, recipient_id)
);

create table if not exists direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references profiles(id) on delete cascade,
  recipient_id uuid references profiles(id) on delete cascade,
  text text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 8. SAFETY & MODERATION
create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete cascade,
  target_type text not null, -- 'user', 'post', 'comment', 'message'
  target_id text not null,
  reason text not null,
  details text,
  status text default 'open', -- 'open', 'in_review', 'actioned', 'dismissed'
  created_at timestamptz default now()
);

create table if not exists blocks (
  blocker_id uuid references profiles(id) on delete cascade,
  blocked_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (blocker_id, blocked_id)
);

-- ROW LEVEL SECURITY (RLS) POLICIES
alter table profiles enable row level security;
alter table sakhi_memories enable row level security;
alter table wellness_daily enable row level security;
alter table cycle_entries enable row level security;
alter table posts enable row level security;
alter table post_comments enable row level security;
alter table connections enable row level security;
alter table direct_messages enable row level security;
alter table reports enable row level security;
alter table blocks enable row level security;

-- Public Profiles (Safe viewing)
create policy "Public profiles select" on profiles for select using (true);
create policy "Users manage own profile" on profiles for update using (auth.uid() = id);

-- Private Wellness & Memories (Owner only)
create policy "Owner wellness select" on wellness_daily for select using (auth.uid() = user_id);
create policy "Owner wellness write" on wellness_daily for all using (auth.uid() = user_id);
create policy "Owner cycle select" on cycle_entries for select using (auth.uid() = user_id);
create policy "Owner cycle write" on cycle_entries for all using (auth.uid() = user_id);
create policy "Owner memories write" on sakhi_memories for all using (auth.uid() = user_id);

-- Community Feed (Public select, owner write)
create policy "Posts public select" on posts for select using (true);
create policy "Posts owner insert" on posts for insert with check (auth.uid() = author_id);
create policy "Posts owner update" on posts for update using (auth.uid() = author_id);

-- Direct Messaging (Participants only)
create policy "DMs participant select" on direct_messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "DMs sender insert" on direct_messages for insert
  with check (auth.uid() = sender_id);

-- Safety & Moderation
create policy "Reports creator insert" on reports for insert with check (auth.uid() = reporter_id);
create policy "Blocks owner manage" on blocks for all using (auth.uid() = blocker_id);

