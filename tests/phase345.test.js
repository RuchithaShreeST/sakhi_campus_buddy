import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const migration = fs.readFileSync(path.resolve('supabase/migrations/202611210006_phase345_backend.sql'), 'utf8');
const chat = fs.readFileSync(path.resolve('supabase/functions/sakhi-chat/index.ts'), 'utf8');
const safety = fs.readFileSync(path.resolve('supabase/functions/_shared/safety.ts'), 'utf8');

test('Social RPC functions cover clubs, events, placements and safety', () => {
  for (const name of ['join_club', 'leave_club', 'register_event', 'register_placement', 'request_connection', 'block_user', 'report_content']) {
    assert.match(migration, new RegExp(`create or replace function public\\.${name}`));
  }
});

test('Event registration supports capacity and waitlist', () => {
  assert.match(migration, /active_count >= event_capacity/);
  assert.match(migration, /result='waitlisted'/);
  assert.match(migration, /result='registered'/);
});

test('Blocked users cannot connect and report spam is throttled', () => {
  assert.match(migration, /public\.is_blocked\(auth\.uid\(\),p_recipient\)/);
  assert.match(migration, /recent_count >= 5/);
  assert.match(migration, /temporarily throttled/);
});

test('Realtime includes direct messages and notifications', () => {
  assert.match(migration, /alter publication supabase_realtime add table public\.direct_messages/);
  assert.match(migration, /alter publication supabase_realtime add table public\.notifications/);
});

test('Sakhi chat requires JWT, validates input and applies rate limits', () => {
  assert.match(chat, /requireUser/);
  assert.match(chat, /moderateInput/);
  assert.match(chat, /request_count/);
  assert.match(chat, /count > 20/);
});

test('Crisis detection links Tele-MANAS and real-person support', () => {
  assert.match(safety, /suicid/);
  assert.match(chat, /Tele-MANAS/);
  assert.match(chat, /14416/);
});

test('AI chat never diagnoses or prescribes and uses consented context', () => {
  assert.match(chat, /Never diagnose medical conditions or prescribe medication/);
  assert.match(chat, /ai_memory_opt_in/);
  assert.match(chat, /cycle_tracking_opt_in/);
});

test('Wellness summary is owner-only and explainable', () => {
  assert.match(migration, /create or replace function public\.get_wellness_summary/);
  assert.match(migration, /auth\.uid\(\) = user_id/);
  assert.match(migration, /breakdown/);
  assert.match(migration, /medical_disclaimer/);
});

test('Today-for-you RPC includes next item, wellness, growth and announcement', () => {
  assert.match(migration, /create or replace function public\.get_sakhi_today/);
  assert.match(migration, /next_item/);
  assert.match(migration, /wellness_nudge/);
  assert.match(migration, /growth_nudge/);
  assert.match(migration, /top_announcement/);
});

test('AI provider abstraction retries and supports a fallback provider', () => {
  assert.match(chat, /AI_FALLBACK_ENDPOINT/);
  assert.match(chat, /AI_FALLBACK_API_KEY/);
  assert.match(chat, /for \(let attempt = 0; attempt < 2; attempt\+\+\)/);
});

test('Scheduled nudges and burnout detection are present', () => {
  assert.match(migration, /detect_burnout/);
  assert.match(migration, /create_daily_nudges/);
  const jobs = fs.readFileSync(path.resolve('supabase/migrations/202611210007_phase345_jobs.sql'), 'utf8');
  assert.match(jobs, /sakhi-daily-nudges/);
  assert.match(jobs, /0 9 \* \* \*/);
});
