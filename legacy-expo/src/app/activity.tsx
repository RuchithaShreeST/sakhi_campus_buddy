import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet } from 'react-native';

import { Companion } from '@/components/companion/Companion';
import { ActionButton, Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { categoryList, activityCatalog } from '@/data/activityCatalog';
import { MiraColors } from '@/constants/theme';
import { formatDuration } from '@/hooks/use-activity-session';
import { useWellness } from '@/hooks/use-wellness';
import { ActivityCategory, ActivityDefinition } from '@/types/wellness';

export default function ActivityScreen() {
  const { data, addCustomActivity, toggleFavorite, startActivity, pauseActivity, resumeActivity, finishActiveActivity, setCompanionState } = useWellness();
  const [category, setCategory] = useState<(typeof categoryList)[number]>('All');
  const [query, setQuery] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<ActivityCategory>('Other');
  const [notice, setNotice] = useState('');
  const customDefinitions = data.customActivities;
  const allActivities = useMemo(() => [...activityCatalog, ...customDefinitions], [customDefinitions]);
  const filtered = useMemo(() => allActivities.filter((activity) => (category === 'All' || activity.category === category) && activity.name.toLowerCase().includes(query.toLowerCase())), [allActivities, category, query]);
  const favorites = allActivities.filter((activity) => data.profile.favoriteActivities.includes(activity.type));

  const begin = (activity: ActivityDefinition) => { startActivity(activity); setCompanionState(activity.companionState); };
  const finish = () => {
    const result = finishActiveActivity();
    if (!result) return;
    setCompanionState('celebrating');
    setNotice(`Nice work! +${result.minutes} min ${result.name}`);
    setTimeout(() => { setNotice(''); setCompanionState(); }, 1800);
  };
  const saveCustom = () => { if (!customName.trim()) return; addCustomActivity({ name: customName.trim(), type: 'custom', category: customCategory, icon: '✦', companionState: 'happy' }); setCustomName(''); setShowCustom(false); setCategory('Other'); };

  return <Screen>
    <Header eyebrow="Your whole day" title="Activity" subtitle="How are you spending your day?" />
    {data.activeActivity ? <Card tone="rose" style={styles.activeCard}><View style={styles.activeHeader}><View><Text style={styles.activeEyebrow}>MIRA IS WITH YOU</Text><Text style={styles.activeTitle}>{data.activeActivity.name}</Text></View><Text style={styles.timer}>{formatDuration(data.activeActivity.elapsedSeconds)}</Text></View><Companion state={data.activeActivity.companionState ?? 'idle'} /><View style={styles.timerActions}><ActionButton label={data.activeActivity.pausedAt ? 'Resume' : 'Pause'} icon={data.activeActivity.pausedAt ? '▶' : 'Ⅱ'} onPress={data.activeActivity.pausedAt ? resumeActivity : pauseActivity} variant="soft" style={styles.timerButton} /><ActionButton label="Finish" icon="✓" onPress={finish} style={styles.timerButton} /></View></Card> : <Card><Text style={styles.cardTitle}>A moment for you</Text><Text style={styles.cardCopy}>Choose something meaningful, then let MIRA keep time while you are in it.</Text><ActionButton label="Create custom activity" icon="＋" onPress={() => setShowCustom((current) => !current)} variant="soft" style={styles.customButton} /></Card>}
    {notice && <View style={styles.notice}><Text style={styles.noticeText}>✦ {notice}</Text></View>}
    {showCustom && <Card tone="lilac"><Text style={styles.cardTitle}>Create custom activity</Text><TextInput value={customName} onChangeText={setCustomName} placeholder="Activity name" placeholderTextColor={MiraColors.muted} style={styles.input} /><Text style={styles.fieldLabel}>Category</Text><View style={styles.categoryWrap}>{categoryList.filter((item) => item !== 'All').map((item) => <Pressable key={item} onPress={() => setCustomCategory(item)} style={[styles.smallChip, customCategory === item && styles.selectedChip]}><Text style={[styles.chipText, customCategory === item && styles.selectedChipText]}>{item}</Text></Pressable>)}</View><ActionButton label="Save activity" icon="✓" onPress={saveCustom} /></Card>}
    <TextInput value={query} onChangeText={setQuery} placeholder="Search activities..." placeholderTextColor={MiraColors.muted} style={styles.search} accessibilityLabel="Search activities" />
    <View style={styles.categoryScroll}>{categoryList.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, category === item && styles.categorySelected]} accessibilityRole="button" accessibilityLabel={`Filter ${item} activities`}><Text style={[styles.categoryText, category === item && styles.categorySelectedText]}>{item}</Text></Pressable>)}</View>
    {favorites.length > 0 && category === 'All' && !query && <><SectionTitle title="Your favorites" /><View style={styles.favoriteRow}>{favorites.slice(0, 4).map((activity) => <ActivityCard activity={activity} favorite onStart={begin} onFavorite={toggleFavorite} key={activity.id} />)}</View></>}
    <SectionTitle title={category === 'All' ? 'Explore activities' : category} action={`${filtered.length} options`} />
    {filtered.map((activity) => <ActivityCard activity={activity} favorite={data.profile.favoriteActivities.includes(activity.type)} onStart={begin} onFavorite={toggleFavorite} key={`${activity.id}-${activity.name}`} />)}
  </Screen>;
}

