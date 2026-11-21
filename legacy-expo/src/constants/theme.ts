/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F2430',
    background: '#F6F7FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#EEF0FF',
    textSecondary: '#697386',
  },
  dark: {
    text: '#F8F9FC',
    background: '#171A21',
    backgroundElement: '#222631',
    backgroundSelected: '#30365A',
    textSecondary: '#AAB2C2',
  },
} as const;

export const MiraColors = {
  coral: '#6C63FF',
  blush: '#EEF0FF',
  rose: '#5A52D6',
  sage: '#B9DCD2',
  mint: '#E4F3EF',
  butter: '#F4E9C8',
  lavender: '#E9E8FF',
  sand: '#F7F6F2',
  lilac: '#F3E8FF',
  ink: '#1F2430',
  muted: '#697386',
  white: '#FFFFFF',
  line: '#E3E6EE',
} as const;

export const SakhiColors = MiraColors;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
