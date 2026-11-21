begin;
select plan(3);

insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values (
  'a1111111-1111-4111-8111-111111111111',
  'authenticated', 'authenticated', 'signup-trigger@example.test',
  'not-a-real-password', now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"display_name":"Integration Student"}'::jsonb, now(), now()
);

select is(
  (select display_name from public.profiles where id = 'a1111111-1111-4111-8111-111111111111'),
  'Integration Student',
  'auth signup creates the owner profile'
);
select is(
  (select count(*)::integer from public.consents where user_id = 'a1111111-1111-4111-8111-111111111111'),
  1,
  'auth signup creates a consent row'
);
select is(
  (select role::text from public.user_roles where user_id = 'a1111111-1111-4111-8111-111111111111'),
  'student',
  'auth signup assigns the student role'
);

select * from finish();
rollback;
