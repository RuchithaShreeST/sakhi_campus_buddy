-- Demo-only seed data. All relative dates are generated from the current database time.
insert into public.campuses(id, name, city, state, allowed_email_domains)
values (
  '00000000-0000-4000-8000-000000000001',
  'Sakhi Demo Campus',
  'Demo City',
  'Demo State',
  array['demo.edu']
)
on conflict (id) do update set
  name = excluded.name,
  city = excluded.city,
  state = excluded.state,
  allowed_email_domains = excluded.allowed_email_domains;

insert into public.clubs(id, campus_id, name, category, description, meeting_time, location, trust_label)
values (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Demo Learning Circle',
  'Study',
  'A clearly labelled demo club for testing campus discovery.',
  'Weekly',
  'Demo Student Centre',
  'community'
) on conflict (id) do nothing;

insert into public.events(id, campus_id, title, starts_at, venue, organizer, category, description, capacity, trust_label)
values (
  '20000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Demo Campus Open House',
  now() + interval '7 days',
  'Demo Auditorium',
  'Demo Campus Office',
  'Campus',
  'Labelled demo event used only for product testing.',
  100,
  'verified'
) on conflict (id) do nothing;

insert into public.placements(id, campus_id, company, role, type, ctc, eligibility, deadline, description, trust_label)
values (
  '30000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Demo Hiring Partner',
  'Demo Product Intern',
  'Internship',
  'Demo package',
  'Demo eligibility criteria',
  now() + interval '21 days',
  'Synthetic sample placement listing; not a real opportunity.',
  'verified'
) on conflict (id) do nothing;

insert into public.announcements(id, campus_id, title, body, author_name, trust_label)
values (
  '40000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Demo Campus Notice',
  'This is synthetic demo content generated for testing and is not an official campus notice.',
  'Demo Campus',
  'community'
) on conflict (id) do nothing;

insert into public.posts(id, campus_id, title, body, category, trust_label)
values (
  '50000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'Welcome to the demo campus circle',
  'Synthetic demo post for testing feed and moderation flows.',
  'Campus',
  'community'
) on conflict (id) do nothing;
