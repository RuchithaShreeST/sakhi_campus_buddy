import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';

import { localRepositories, resetLocalAdapterForTests } from '../src/data/adapters/local.ts';
import { supabaseRepositories } from '../src/data/adapters/supabase.ts';

const storage = new Map<string, string>();

Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
      removeItem: (key: string) => storage.delete(key),
    },
    location: { search: '' },
    matchMedia: () => ({ matches: false }),
    setTimeout,
  },
});
Object.defineProperty(globalThis, 'navigator', {
  configurable: true,
  value: { onLine: true },
});

beforeEach(() => {
  window.location.search = '';
  resetLocalAdapterForTests();
});

test('local demo content is labelled and uses dates relative to today', async () => {
  const [announcements, clubs, events, placements, posts] = await Promise.all([
    localRepositories.campus.listAnnouncements(),
    localRepositories.campus.listClubs(),
    localRepositories.campus.listEvents(),
    localRepositories.campus.listPlacements(),
    localRepositories.circle.listPosts(),
  ]);
  const allContent = [...announcements, ...clubs, ...events, ...placements, ...posts];

  assert.ok(allContent.length > 0);
  assert.ok(allContent.every((item) => item.trust_label === 'community'));
  assert.ok(announcements[0]?.title.startsWith('Demo'));
  assert.equal(new Date(events[0].starts_at).getTime() > Date.now(), true);
  assert.equal(new Date(placements[0].deadline!).getTime() > Date.now(), true);
});

test('cycle and AI memory data require consent and are cleared when consent is withdrawn', async () => {
  await assert.rejects(
    localRepositories.wellness.saveCycleEntry({ start_date: new Date().toISOString().slice(0, 10) }),
    /consent/
  );
  await assert.rejects(
    localRepositories.chat.saveMemory({ label: 'Preference', value: 'Short study plans' }),
    /consent/
  );

  await localRepositories.consents.update({ cycle_tracking_opt_in: true, ai_memory_opt_in: true });
  const cycle = await localRepositories.wellness.saveCycleEntry({ start_date: new Date().toISOString().slice(0, 10) });
  const memory = await localRepositories.chat.saveMemory({ label: 'Preference', value: 'Short study plans' });
  assert.equal((await localRepositories.wellness.listCycleEntries()).length, 1);
  assert.equal((await localRepositories.chat.listMemories()).length, 1);

  await localRepositories.consents.update({ cycle_tracking_opt_in: false, ai_memory_opt_in: false });
  assert.deepEqual(await localRepositories.wellness.listCycleEntries(), []);
  assert.deepEqual(await localRepositories.chat.listMemories(), []);
  assert.ok(cycle.id);
  assert.ok(memory.id);
});

test('local chat streams crisis support with a trusted-person prompt', async () => {
  const chunks = [];
  for await (const chunk of localRepositories.chat.streamReply('I feel unsafe and might hurt myself', new AbortController().signal)) {
    chunks.push(chunk);
  }

  assert.ok(chunks.some((chunk) => chunk.crisisSupport?.phone === '14416'));
  assert.match(chunks.map((chunk) => chunk.text).join(''), /someone you trust/i);
});

test('local adapter surfaces simulated failures rather than hiding them', async () => {
  window.location.search = '?demoError';
  await assert.rejects(localRepositories.campus.listAnnouncements(), /Simulated local-adapter failure/);
});

test('Supabase auth reports missing public client configuration', async () => {
  await assert.rejects(supabaseRepositories.auth.currentUser(), /Supabase Auth is not configured/);
});

test('appearance preference persists locally and respects the system theme by default', () => {
  assert.equal(localRepositories.preferences.getTheme(), 'light');
  localRepositories.preferences.setTheme('dark');
  assert.equal(localRepositories.preferences.getTheme(), 'dark');
});

test('local auth verifies email, preserves the user id, and updates the password', async () => {
  const email = 'student@example.test';
  const password = 'safe-demo-password';
  const signup = await localRepositories.auth.signUp(email, password);

  assert.equal(signup.verificationRequired, true);
  assert.match(signup.demoVerificationCode ?? '', /^[a-f\d]{8}$/i);
  await assert.rejects(localRepositories.auth.signIn(email, password), /verify your email/);

  const verified = await localRepositories.auth.verifyEmail(signup.demoVerificationCode!);
  assert.equal(verified.emailVerified, true);
  await localRepositories.profile.save({
    display_name: 'Demo Student',
    campus_name: 'Demo Campus',
    course: 'Demo studies',
    year: '2',
  });
  await localRepositories.auth.signOut();
  await assert.equal((await localRepositories.auth.signIn(email, password)).id, verified.id);

  const reset = await localRepositories.auth.resetPassword(email, 'new-demo-password');
  assert.deepEqual(reset, { status: 'updated' });
  await localRepositories.auth.signOut();
  await assert.rejects(localRepositories.auth.signIn(email, password), /incorrect/);
  assert.equal((await localRepositories.auth.signIn(email, 'new-demo-password')).id, verified.id);
});

