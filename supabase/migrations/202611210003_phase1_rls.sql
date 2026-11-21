create or replace function public.has_role(required_role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = required_role
  );
$$;

create or replace function public.is_moderator()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role('moderator') or public.has_role('admin');
$$;

create or replace function public.is_blocked(sender uuid, recipient uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.blocks
    where deleted_at is null
      and ((blocker_id = sender and blocked_id = recipient)
        or (blocker_id = recipient and blocked_id = sender))
  );
$$;

alter table public.profiles enable row level security;
alter table public.campuses enable row level security;
alter table public.campus_memberships enable row level security;
alter table public.user_roles enable row level security;
alter table public.interests enable row level security;
alter table public.consents enable row level security;
alter table public.wellness_logs enable row level security;
alter table public.cycle_entries enable row level security;
alter table public.sakhi_memories enable row level security;
alter table public.sakhi_conversations enable row level security;
alter table public.planner_items enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.events enable row level security;
alter table public.event_registrations enable row level security;
alter table public.placements enable row level security;
alter table public.placement_registrations enable row level security;
alter table public.announcements enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.connections enable row level security;
alter table public.direct_messages enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

create policy "profiles own and discoverable" on public.profiles for select
using (auth.uid() = id or (discovery_visible and deleted_at is null));
create policy "profiles owner update" on public.profiles for update
using (auth.uid() = id) with check (auth.uid() = id);

create policy "campuses public read" on public.campuses for select
using (deleted_at is null);

create policy "memberships own read" on public.campus_memberships for select
using (auth.uid() = user_id);
create policy "memberships owner insert" on public.campus_memberships for insert
with check (auth.uid() = user_id);
create policy "memberships owner update" on public.campus_memberships for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "roles own read" on public.user_roles for select
using (auth.uid() = user_id);

create policy "interests owner all" on public.interests for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "consents owner all" on public.consents for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "wellness owner all" on public.wellness_logs for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "cycle consented owner all" on public.cycle_entries for all
using (
  auth.uid() = user_id
  and exists (select 1 from public.consents c where c.user_id = auth.uid() and c.cycle_tracking_opt_in)
) with check (
  auth.uid() = user_id
  and exists (select 1 from public.consents c where c.user_id = auth.uid() and c.cycle_tracking_opt_in)
);

create policy "memory consented owner all" on public.sakhi_memories for all
using (
  auth.uid() = user_id
  and exists (select 1 from public.consents c where c.user_id = auth.uid() and c.ai_memory_opt_in)
) with check (
  auth.uid() = user_id
  and exists (select 1 from public.consents c where c.user_id = auth.uid() and c.ai_memory_opt_in)
);

create policy "sakhi conversations owner all" on public.sakhi_conversations for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "planner owner all" on public.planner_items for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "clubs public read" on public.clubs for select
using (deleted_at is null and moderation_status <> 'deleted');
create policy "club memberships read" on public.club_members for select
using (auth.uid() = user_id or exists (
  select 1 from public.club_members cm
  where cm.club_id = club_members.club_id and cm.user_id = auth.uid() and cm.deleted_at is null
));
create policy "club memberships owner insert" on public.club_members for insert
with check (auth.uid() = user_id);
create policy "club memberships owner update" on public.club_members for update
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "events public read" on public.events for select
using (deleted_at is null and moderation_status <> 'deleted');
create policy "event registrations owner all" on public.event_registrations for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "placements public read" on public.placements for select
using (deleted_at is null and moderation_status <> 'deleted');
create policy "placement registrations owner all" on public.placement_registrations for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "announcements public read" on public.announcements for select
using (deleted_at is null and moderation_status <> 'deleted');

create policy "posts public read" on public.posts for select
using (deleted_at is null and moderation_status <> 'deleted');
create policy "posts owner insert" on public.posts for insert
with check (auth.uid() = author_id);
create policy "posts owner update" on public.posts for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "comments public read" on public.comments for select
using (deleted_at is null and moderation_status <> 'deleted');
create policy "comments owner insert" on public.comments for insert
with check (auth.uid() = author_id);
create policy "comments owner update" on public.comments for update
using (auth.uid() = author_id) with check (auth.uid() = author_id);

create policy "reactions owner all" on public.reactions for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "connections participant read" on public.connections for select
using (auth.uid() = requester_id or auth.uid() = recipient_id);
create policy "connections requester insert" on public.connections for insert
with check (auth.uid() = requester_id);
create policy "connections participant update" on public.connections for update
using (auth.uid() = requester_id or auth.uid() = recipient_id)
with check (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "dms participants read" on public.direct_messages for select
using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "dms sender insert" on public.direct_messages for insert
with check (
  auth.uid() = sender_id
  and not public.is_blocked(sender_id, recipient_id)
);
create policy "dms recipient read state" on public.direct_messages for update
using (auth.uid() = recipient_id)
with check (auth.uid() = recipient_id);

create policy "reports creator read" on public.reports for select
using (auth.uid() = reporter_id or public.is_moderator());
create policy "reports creator insert" on public.reports for insert
with check (auth.uid() = reporter_id);
create policy "reports moderator update" on public.reports for update
using (public.is_moderator()) with check (public.is_moderator());

create policy "blocks owner all" on public.blocks for all
using (auth.uid() = blocker_id) with check (auth.uid() = blocker_id);

create policy "notifications owner all" on public.notifications for all
using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "audit moderator read" on public.audit_log for select
using (public.is_moderator());
