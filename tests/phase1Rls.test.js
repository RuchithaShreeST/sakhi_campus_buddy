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
