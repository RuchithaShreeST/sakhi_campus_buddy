const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('Create .env.local from local Supabase status before running this integration test.');
  process.exit(1);
}

const localEnv = {};
for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*(VITE_DATA_MODE|VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)\s*=\s*(.*?)\s*$/);
  if (match) localEnv[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}

if (localEnv.VITE_DATA_MODE !== 'supabase' || !localEnv.VITE_SUPABASE_URL || !localEnv.VITE_SUPABASE_ANON_KEY) {
  console.error('.env.local must contain VITE_DATA_MODE=supabase, VITE_SUPABASE_URL, and VITE_SUPABASE_ANON_KEY.');
  process.exit(1);
}

const result = spawnSync(process.execPath, [
  '--experimental-strip-types',
  '--test',
  path.join(root, 'tests', 'supabase-auth.integration.test.ts'),
], {
  cwd: root,
  env: {
    ...process.env,
    ...localEnv,
    SAKHI_RUN_SUPABASE_INTEGRATION: '1',
  },
  stdio: 'inherit',
});

process.exit(result.status ?? 1);
