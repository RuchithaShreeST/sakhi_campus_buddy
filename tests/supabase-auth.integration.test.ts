import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database.ts';
import { createSupabaseAuthRepository } from '../src/data/adapters/supabase.ts';

type TestStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

function createStorage(values = new Map<string, string>()): TestStorage {
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => { values.set(key, value); },
    removeItem: (key) => { values.delete(key); },
  };
}

async function waitForEmailCode(email: string, sentAfter: number, timeoutMs = 20_000): Promise<string> {
  const deadline = Date.now() + timeoutMs;
  const mailpitUrl = 'http://127.0.0.1:54324';
  while (Date.now() < deadline) {
    const listResponse = await fetch(`${mailpitUrl}/api/v1/messages?limit=50`);
    if (!listResponse.ok) throw new Error(`Mailpit returned HTTP ${listResponse.status}.`);
    const list = await listResponse.json() as {
      messages: Array<{ ID?: string; id?: string; To?: unknown; to?: unknown; Created?: string; created?: string }>;
    };
    const message = list.messages.find((item) => {
      const createdAt = Date.parse(item.Created ?? item.created ?? '');
      return createdAt >= sentAfter && JSON.stringify(item.To ?? item.to).toLowerCase().includes(email);
    });
    const id = message?.ID ?? message?.id;
    if (id) {
      const detailResponse = await fetch(`${mailpitUrl}/api/v1/message/${encodeURIComponent(id)}`);
      if (!detailResponse.ok) throw new Error(`Mailpit message lookup returned HTTP ${detailResponse.status}.`);
      const detail = await detailResponse.json() as { Text?: string; HTML?: string; text?: string; html?: string };
      const body = `${detail.Text ?? detail.text ?? ''}\n${detail.HTML ?? detail.html ?? ''}`;
      const code = body.match(/\b\d{6}\b/)?.[0];
      if (code) return code;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for a verification code for ${email}.`);
}

const runIntegration = process.env.SAKHI_RUN_SUPABASE_INTEGRATION === '1';

test('Supabase auth signs up, verifies, restores sessions, resets passwords, and signs out', {
  skip: !runIntegration && 'Run npm run test:integration:auth against the local Supabase stack.',
  timeout: 90_000,
}, async () => {
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  assert.ok(url, 'VITE_SUPABASE_URL is required.');
  assert.ok(anonKey, 'VITE_SUPABASE_ANON_KEY is required.');

  const authStorage = createStorage();
  const pendingEmailStorage = createStorage();
  const client = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, storage: authStorage },
  });
  const auth = createSupabaseAuthRepository(client, {
    origin: 'http://localhost:5173',
    storage: pendingEmailStorage,
  });

  const email = `auth-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.test`;
  const initialPassword = 'Local-sakhi-password-1!';
  const newPassword = 'Local-sakhi-password-2!';
  const signup = await auth.signUp(email, initialPassword);
  assert.equal(signup.user.email, email);
  assert.equal(signup.verificationRequired, true);

  const signupCode = await waitForEmailCode(email, Date.now() - 2_000);
  const verified = await auth.verifyEmail(signupCode);
  assert.equal(verified.emailVerified, true);
  assert.equal((await auth.currentUser())?.id, verified.id);

  await auth.signOut();
  assert.equal(await auth.currentUser(), null);
  assert.equal((await auth.signIn(email, initialPassword)).id, verified.id);

  const restoredClient = createClient<Database>(url, anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: true, storage: authStorage },
  });
  const restoredAuth = createSupabaseAuthRepository(restoredClient, { storage: pendingEmailStorage });
  assert.equal((await restoredAuth.currentUser())?.id, verified.id);

  const resetRequestedAt = Date.now();
  assert.deepEqual(await auth.resetPassword(email), { status: 'email_sent' });
  const recoveryCode = await waitForEmailCode(email, resetRequestedAt);
  const { data: recoveryData, error: recoveryError } = await client.auth.verifyOtp({
    email,
    token: recoveryCode,
    type: 'recovery',
  });
  if (recoveryError) throw new Error(recoveryError.message);
  assert.equal(recoveryData.user?.id, verified.id);
  assert.deepEqual(await auth.resetPassword(email, newPassword), { status: 'updated' });

  await auth.signOut();
  await assert.rejects(auth.signIn(email, initialPassword));
  assert.equal((await auth.signIn(email, newPassword)).id, verified.id);
});
