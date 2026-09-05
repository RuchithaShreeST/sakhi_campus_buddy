import { usePathname, useRouter } from 'expo-router';
import {
  Tabs,
  TabList,
  TabTrigger,
  TabSlot,
  TabTriggerSlotProps,
  TabListProps,
} from 'expo-router/ui';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useState } from 'react';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MiraColors, MaxContentWidth, Spacing } from '@/constants/theme';

const tabs = [
  { name: 'index', label: 'Home', path: '/' },
  { name: 'campus', label: 'Campus', path: '/campus' },
  { name: 'circle', label: 'Circle', path: '/circle' },
  { name: 'wellness', label: 'Wellness', path: '/wellness' },
  { name: 'profile', label: 'Profile', path: '/profile' },
] as const;

export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={{ height: '100%' }} />
      <TabList asChild>
        <CustomTabList>
          {tabs.map((tab) => (
            <TabTrigger key={tab.name} name={tab.name} href={tab.path} asChild>
              <TabButton>{tab.label}</TabButton>
            </TabTrigger>
          ))}
        </CustomTabList>
      </TabList>
    </Tabs>
  );
}

export function TabButton({ children, isFocused, ...props }: TabTriggerSlotProps) {
  const { width } = useWindowDimensions();
  return (
    <Pressable {...props} accessibilityRole="tab" style={({ pressed }) => [styles.tabButton, width < 640 && styles.mobileTabHidden, pressed && styles.pressed]}>
      <ThemedView type={isFocused ? 'backgroundSelected' : 'backgroundElement'} style={styles.tabButtonView}>
        <ThemedText type="small" themeColor={isFocused ? 'text' : 'textSecondary'}>
          {children}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

export function CustomTabList(_props: TabListProps) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const compact = width < 640;
  const currentTab = tabs.find((tab) => tab.path === pathname) ?? tabs[0];

  return <>
    <View style={styles.tabListContainer}>
      <ThemedView type="backgroundElement" style={[styles.innerContainer, compact && styles.compactContainer]}>
        <ThemedText type="smallBold" style={styles.brandText}>SAKHI</ThemedText>
        {_props.children}
        {compact && <Pressable accessibilityRole="button" accessibilityLabel="Choose app section" onPress={() => setMenuOpen(true)} style={({ pressed }) => [styles.dropdownTrigger, pressed && styles.pressed]}><Text style={styles.currentLabel}>{currentTab.label}</Text><Text style={styles.chevron}>⌄</Text></Pressable>}
        <ThemedText type="small" themeColor="textSecondary" style={styles.heart}>♡</ThemedText>
      </ThemedView>
    </View>
    <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
      <Pressable style={styles.modalBackdrop} onPress={() => setMenuOpen(false)}>
        <View style={styles.menu} onStartShouldSetResponder={() => true}>
          <View style={styles.menuHeader}><Text style={styles.menuTitle}>Go to</Text><Pressable onPress={() => setMenuOpen(false)} accessibilityRole="button" accessibilityLabel="Close navigation menu"><Text style={styles.close}>×</Text></Pressable></View>
          {tabs.map((tab) => <Pressable key={tab.name} accessibilityRole="button" accessibilityLabel={`Open ${tab.label}`} onPress={() => { setMenuOpen(false); router.push(tab.path); }} style={[styles.menuItem, currentTab.name === tab.name && styles.menuItemSelected]}><Text style={[styles.menuItemText, currentTab.name === tab.name && styles.menuItemTextSelected]}>{tab.label}</Text>{currentTab.name === tab.name && <Text style={styles.check}>✓</Text>}</Pressable>)}
        </View>
      </Pressable>
    </Modal>
  </>;
}

const styles = StyleSheet.create({
  tabListContainer: { position: 'absolute', width: '100%', padding: Spacing.three, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' },
  innerContainer: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.five, borderRadius: Spacing.five, flexDirection: 'row', alignItems: 'center', flexGrow: 1, gap: Spacing.two, maxWidth: MaxContentWidth },
  compactContainer: { paddingHorizontal: 14, minHeight: 54 },
  brandText: { color: MiraColors.rose, letterSpacing: 1.5, marginRight: 'auto' },
  mobileTabHidden: { display: 'none' },
  tabButton: { borderRadius: 16 },
  tabButtonView: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 14 },
  dropdownTrigger: { minWidth: 142, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: MiraColors.blush, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 9 },
  currentLabel: { color: MiraColors.ink, fontSize: 13, fontWeight: '800' },
  chevron: { color: MiraColors.rose, fontSize: 19, lineHeight: 18, marginLeft: 12 },
  heart: { marginLeft: 3 },
  pressed: { opacity: 0.7 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(45,41,50,0.34)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 82 },
  menu: { width: '88%', maxWidth: 360, backgroundColor: MiraColors.white, borderRadius: 22, padding: 12, shadowColor: MiraColors.ink, shadowOpacity: 0.2, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 8 },
  menuHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 10, paddingBottom: 8 },
  menuTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  close: { color: MiraColors.muted, fontSize: 26, lineHeight: 26 },
  menuItem: { minHeight: 48, borderRadius: 14, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuItemSelected: { backgroundColor: MiraColors.blush },
  menuItemText: { color: MiraColors.muted, fontSize: 14, fontWeight: '700' },
  menuItemTextSelected: { color: MiraColors.rose, fontWeight: '900' },
  check: { color: MiraColors.rose, fontSize: 16, fontWeight: '900' },
});