test('local wellness summary excludes empty seed logs and bounds the score', async () => {
  assert.equal((await localRepositories.wellness.getSummary(7)).score, null);
  await localRepositories.wellness.saveLog({
    logged_on: new Date().toISOString().slice(0, 10),
    mood: 'low',
    sleep_hours: 18,
    water_ml: 9000,
    exercise_minutes: 180,
  });
  const summary = await localRepositories.wellness.getSummary(7);
  assert.ok(summary.score !== null && summary.score >= 0 && summary.score <= 100);

  await localRepositories.wellness.saveLog({
    logged_on: new Date().toISOString().slice(0, 10),
    sleep_hours: -8,
    water_ml: -100,
    exercise_minutes: -10,
  });
  const invalidValuesSummary = await localRepositories.wellness.getSummary(7);
  assert.ok(invalidValuesSummary.score !== null && invalidValuesSummary.score >= 0);
  assert.ok(Object.values(invalidValuesSummary.breakdown).every((value) => value >= 0));
});

test('daily top-three priorities allow up to three valid items per date', async () => {
  const date = new Date().toISOString().slice(0, 10);
  const items = await Promise.all(['One', 'Two', 'Three'].map((title) =>
    localRepositories.planner.create({ title, category: 'Study', date_key: date })
  ));
  const ids = items.map((item) => item.id);

  await localRepositories.planner.setDailyTopThree(date, ids);
  assert.deepEqual(await localRepositories.planner.getDailyTopThree(date), ids);
  await assert.rejects(localRepositories.planner.setDailyTopThree(date, [...ids, 'fourth']), /three/);
});

test('legacy local state migrates and malformed storage errors remain visible', async () => {
  storage.set('sakhi.web.local.v1', JSON.stringify({ profile: null }));
  await localRepositories.auth.currentUser();
  assert.equal(storage.has('sakhi.web.local.v1'), false);
  assert.equal(storage.has('sakhi.web.local.v2'), true);

  resetLocalAdapterForTests();
  storage.set('sakhi.web.local.v2', '{');
  await assert.rejects(localRepositories.auth.currentUser(), /could not be read/);

  resetLocalAdapterForTests();
  storage.set('sakhi.web.local.v2', JSON.stringify({ wellnessLogs: 'invalid' }));
  await assert.rejects(localRepositories.auth.currentUser(), /invalid wellnessLogs/);
});

test('local account export is scoped to the signed-in user and deletion clears browser data', async () => {
  const signup = await localRepositories.auth.signUp('owner@example.test', 'safe-demo-password');
  const user = await localRepositories.auth.verifyEmail(signup.demoVerificationCode!);
  await localRepositories.profile.save({
    display_name: 'Demo Owner',
    campus_name: 'Demo Campus',
    course: 'Demo studies',
    year: '2',
  });
  const ownLog = await localRepositories.wellness.saveLog({
    logged_on: new Date().toISOString().slice(0, 10),
    mood: 'okay',
  });
  const ownPost = await localRepositories.circle.createPost({
    title: 'Private export check',
    body: 'A new post can be anonymous without losing ownership for export.',
    category: 'Community',
    anonymous: true,
  });
  const ownComment = await localRepositories.circle.createComment(ownPost.id, 'A reply by the same user.');

  const exported = await localRepositories.account.exportData();
  assert.equal(exported.profile?.id, user.id);
  assert.ok(exported.wellness_logs.some((log) => log.id === ownLog.id));
  assert.ok(exported.wellness_logs.every((log) => log.user_id === user.id));
  assert.ok(exported.posts.some((post) => post.id === ownPost.id && post.author_id === null));
  assert.ok(exported.comments.some((comment) => comment.id === ownComment.id));

  localRepositories.preferences.setTheme('dark');
  await localRepositories.account.deleteAccount();
  assert.equal(storage.has('sakhi.web.local.v2'), false);
  assert.equal(localRepositories.preferences.getTheme(), 'light');
  assert.equal(await localRepositories.auth.currentUser(), null);
});