function ActivityCard({ activity, favorite, onStart, onFavorite }: { activity: ActivityDefinition; favorite: boolean; onStart: (activity: ActivityDefinition) => void; onFavorite: (type: ActivityDefinition['type']) => void }) {
  return <Card style={styles.activityCard}><View style={styles.activityIcon}><Text style={styles.iconText}>{activity.icon}</Text></View><View style={styles.activityCopy}><Text style={styles.activityName}>{activity.name}</Text><Text style={styles.activityMeta}>{activity.category}{activity.typicalMinutes ? ` · ${activity.typicalMinutes} min` : ''}</Text></View><Pressable onPress={() => onFavorite(activity.type)} accessibilityRole="button" accessibilityLabel={`${favorite ? 'Remove' : 'Add'} ${activity.name} favorite`}><Text style={[styles.favorite, favorite && styles.favoriteOn]}>{favorite ? '★' : '☆'}</Text></Pressable><Pressable onPress={() => onStart(activity)} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel={`Start ${activity.name}`}><Text style={styles.startText}>Start</Text></Pressable></Card>;
}

const styles = StyleSheet.create({ activeCard: { overflow: 'hidden' }, activeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }, activeEyebrow: { color: MiraColors.rose, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 }, activeTitle: { color: MiraColors.ink, fontSize: 22, fontWeight: '900', marginTop: 5 }, timer: { color: MiraColors.ink, fontSize: 21, fontWeight: '900', fontVariant: ['tabular-nums'] }, timerActions: { flexDirection: 'row', gap: 8 }, timerButton: { flex: 1 }, cardTitle: { color: MiraColors.ink, fontSize: 16, fontWeight: '800' }, cardCopy: { color: MiraColors.muted, fontSize: 13, lineHeight: 19, marginTop: 5 }, customButton: { marginTop: 16 }, notice: { backgroundColor: MiraColors.mint, borderRadius: 14, padding: 13, marginBottom: 12 }, noticeText: { color: '#567864', fontSize: 13, fontWeight: '800', textAlign: 'center' }, search: { backgroundColor: MiraColors.white, borderWidth: 1, borderColor: MiraColors.line, borderRadius: 15, paddingHorizontal: 15, paddingVertical: 12, color: MiraColors.ink, marginBottom: 11 }, categoryScroll: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }, categoryChip: { borderRadius: 16, backgroundColor: MiraColors.white, borderWidth: 1, borderColor: MiraColors.line, paddingHorizontal: 12, paddingVertical: 8 }, categorySelected: { backgroundColor: MiraColors.ink, borderColor: MiraColors.ink }, categoryText: { color: MiraColors.muted, fontSize: 11, fontWeight: '700' }, categorySelectedText: { color: MiraColors.white }, favoriteRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, activityCard: { minHeight: 71, flexDirection: 'row', alignItems: 'center', padding: 12, marginBottom: 9, shadowOpacity: 0.04 }, activityIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: MiraColors.blush, alignItems: 'center', justifyContent: 'center' }, iconText: { color: MiraColors.rose, fontSize: 20, fontWeight: '900' }, activityCopy: { flex: 1, marginLeft: 11 }, activityName: { color: MiraColors.ink, fontSize: 14, fontWeight: '800' }, activityMeta: { color: MiraColors.muted, fontSize: 11, marginTop: 3 }, favorite: { color: '#D9CED0', fontSize: 21, paddingHorizontal: 8 }, favoriteOn: { color: MiraColors.coral }, startButton: { backgroundColor: MiraColors.blush, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 }, startText: { color: MiraColors.rose, fontSize: 11, fontWeight: '900' }, pressed: { opacity: 0.7 }, input: { backgroundColor: MiraColors.white, borderWidth: 1, borderColor: MiraColors.line, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 10, color: MiraColors.ink, marginTop: 13 }, fieldLabel: { color: MiraColors.muted, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 8 }, categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 16 }, smallChip: { backgroundColor: MiraColors.white, borderRadius: 13, paddingHorizontal: 10, paddingVertical: 7 }, selectedChip: { backgroundColor: MiraColors.rose }, chipText: { color: MiraColors.muted, fontSize: 11 }, selectedChipText: { color: MiraColors.white, fontWeight: '800' } });
