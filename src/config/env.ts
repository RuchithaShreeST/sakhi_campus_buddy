function readEnv(key: string) {
  if (typeof process === 'undefined') return '';
  return (process.env[key] ?? '').trim();
}

export const env = {
  miraApiUrl: readEnv('EXPO_PUBLIC_SAKHI_API_URL') || readEnv('EXPO_PUBLIC_MIRA_API_URL'),
  apiUrl: readEnv('EXPO_PUBLIC_API_URL'),
  supabaseUrl: readEnv('EXPO_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: readEnv('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  appEnv: readEnv('EXPO_PUBLIC_APP_ENV') || 'development',
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey && !env.supabaseUrl.includes('YOUR_'));
}

export function isAiProxyConfigured() {
  return Boolean(env.miraApiUrl);
}

export function isProductionApp() {
  return env.appEnv === 'production';
}
