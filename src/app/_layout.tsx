import { DarkTheme, DefaultTheme, ThemeProvider, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WellnessProvider, useWellness } from '@/hooks/use-wellness';
import { CampusProvider } from '@/hooks/use-campus';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { getRequiredAuthRoute } from '@/services/authRouting';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <WellnessProvider>
          <CampusProvider>
            <AuthenticatedApp />
          </CampusProvider>
        </WellnessProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AuthenticatedApp() {
  const router = useRouter();
  const pathname = usePathname();
  const auth = useAuth();
  const { data, loading: wellnessLoading } = useWellness();

  useEffect(() => {
    if (wellnessLoading) return;
    const target = getRequiredAuthRoute({
      authConfigured: auth.configured,
      signedIn: Boolean(auth.session),
      authLoading: auth.loading,
      onboardingCompleted: Boolean(data.profile.onboardingCompleted),
      pathname,
    });
    if (target && pathname !== target) router.replace(target as never);
  }, [auth.configured, auth.loading, auth.session, data.profile.onboardingCompleted, pathname, router, wellnessLoading]);

  return (
    <>
      <AnimatedSplashOverlay />
      <AppTabs />
    </>
  );
}
