import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationsDir = path.resolve('supabase/migrations');
const core = fs.readFileSync(path.join(migrationsDir, '202611210002_phase1_core_schema.sql'), 'utf8');
const rls = fs.readFileSync(path.join(migrationsDir, '202611210003_phase1_rls.sql'), 'utf8');
const seed = fs.readFileSync(path.join(migrationsDir, '202611210004_phase1_seed.sql'), 'utf8');
const seedEntry = fs.readFileSync(path.resolve('supabase/seed.sql'), 'utf8');
const integration = fs.readFileSync(path.resolve('supabase/tests/phase1_rls.sql'), 'utf8');
const privateAccessIntegration = fs.readFileSync(path.resolve('supabase/tests/private_data_access.sql'), 'utf8');
const clubMembershipRlsFix = fs.readFileSync(
  path.resolve('supabase/migrations/202611220002_fix_club_membership_rls_recursion.sql'),
  'utf8',
);
const moderatorPolicyFix = fs.readFileSync(
  path.resolve('supabase/migrations/202611220003_scope_moderator_policies.sql'),
  'utf8',
);

test('Phase 1 creates every requested domain table', () => {
  const tables = [
    'profiles', 'campuses', 'campus_memberships', 'user_roles', 'interests', 'consents',
    'wellness_logs', 'cycle_entries', 'sakhi_memories', 'sakhi_conversations',
    'planner_items', 'clubs', 'club_members', 'events', 'event_registrations',
    'placements', 'placement_registrations', 'announcements', 'posts', 'comments',
    'reactions', 'connections', 'direct_messages', 'reports', 'blocks',
    'notifications', 'audit_log',
  ];

  for (const table of tables) {
    assert.match(core, new RegExp(`create table if not exists public\\.${table}\\b`), `missing ${table}`);
  }
});

test('All tables use default deny RLS', () => {
  const tables = [
    'profiles', 'campuses', 'campus_memberships', 'user_roles', 'interests', 'consents',
    'wellness_logs', 'cycle_entries', 'sakhi_memories', 'sakhi_conversations',
    'planner_items', 'clubs', 'club_members', 'events', 'event_registrations',
    'placements', 'placement_registrations', 'announcements', 'posts', 'comments',
    'reactions', 'connections', 'direct_messages', 'reports', 'blocks',
    'notifications', 'audit_log',
  ];

  for (const table of tables) {
    assert.match(rls, new RegExp(`alter table public\\.${table} enable row level security`), `${table} RLS is not enabled`);
  }
});

test('Sensitive owner tables cannot expose other users or moderators', () => {
  assert.match(rls, /create policy "wellness owner all" on public\.wellness_logs[\s\S]*?auth\.uid\(\) = user_id/);
  assert.match(rls, /create policy "cycle consented owner all" on public\.cycle_entries[\s\S]*?auth\.uid\(\) = user_id/);
  assert.match(rls, /create policy "memory consented owner all" on public\.sakhi_memories[\s\S]*?auth\.uid\(\) = user_id/);
  assert.match(rls, /create policy "sakhi conversations owner all" on public\.sakhi_conversations[\s\S]*?auth\.uid\(\) = user_id/);

  for (const privateTable of ['wellness_logs', 'cycle_entries', 'sakhi_memories', 'sakhi_conversations']) {
    const policyStart = rls.indexOf(`on public.${privateTable}`);
    assert.ok(policyStart >= 0, `missing policy for ${privateTable}`);
    const policyEnd = rls.indexOf(';', policyStart);
    const policyBlock = rls.slice(policyStart, policyEnd);
    assert.doesNotMatch(policyBlock, /is_moderator/i);
  }
});

test('Cycle and memory writes require matching consent rows', () => {
  assert.match(rls, /cycle_entries[\s\S]*?c\.cycle_tracking_opt_in/);
  assert.match(rls, /sakhi_memories[\s\S]*?c\.ai_memory_opt_in/);
});

test('Direct messages are participant-only and blocked users cannot send', () => {
  assert.match(rls, /create policy "dms participants read"[\s\S]*?auth\.uid\(\) = sender_id or auth\.uid\(\) = recipient_id/);
  assert.match(rls, /create policy "dms sender insert"[\s\S]*?public\.is_blocked\(sender_id, recipient_id\)/);
});

