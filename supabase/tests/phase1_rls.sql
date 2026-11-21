-- Optional pgTAP SQL integration suite.
-- Run against a local/CI Supabase database after migrations:
-- supabase test db
begin;
select plan(8);

select has_table('public', 'wellness_logs');
select has_table('public', 'cycle_entries');
select has_table('public', 'sakhi_memories');
select has_table('public', 'direct_messages');
select has_table('public', 'reports');
select has_table('public', 'blocks');
select has_table('public', 'audit_log');
select has_table('public', 'sakhi_conversations');

rollback;
