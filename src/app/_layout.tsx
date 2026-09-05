import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { WellnessProvider } from '@/hooks/use-wellness';
import { CampusProvider } from '@/hooks/use-campus';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <WellnessProvider>
        <CampusProvider>
          <AnimatedSplashOverlay />
          <AppTabs />
        </CampusProvider>
      </WellnessProvider>
    </ThemeProvider>
  );
}
