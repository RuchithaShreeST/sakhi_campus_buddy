-- Cross-user, anonymous, RPC, and view access tests.
-- Run against the local Supabase database with: supabase test db
begin;
select plan(36);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'private-a@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Private Test A"}'::jsonb, now(), now()
  ),
  (
    'b1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'private-b@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Private Test B"}'::jsonb, now(), now()
  ),
  (
    'c1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'private-moderator@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Private Test Moderator"}'::jsonb, now(), now()
  ),
  (
    'd1111111-1111-4111-8111-111111111111',
    'authenticated', 'authenticated', 'private-admin@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Private Test Admin"}'::jsonb, now(), now()
  );

insert into public.user_roles(user_id, role)
values
  ('c1111111-1111-4111-8111-111111111111', 'moderator'),
  ('d1111111-1111-4111-8111-111111111111', 'admin');

update public.consents
set cycle_tracking_opt_in = true, ai_memory_opt_in = true
where user_id in (
  'a1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);
update public.profiles
set discovery_visible = true
where id = 'b1111111-1111-4111-8111-111111111111';

insert into public.wellness_logs(user_id, logged_on, mood, mood_note, sleep_hours, water_ml)
values
  ('a1111111-1111-4111-8111-111111111111', current_date, 'okay', 'A own wellness', 8, 2000),
  ('b1111111-1111-4111-8111-111111111111', current_date, 'low', 'B_ONLY_SECRET', 1, 0),
  ('b1111111-1111-4111-8111-111111111111', current_date - 1, 'low', 'B_ONLY_SECRET', 1, 0),
  ('b1111111-1111-4111-8111-111111111111', current_date - 2, 'low', 'B_ONLY_SECRET', 1, 0);
insert into public.cycle_entries(user_id, start_date, notes)
values ('b1111111-1111-4111-8111-111111111111', current_date, 'B_ONLY_CYCLE_SECRET');
insert into public.sakhi_memories(user_id, label, value)
values ('b1111111-1111-4111-8111-111111111111', 'Private test', 'B_ONLY_MEMORY_SECRET');
insert into public.sakhi_conversations(user_id, role, message)
values ('b1111111-1111-4111-8111-111111111111', 'user', 'B_ONLY_CHAT_SECRET');
insert into public.planner_items(user_id, title, category)
values ('b1111111-1111-4111-8111-111111111111', 'B_ONLY_PLANNER_SECRET', 'Study');
insert into public.campus_memberships(user_id, campus_id)
values ('b1111111-1111-4111-8111-111111111111', '00000000-0000-4000-8000-000000000001');
insert into public.interests(user_id, interest_name)
values ('b1111111-1111-4111-8111-111111111111', 'Private test interest');
insert into public.club_members(club_id, user_id)
values (
  '10000000-0000-4000-8000-000000000001',
  'b1111111-1111-4111-8111-111111111111'
);
insert into public.club_members(club_id, user_id)
values (
  '10000000-0000-4000-8000-000000000001',
  'a1111111-1111-4111-8111-111111111111'
);
insert into public.event_registrations(event_id, user_id)
values (
  '20000000-0000-4000-8000-000000000001',
  'b1111111-1111-4111-8111-111111111111'
);
insert into public.placement_registrations(placement_id, user_id)
values (
  '30000000-0000-4000-8000-000000000001',
  'b1111111-1111-4111-8111-111111111111'
);
insert into public.reactions(user_id, post_id, reaction_type)
values (
  'b1111111-1111-4111-8111-111111111111',
  '50000000-0000-4000-8000-000000000001',
  'heart'
);
insert into public.connections(requester_id, recipient_id)
values (
  'a1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);
insert into public.direct_messages(sender_id, recipient_id, text)
values (
  'a1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111',
  'Private test message'
);
insert into public.reports(reporter_id, target_type, target_id, reason)
values (
  'a1111111-1111-4111-8111-111111111111',
  'profile',
  'b1111111-1111-4111-8111-111111111111',
  'Private test report'
);
insert into public.blocks(blocker_id, blocked_id)
values (
  'a1111111-1111-4111-8111-111111111111',
  'b1111111-1111-4111-8111-111111111111'
);
insert into public.notifications(user_id, category, title)
values ('b1111111-1111-4111-8111-111111111111', 'test', 'Private test notification');
insert into public.audit_log(actor_id, action)
values ('b1111111-1111-4111-8111-111111111111', 'private_test');
insert into public.push_subscriptions(user_id, endpoint, p256dh, auth)
values ('b1111111-1111-4111-8111-111111111111', 'https://private.example.test', 'key', 'auth');
insert into public.sakhi_ai_rate_limits(user_id, request_count)
values ('b1111111-1111-4111-8111-111111111111', 1);
insert into public.dsa_progress(user_id, topic)
values ('b1111111-1111-4111-8111-111111111111', 'Private test DSA');
insert into public.aptitude_progress(user_id, section)
values ('b1111111-1111-4111-8111-111111111111', 'Private test aptitude');
insert into public.resume_data(user_id, resume_json)
values ('b1111111-1111-4111-8111-111111111111', '{"private":"B_ONLY_RESUME_SECRET"}'::jsonb);
insert into public.mock_interviews(user_id, role)
values ('b1111111-1111-4111-8111-111111111111', 'Private test role');

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  (select count(*)::integer from public.wellness_logs where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'user A cannot select user B wellness'
);
select is(
  (select count(*)::integer from public.cycle_entries where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'user A cannot select user B cycle entries'
);
select is(
  (select count(*)::integer from public.sakhi_memories where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'user A cannot select user B memories'
);
select is(
  (select count(*)::integer from public.club_members where user_id = 'b1111111-1111-4111-8111-111111111111'),
  1,
  'authenticated club members can read the roster without recursive RLS'
);

select lives_ok(
  $$update public.wellness_logs set mood = 'ATTACKED'
    where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A update attempt on user B wellness does not error'
);
select lives_ok(
  $$update public.cycle_entries set notes = 'ATTACKED'
    where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A update attempt on user B cycle entries does not error'
);
select lives_ok(
  $$update public.sakhi_memories set value = 'ATTACKED'
    where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A update attempt on user B memories does not error'
);

reset role;
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.wellness_logs where user_id = auth.uid() and mood = 'low'),
  3,
  'user B wellness values remain unchanged after user A update attempts'
);
select is(
  (select count(*)::integer from public.cycle_entries where user_id = auth.uid() and notes = 'B_ONLY_CYCLE_SECRET'),
  1,
  'user B cycle values remain unchanged after user A update attempts'
);
select is(
  (select count(*)::integer from public.sakhi_memories where user_id = auth.uid() and value = 'B_ONLY_MEMORY_SECRET'),
  1,
  'user B memory values remain unchanged after user A update attempts'
);
reset role;

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;
select lives_ok(
  $$delete from public.wellness_logs where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A delete attempt on user B wellness does not error'
);
select lives_ok(
  $$delete from public.cycle_entries where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A delete attempt on user B cycle entries does not error'
);
select lives_ok(
  $$delete from public.sakhi_memories where user_id = 'b1111111-1111-4111-8111-111111111111'$$,
  'user A delete attempt on user B memories does not error'
);
reset role;
select set_config('request.jwt.claim.sub', 'b1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"b1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.wellness_logs where user_id = auth.uid() and mood = 'low'),
  3,
  'user B wellness rows remain after user A delete attempts'
);
select is(
  (select count(*)::integer from public.cycle_entries where user_id = auth.uid() and notes = 'B_ONLY_CYCLE_SECRET'),
  1,
  'user B cycle rows remain after user A delete attempts'
);
select is(
  (select count(*)::integer from public.sakhi_memories where user_id = auth.uid() and value = 'B_ONLY_MEMORY_SECRET'),
  1,
  'user B memory rows remain after user A delete attempts'
);
reset role;

select set_config('request.jwt.claim.sub', 'a1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"a1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;

select is(
  jsonb_array_length(public.get_wellness_summary(7)->'trend'),
  1,
  'wellness summary RPC returns only caller rows'
);
select is(
  jsonb_array_length(public.get_sakhi_today()->'wellness'->'trend'),
  1,
  'today RPC returns only caller wellness rows'
);
select is(
  public.detect_burnout(7)->>'signal',
  'false',
  'burnout RPC does not include another user wellness rows'
);
select ok(
  not exists (
    select 1
    from pg_views
    where schemaname = 'public'
      and (
        definition ilike '%wellness_logs%'
        or definition ilike '%cycle_entries%'
        or definition ilike '%sakhi_memories%'
      )
  ),
  'no public view exposes wellness, cycle, or memory rows'
);
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and has_function_privilege('authenticated', p.oid, 'execute')
      and p.prosrc ~* '(wellness_logs|cycle_entries|sakhi_memories)'
      and p.prosrc !~* 'auth[.]uid[(][)]'
  ),
  'API-executable SQL functions touching private data scope by auth.uid'
);
reset role;

select set_config('request.jwt.claim.sub', 'd1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"d1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.wellness_logs where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'admin cannot read another user wellness'
);
select is(
  (select count(*)::integer from public.cycle_entries where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'admin cannot read another user cycle entries'
);
select is(
  (select count(*)::integer from public.sakhi_memories where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'admin cannot read another user memories'
);
reset role;

select set_config('request.jwt.claim.sub', 'c1111111-1111-4111-8111-111111111111', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"c1111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.wellness_logs where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'moderator cannot read another user wellness'
);
select is(
  (select count(*)::integer from public.cycle_entries where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'moderator cannot read another user cycle entries'
);
select is(
  (select count(*)::integer from public.sakhi_memories where user_id = 'b1111111-1111-4111-8111-111111111111'),
  0,
  'moderator cannot read another user memories'
);
reset role;

select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claim.role', 'anon', true);
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
select ok(
  not exists (
    select 1 from public.profiles
    union all select 1 from public.campus_memberships
    union all select 1 from public.user_roles
    union all select 1 from public.interests
    union all select 1 from public.consents
    union all select 1 from public.wellness_logs
    union all select 1 from public.cycle_entries
    union all select 1 from public.sakhi_memories
    union all select 1 from public.sakhi_conversations
    union all select 1 from public.planner_items
    union all select 1 from public.club_members
    union all select 1 from public.event_registrations
    union all select 1 from public.placement_registrations
    union all select 1 from public.reactions
    union all select 1 from public.connections
    union all select 1 from public.direct_messages
    union all select 1 from public.reports
    union all select 1 from public.blocks
    union all select 1 from public.notifications
    union all select 1 from public.audit_log
    union all select 1 from public.push_subscriptions
    union all select 1 from public.sakhi_ai_rate_limits
    union all select 1 from public.dsa_progress
    union all select 1 from public.aptitude_progress
    union all select 1 from public.resume_data
    union all select 1 from public.mock_interviews
  ),
  'anon cannot read rows from private tables, including opted-in profiles'
);
select ok(
  not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ilike '%is_moderator%'
        or coalesce(with_check, '') ilike '%is_moderator%'
      )
      and 'public' = any(roles)
  ),
  'moderator-only policies do not run for anon'
);
select lives_ok(
  $$select
      (select count(*) from public.posts),
      (select count(*) from public.comments),
      (select count(*) from public.clubs),
      (select count(*) from public.events),
      (select count(*) from public.placements),
      (select count(*) from public.announcements)$$,
  'anon can still query public campus content'
);
select ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prokind = 'f'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'execute')
  ),
  'anon cannot execute any security-definer function'
);
select throws_ok(
  $$select public.get_wellness_summary(7)$$,
  '42501',
  'permission denied for function get_wellness_summary',
  'anon cannot execute wellness summary RPC'
);
select throws_ok(
  $$select public.detect_burnout(7)$$,
  '42501',
  'permission denied for function detect_burnout',
  'anon cannot execute burnout RPC'
);
select throws_ok(
  $$select public.get_sakhi_today()$$,
  '42501',
  'permission denied for function get_sakhi_today',
  'anon cannot execute today RPC'
);
select throws_ok(
  $$select public.consume_sakhi_ai_rate_limit()$$,
  '42501',
  'permission denied for function consume_sakhi_ai_rate_limit',
  'anon cannot execute the AI rate-limit RPC'
);
select throws_ok(
  $$select public.delete_current_user()$$,
  '42501',
  'permission denied for function delete_current_user',
  'anon cannot execute account deletion RPC'
);
reset role;

select * from finish();
rollback;