test('Database RLS integration test exercises sensitive data, DMs, blocks, and consent', () => {
  assert.match(integration, /select plan\(29\)/);
  assert.equal((integration.match(/select has_table\('public', '[^']+', '[^']+'\);/g) ?? []).length, 8);
  for (const assertion of [
    'owner can read own wellness rows',
    'admin cannot read another user wellness rows',
    'admin cannot read another user cycle rows',
    'admin cannot read another user memory rows',
    'moderator cannot read another user wellness rows',
    'moderator cannot read another user cycle rows',
    'moderator cannot read another user memory rows',
    'DM participant cannot read messages from conversations they are not in',
    'a block prevents sending a direct message',
    'cycle entry insert fails without explicit consent',
    'memory insert fails without explicit consent',
    'withdrawing cycle consent deletes cycle rows',
    'withdrawing memory consent deletes memory rows',
  ]) {
    assert.ok(integration.includes(assertion), `missing database assertion: ${assertion}`);
  }
});

test('Database private-data test covers cross-user writes, RPCs, views, and anon access', () => {
  assert.match(privateAccessIntegration, /select plan\(36\)/);
  for (const assertion of [
    'user A cannot select user B wellness',
    'user A cannot select user B cycle entries',
    'user A cannot select user B memories',
    'authenticated club members can read the roster without recursive RLS',
    'user A update attempt on user B wellness does not error',
    'user A update attempt on user B cycle entries does not error',
    'user A update attempt on user B memories does not error',
    'user A delete attempt on user B wellness does not error',
    'user A delete attempt on user B cycle entries does not error',
    'user A delete attempt on user B memories does not error',
    'user B wellness rows remain after user A delete attempts',
    'user B cycle rows remain after user A delete attempts',
    'user B memory rows remain after user A delete attempts',
    'wellness summary RPC returns only caller rows',
    'today RPC returns only caller wellness rows',
    'no public view exposes wellness, cycle, or memory rows',
    'admin cannot read another user wellness',
    'moderator cannot read another user memories',
    'anon cannot read rows from private tables, including opted-in profiles',
    'moderator-only policies do not run for anon',
    'anon cannot execute any security-definer function',
  ]) {
    assert.ok(privateAccessIntegration.includes(assertion), `missing database assertion: ${assertion}`);
  }
});

test('Club roster RLS avoids recursive policy evaluation', () => {
  assert.match(clubMembershipRlsFix, /security definer\s+set search_path = pg_catalog, public, auth, pg_temp/i);
  assert.match(clubMembershipRlsFix, /auth\.uid\(\) is not null[\s\S]*?auth\.role\(\) = 'authenticated'/i);
  assert.match(clubMembershipRlsFix, /revoke all on function private\.is_club_member\(uuid\) from public, anon, authenticated/i);
  assert.match(clubMembershipRlsFix, /grant execute on function private\.is_club_member\(uuid\) to authenticated/i);
  assert.match(clubMembershipRlsFix, /for select\s+to authenticated\s+using/i);
});

test('Moderator-only policies are not applied to anon requests', () => {
  for (const table of ['reports', 'audit_log', 'posts', 'comments', 'clubs', 'events', 'placements', 'announcements']) {
    assert.match(moderatorPolicyFix, new RegExp(`alter policy \"[^\"]+\" on public\\.${table} to authenticated`, 'i'));
  }
});

test('Signup auto-creates a profile, consent row and student role', () => {
  assert.match(core, /create trigger on_auth_user_created/);
  assert.match(core, /insert into public\.profiles/);
  assert.match(core, /insert into public\.consents/);
  assert.match(core, /insert into public\.user_roles/);
});

test('Demo seed is labelled and uses relative dates', () => {
  assert.match(seed, /Demo/);
  assert.match(seed, /trust_label/);
  assert.match(seed, /now\(\) \+ interval '7 days'/);
  assert.match(seed, /now\(\) \+ interval '21 days'/);
  assert.doesNotMatch(seed, /Google|Microsoft|Adobe/i);
});

test('Supabase seed entry contains SQL rather than psql include commands', () => {
  assert.match(seedEntry, /seed data is applied by migration 202611210004_phase1_seed\.sql/i);
  assert.doesNotMatch(seedEntry, /^\s*\\/m);
});

test('Content trust enum contains only supported labels', () => {
  assert.match(core, /create type public\.trust_label as enum \('official', 'verified', 'community', 'ai_assisted'\)/);
});
