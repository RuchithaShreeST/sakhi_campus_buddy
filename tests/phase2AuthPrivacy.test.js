import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve('supabase/migrations/202611210005_phase2_auth_privacy.sql');
const migration = fs.readFileSync(migrationPath, 'utf8');
const coreMigrationPath = path.resolve('supabase/migrations/202611210002_phase1_core_schema.sql');
const coreMigration = fs.readFileSync(coreMigrationPath, 'utf8');
const consentHardeningPath = path.resolve('supabase/migrations/202611210008_privacy_consent_defaults.sql');
const consentHardening = fs.readFileSync(consentHardeningPath, 'utf8');
const accountDeletionPath = path.resolve('supabase/migrations/202611210011_account_deletion_cascades.sql');
const accountDeletion = fs.readFileSync(accountDeletionPath, 'utf8');

function getUserIdTables() {
  const migrationDirectory = path.resolve('supabase/migrations');
  const migrationFiles = fs.readdirSync(migrationDirectory).filter((file) => file.endsWith('.sql'));
  const userIdTables = new Set();
  for (const file of migrationFiles) {
    const sql = fs.readFileSync(path.join(migrationDirectory, file), 'utf8');
    for (const match of sql.matchAll(/create table(?: if not exists)?\s+public\.([a-z0-9_]+)\s*\(([\s\S]*?)^\);/gim)) {
      if (/^\s*user_id\s+/im.test(match[2])) userIdTables.add(match[1]);
    }
    for (const match of sql.matchAll(/alter table public\.([a-z0-9_]+)\s+add column(?: if not exists)?\s+user_id\b/gim)) {
      userIdTables.add(match[1]);
    }
  }
  return userIdTables;
}

test('Signup trigger remains owner-profile and consent aware', () => {
  assert.match(coreMigration, /create or replace function public\.handle_new_user/);
  assert.match(coreMigration, /insert into public\.profiles/);
  assert.match(coreMigration, /insert into public\.consents/);
  assert.match(coreMigration, /insert into public\.user_roles/);
});

test('Sensitive consent and discovery default to false for existing and new users', () => {
  assert.match(consentHardening, /alter column discovery_visible set default false/);
  assert.match(consentHardening, /update public\.profiles\s+set discovery_visible = false/i);
  assert.match(consentHardening, /update public\.consents\s+set discovery_visible = false/i);
  assert.match(consentHardening, /values \(new\.id, coalesce\(new\.raw_user_meta_data->>'display_name', ''\), false\)/);
  assert.match(consentHardening, /values \(new\.id, false, false, false\)/);
});

test('Campus verification rejects domains outside campus allowlist', () => {
  assert.match(migration, /signup_domain_is_allowed/);
  assert.match(migration, /Email domain is not allowed for this campus/);
  assert.match(migration, /allowed_email_domains/);
});

test('Withdrawing cycle consent deletes cycle entries', () => {
  assert.match(migration, /old\.cycle_tracking_opt_in and not new\.cycle_tracking_opt_in/);
  assert.match(migration, /delete from public\.cycle_entries where user_id = new\.user_id/);
});

test('Withdrawing AI memory consent deletes memories', () => {
  assert.match(migration, /old\.ai_memory_opt_in and not new\.ai_memory_opt_in/);
  assert.match(migration, /delete from public\.sakhi_memories where user_id = new\.user_id/);
});

test('Account deletion RPC removes private and relational user data', () => {
  assert.match(accountDeletion, /delete from auth\.users where id = current_user_id/);
  assert.match(accountDeletion, /auth\.role\(\) <> 'authenticated'/);
  assert.match(accountDeletion, /foreign key \(actor_id\) references public\.profiles\(id\) on delete set null/);
  assert.match(accountDeletion, /foreign key \(moderator_id\) references public\.profiles\(id\) on delete set null/);
});

test('Database deletion test covers every table with user-owned rows', () => {
  const deletionTest = fs.readFileSync(path.resolve('supabase/tests/account_deletion.sql'), 'utf8');
  assert.match(deletionTest, /information_schema\.columns/);
  assert.match(deletionTest, /user_id::text = \$1/);
  for (const table of getUserIdTables()) {
    assert.match(deletionTest, new RegExp(`(?:insert into|update) public\\.${table}\\b`, 'i'), `${table} needs a deletion fixture`);
  }
});

test('Delete-account Edge function requires JWT and service role secret', () => {
  const source = fs.readFileSync(path.resolve('supabase/functions/delete-account/index.ts'), 'utf8');
  assert.match(source, /requireUser/);
  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(source, /admin\.auth\.admin\.deleteUser/);
});

test('Export Edge function queries user-owned scope only', () => {
  const source = fs.readFileSync(path.resolve('supabase/functions/export-my-data/index.ts'), 'utf8');
  assert.match(source, /requireUser/);
  assert.match(source, /USER_DATA_EXPORT/);
  assert.match(source, /\.range\(offset, offset \+ pageSize - 1\)/);
});

test('Data export covers every SQL table with a user_id column', () => {
  const scope = fs.readFileSync(path.resolve('supabase/functions/_shared/user-data-export.ts'), 'utf8');
  const exportedTables = new Set([...scope.matchAll(/table:\s*"([a-z0-9_]+)"/g)].map((match) => match[1]));
  const missingTables = [...getUserIdTables()].filter((table) => !exportedTables.has(table));
  assert.deepEqual(missingTables, []);
});

test('Consent Edge function rejects unknown fields and non-booleans', () => {
  const source = fs.readFileSync(path.resolve('supabase/functions/consent/index.ts'), 'utf8');
  assert.match(source, /ai_memory_opt_in/);
  assert.match(source, /cycle_tracking_opt_in/);
  assert.match(source, /discovery_visible/);
  assert.match(source, /typeof value !== "boolean"/);
  assert.match(source, /Unknown consent field/);
});

test('Auth redirect configuration includes local and production web origins', () => {
  const config = fs.readFileSync(path.resolve('supabase/config.toml'), 'utf8');
  assert.match(config, /http:\/\/localhost:5173\/\*\*/);
  assert.match(config, /https:\/\/YOUR_PRODUCTION_DOMAIN\/\*\*/);
  assert.match(config, /\[auth\.external\.google\]/);
});
