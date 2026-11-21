import type { SakhiRepositories } from './contracts';
import { localRepositories } from './adapters/local';
import { supabaseRepositories } from './adapters/supabase';

const requestedMode = import.meta.env.VITE_DATA_MODE ?? 'local';

if (requestedMode !== 'local' && requestedMode !== 'supabase') {
  throw new Error(`Unsupported VITE_DATA_MODE "${requestedMode}". Choose "local" or "supabase".`);
}

export const dataMode = requestedMode;
export const repositories: SakhiRepositories = dataMode === 'supabase' ? supabaseRepositories : localRepositories;
