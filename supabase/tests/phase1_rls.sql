-- RLS integration tests. Run against a local Supabase database:
-- supabase test db
begin;
select plan(29);

select has_table('public', 'wellness_logs', 'wellness_logs table exists in public');
select has_table('public', 'cycle_entries', 'cycle_entries table exists in public');
select has_table('public', 'sakhi_memories', 'sakhi_memories table exists in public');
select has_table('public', 'direct_messages', 'direct_messages table exists in public');
select has_table('public', 'reports', 'reports table exists in public');
select has_table('public', 'blocks', 'blocks table exists in public');
select has_table('public', 'audit_log', 'audit_log table exists in public');
select has_table('public', 'sakhi_conversations', 'sakhi_conversations table exists in public');

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'rls-owner@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Owner"}'::jsonb, now(), now()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated', 'authenticated', 'rls-admin@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Admin"}'::jsonb, now(), now()
  ),
  (
    'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    'authenticated', 'authenticated', 'rls-moderator@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Moderator"}'::jsonb, now(), now()
  ),
  (
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'authenticated', 'authenticated', 'rls-peer@example.test',
    'not-a-real-password', now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"RLS Peer"}'::jsonb, now(), now()
  );

insert into public.user_roles(user_id, role)
values
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'admin'),
  ('cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'moderator');

update public.consents
set ai_memory_opt_in = true, cycle_tracking_opt_in = true
where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

insert into public.wellness_logs(user_id, logged_on, mood)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date, 'okay');
insert into public.cycle_entries(user_id, start_date)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date);
insert into public.sakhi_memories(user_id, label, value)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Private test', 'Owner-only value');

insert into public.direct_messages(id, sender_id, recipient_id, text)
values
  (
    '10000000-0000-4000-8000-000000000001',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'Owner to admin'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'Admin to owner'
  ),
  (
    '10000000-0000-4000-8000-000000000003',
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'Admin to peer'
  );

insert into public.blocks(blocker_id, blocked_id)
values (
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);
set local role authenticated;
select is((select count(*)::integer from public.wellness_logs), 1, 'owner can read own wellness rows');
select is((select count(*)::integer from public.cycle_entries), 1, 'owner with consent can read own cycle rows');
select is((select count(*)::integer from public.sakhi_memories), 1, 'owner with consent can read own memory rows');
reset role;

select set_config('request.jwt.claim.sub', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb","role":"authenticated"}',
  true
);
set local role authenticated;
select is((select count(*)::integer from public.wellness_logs), 0, 'admin cannot read another user wellness rows');
select is((select count(*)::integer from public.cycle_entries), 0, 'admin cannot read another user cycle rows');
select is((select count(*)::integer from public.sakhi_memories), 0, 'admin cannot read another user memory rows');
select is(
  (select count(*)::integer from public.direct_messages),
  3,
  'DM participant can read only messages where they are a participant'
);
reset role;

select set_config('request.jwt.claim.sub', 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"cccccccc-cccc-4ccc-8ccc-cccccccccccc","role":"authenticated"}',
  true
);
set local role authenticated;
select is((select count(*)::integer from public.wellness_logs), 0, 'moderator cannot read another user wellness rows');
select is((select count(*)::integer from public.cycle_entries), 0, 'moderator cannot read another user cycle rows');
select is((select count(*)::integer from public.sakhi_memories), 0, 'moderator cannot read another user memory rows');
select is((select count(*)::integer from public.direct_messages), 0, 'non-participant cannot read direct messages');
reset role;

select set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}',
  true
);
set local role authenticated;
select is(
  (select count(*)::integer from public.direct_messages),
  1,
  'DM participant cannot read messages from conversations they are not in'
);
reset role;

select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);
set local role authenticated;
select throws_ok(
  $$insert into public.direct_messages(sender_id, recipient_id, text)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Blocked send')$$,
  '42501',
  'new row violates row-level security policy for table "direct_messages"',
  'a block prevents sending a direct message'
);
select lives_ok(
  $$insert into public.cycle_entries(user_id, start_date)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date + 1)$$,
  'cycle entry insert succeeds while cycle consent is enabled'
);
select lives_ok(
  $$insert into public.sakhi_memories(user_id, label, value)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Consented', 'Allowed value')$$,
  'memory insert succeeds while AI memory consent is enabled'
);
update public.consents
set cycle_tracking_opt_in = false, ai_memory_opt_in = false
where user_id = auth.uid();
select is((select count(*)::integer from public.cycle_entries), 0, 'withdrawing cycle consent deletes cycle rows');
select is((select count(*)::integer from public.sakhi_memories), 0, 'withdrawing memory consent deletes memory rows');
select throws_ok(
  $$insert into public.cycle_entries(user_id, start_date)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', current_date + 2)$$,
  '42501',
  'new row violates row-level security policy for table "cycle_entries"',
  'cycle entry insert fails after cycle consent is withdrawn'
);
select throws_ok(
  $$insert into public.sakhi_memories(user_id, label, value)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'Unconsented', 'Denied value')$$,
  '42501',
  'new row violates row-level security policy for table "sakhi_memories"',
  'memory insert fails after AI memory consent is withdrawn'
);
reset role;

select set_config('request.jwt.claim.sub', 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"dddddddd-dddd-4ddd-8ddd-dddddddddddd","role":"authenticated"}',
  true
);
set local role authenticated;
select throws_ok(
  $$insert into public.cycle_entries(user_id, start_date)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', current_date)$$,
  '42501',
  'new row violates row-level security policy for table "cycle_entries"',
  'cycle entry insert fails without explicit consent'
);
select throws_ok(
  $$insert into public.sakhi_memories(user_id, label, value)
    values ('dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'Unconsented', 'Denied value')$$,
  '42501',
  'new row violates row-level security policy for table "sakhi_memories"',
  'memory insert fails without explicit consent'
);
reset role;

select * from finish();
rollback;
