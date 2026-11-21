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

test('Supabase stub reports that live integration is not configured', async () => {
  await assert.rejects(supabaseRepositories.auth.currentUser(), /not configured yet/);
});

test('appearance preference persists locally and respects the system theme by default', () => {
  assert.equal(localRepositories.preferences.getTheme(), 'light');
  localRepositories.preferences.setTheme('dark');
  assert.equal(localRepositories.preferences.getTheme(), 'dark');
});
