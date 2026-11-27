import type { SakhiRepositories } from './contracts';
import { localRepositories } from './adapters/local';
import { supabaseRepositories } from './adapters/supabase';

const requestedMode = import.meta.env.VITE_DATA_MODE ?? 'local';
const isDemoLaunch = import.meta.env.MODE === 'demo';
const dataMode = isDemoLaunch ? 'local' : requestedMode;

if (dataMode !== 'local' && dataMode !== 'supabase') {
  throw new Error(`Unsupported VITE_DATA_MODE "${requestedMode}". Choose "local" or "supabase".`);
}

export { dataMode };
export const demoMode = isDemoLaunch || (dataMode === 'local' && import.meta.env.VITE_DEMO_MODE === 'true');
export const repositories: SakhiRepositories = dataMode === 'supabase' ? supabaseRepositories : localRepositories;
