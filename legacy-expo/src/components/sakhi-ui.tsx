import { PropsWithChildren, ReactNode } from 'react';
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MiraColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export function Screen({ children, scroll = true }: PropsWithChildren<{ scroll?: boolean }>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const content = (
    <View style={[styles.screenContent, isWeb && styles.webScreenContent, { backgroundColor: theme.background }]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]} showsVerticalScrollIndicator={false}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

export function Header({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerCopy}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>}
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

export function Card({ children, style, tone = 'white' }: PropsWithChildren<{ style?: StyleProp<ViewStyle>; tone?: 'white' | 'rose' | 'sage' | 'lilac' | 'gold' }>) {
  const backgrounds = {
    white: MiraColors.white,
    rose: '#FEE2E2',
    sage: '#E0E7FF',
    lilac: '#EEF2FF',
    gold: '#FEF3C7',
  };
  return <View style={[styles.card, { backgroundColor: backgrounds[tone] }, style]}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      {action && (
        <Pressable onPress={onAction}>
          <Text style={styles.actionText}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function ProgressBar({ value, color = '#6366F1', height = 8 }: { value: number; color?: string; height?: number }) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View style={[styles.progressFill, { width: `${Math.min(value, 1) * 100}%`, backgroundColor: color, height }]} />
    </View>
  );
}

export function StatTile({ label, value, unit, icon, color = '#EEF2FF', style }: { label: string; value: string; unit?: string; icon: string; color?: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.statTile, { backgroundColor: color }, style]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>
        {value}
        <Text style={styles.statUnit}>{unit}</Text>
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function ActionButton({ label, icon, onPress, variant = 'primary', style }: { label: string; icon: string; onPress: () => void; variant?: 'primary' | 'soft'; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        variant === 'soft' ? styles.softButton : styles.primaryButton,
        style,
        pressed && styles.pressed,
      ]}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={[styles.actionLabel, variant === 'soft' && styles.softLabel]}>{label}</Text>
    </Pressable>
  );
}

export function MiniChart({ values, color = '#6366F1' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <View style={styles.chart}>
      {values.map((value, index) => (
        <View key={`${value}-${index}`} style={styles.chartColumn}>
          <View style={[styles.chartBar, { height: `${Math.max(value / max, 0.12) * 100}%`, backgroundColor: color }]} />
          <Text style={styles.chartLabel}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, alignItems: 'center' },
  scrollContent: { flexGrow: 1, width: '100%', alignItems: 'center' },
  webScrollContent: { alignItems: 'center' },
  screenContent: { flexGrow: 1, width: '100%', maxWidth: 540, paddingHorizontal: 20, paddingBottom: 32 },
  webScreenContent: { maxWidth: 640 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingTop: 12, paddingBottom: 16 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#6366F1', fontSize: 10, fontWeight: '800', letterSpacing: 1.4, marginBottom: 5 },
  title: { color: MiraColors.ink, fontSize: 26, lineHeight: 32, fontWeight: '900' },
  subtitle: { color: MiraColors.muted, fontSize: 14, lineHeight: 20, marginTop: 4 },
  card: { borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#1E293B', shadowOpacity: 0.04, shadowRadius: 12, elevation: 1 },
  sectionTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 10 },
  sectionHeading: { color: MiraColors.ink, fontSize: 17, fontWeight: '900' },
  actionText: { color: '#4F46E5', fontSize: 12, fontWeight: '800' },
  progressTrack: { backgroundColor: '#E2E8F0', borderRadius: 20, overflow: 'hidden' },
  progressFill: { borderRadius: 20 },
  statTile: { flex: 1, minHeight: 100, borderRadius: 18, padding: 14, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValue: { color: MiraColors.ink, fontSize: 20, fontWeight: '900' },
  statUnit: { fontSize: 11, fontWeight: '600', marginLeft: 3 },
  statLabel: { color: MiraColors.muted, fontSize: 11, marginTop: 3 },
  actionButton: { minHeight: 46, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  primaryButton: { backgroundColor: '#4F46E5' },
  softButton: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' },
  actionIcon: { fontSize: 16, color: '#FFFFFF' },
  actionLabel: { color: MiraColors.white, fontSize: 13, fontWeight: '800' },
  softLabel: { color: '#4F46E5' },
  pressed: { opacity: 0.76, transform: [{ scale: 0.98 }] },
  chart: { height: 120, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 12 },
  chartColumn: { height: '100%', alignItems: 'center', justifyContent: 'flex-end', width: 28 },
  chartBar: { width: 12, minHeight: 8, borderRadius: 6, opacity: 0.9 },
  chartLabel: { color: MiraColors.muted, fontSize: 10, marginTop: 6 },
});