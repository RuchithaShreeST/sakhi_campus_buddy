import type { PreferencesRepository, ThemePreference } from '../contracts';

const THEME_KEY = 'sakhi-theme';

export const browserPreferences: PreferencesRepository = {
  getTheme(): ThemePreference {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  setTheme(theme: ThemePreference) {
    window.localStorage.setItem(THEME_KEY, theme);
  },
  getRuntimeStatus() {
    const params = new URLSearchParams(window.location.search);
    return {
      offline: !navigator.onLine || params.has('demoOffline'),
      simulatedError: params.has('demoError'),
    };
  },
};
