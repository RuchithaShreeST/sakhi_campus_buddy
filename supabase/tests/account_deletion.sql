begin;

select plan(3);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated',
    'authenticated',
    'deletion-owner@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Deletion Test Owner"}'::jsonb,
    now(),
    now()
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    'authenticated',
    'authenticated',
    'deletion-peer@example.test',
    'not-a-real-password',
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Deletion Test Peer"}'::jsonb,
    now(),
    now()
  );

insert into public.campuses(id, name) values
  ('11111111-1111-4111-8111-111111111111', 'Deletion Test Campus');
insert into public.clubs(id, campus_id, name, category) values
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'Deletion Test Club', 'Demo');
insert into public.events(id, campus_id, title, starts_at) values
  ('33333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111', 'Deletion Test Event', now() + interval '1 day');
insert into public.placements(id, campus_id, company, role) values
  ('44444444-4444-4444-8444-444444444444', '11111111-1111-4111-8111-111111111111', 'Demo Company', 'Demo Role');

select set_config('sakhi.test_user_id', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa","role":"authenticated"}',
  true
);

update public.consents
set ai_memory_opt_in = true, cycle_tracking_opt_in = true
where user_id = auth.uid();

insert into public.campus_memberships(user_id, campus_id)
values (auth.uid(), '11111111-1111-4111-8111-111111111111');
insert into public.user_roles(user_id, role, granted_by)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'moderator', auth.uid());
insert into public.interests(user_id, interest_name)
values (auth.uid(), 'Deletion fixture');
insert into public.wellness_logs(user_id, logged_on, mood)
values (auth.uid(), current_date, 'okay');
insert into public.cycle_entries(user_id, start_date)
values (auth.uid(), current_date);
insert into public.sakhi_memories(user_id, label, value)
values (auth.uid(), 'Deletion fixture', 'Private test value');
insert into public.sakhi_conversations(user_id, role, message)
values (auth.uid(), 'user', 'Private deletion test message');
insert into public.planner_items(user_id, title, category)
values (auth.uid(), 'Deletion fixture', 'Study');
insert into public.club_members(club_id, user_id)
values ('22222222-2222-4222-8222-222222222222', auth.uid());
insert into public.event_registrations(event_id, user_id)
values ('33333333-3333-4333-8333-333333333333', auth.uid());
insert into public.placement_registrations(placement_id, user_id)
values ('44444444-4444-4444-8444-444444444444', auth.uid());
insert into public.posts(id, campus_id, title, body, category, is_anonymous)
values
  ('55555555-5555-4555-8555-555555555555', '11111111-1111-4111-8111-111111111111', 'Owned post', 'Owned content', 'Demo', false),
  ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', 'Anonymous post', 'Anonymous owned content', 'Demo', true);
insert into public.comments(post_id, body)
values ('55555555-5555-4555-8555-555555555555', 'Owned comment');
insert into public.reactions(user_id, post_id, reaction_type)
values (auth.uid(), '55555555-5555-4555-8555-555555555555', 'heart');
insert into public.connections(requester_id, recipient_id)
values
  (auth.uid(), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', auth.uid());
insert into public.direct_messages(sender_id, recipient_id, text)
values
  (auth.uid(), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Owner message'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', auth.uid(), 'Peer message');
insert into public.reports(reporter_id, target_type, target_id, reason, moderator_id)
values
  (auth.uid(), 'profile', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Deletion fixture report', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'profile', auth.uid(), 'Peer fixture report', auth.uid());
insert into public.blocks(blocker_id, blocked_id)
values
  (auth.uid(), 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', auth.uid());
insert into public.notifications(user_id, category, title)
values (auth.uid(), 'test', 'Deletion fixture');
insert into public.audit_log(actor_id, action)
values (auth.uid(), 'deletion_test.owner');
insert into public.push_subscriptions(user_id, endpoint, p256dh, auth)
values (auth.uid(), 'https://example.test/push', 'test-p256dh', 'test-auth');
insert into public.sakhi_ai_rate_limits(user_id, request_count)
values (auth.uid(), 1);
insert into public.dsa_progress(user_id, topic)
values (auth.uid(), 'Deletion fixture');
insert into public.aptitude_progress(user_id, section)
values (auth.uid(), 'Deletion fixture');
insert into public.resume_data(user_id)
values (auth.uid());
insert into public.mock_interviews(user_id, role)
values (auth.uid(), 'Deletion fixture');

set local role authenticated;
select lives_ok(
  'select public.delete_current_user()',
  'an authenticated user can delete only their own account'
);
reset role;

select lives_ok(
  $test$
  do $body$
  declare
    owned_table record;
    remaining_rows bigint;
  begin
    for owned_table in
      select table_name
      from information_schema.columns
      where table_schema = 'public'
        and column_name = 'user_id'
    loop
      execute format(
        'select count(*) from public.%I where user_id::text = $1',
        owned_table.table_name
      )
      into remaining_rows
      using current_setting('sakhi.test_user_id');

      if remaining_rows > 0 then
        raise exception 'User-owned rows remain in public.%', owned_table.table_name;
      end if;
    end loop;
  end
  $body$;
  $test$,
  'account deletion clears rows from every public table with a user_id column'
);

select ok(
  not exists (
    select 1 from public.profiles
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from auth.users
    where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.connections
    where requester_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       or recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.direct_messages
    where sender_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       or recipient_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.blocks
    where blocker_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       or blocked_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.reports
    where reporter_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
       or moderator_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.audit_log
    where actor_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  )
  and not exists (
    select 1 from public.user_roles
    where granted_by = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ),
  'account deletion clears linked data and anonymizes retained audit references'
);

rollback;
