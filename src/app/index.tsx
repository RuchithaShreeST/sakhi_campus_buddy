import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Companion } from '@/components/companion/Companion';
import { SakhiChatModal } from '@/components/companion/SakhiChatModal';
import { ActionButton, Card, Header, ProgressBar, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';
import { formatDuration } from '@/hooks/use-activity-session';
import { useWellness } from '@/hooks/use-wellness';
import { getWellnessInsight } from '@/services/aiInsights';
import { getBalanceScore, getLifestyleTotals } from '@/services/wellnessEngine';

export default function HomeScreen() {
  const router = useRouter();
  const { data, wellness, addWater, pauseActivity, resumeActivity, finishActiveActivity, setCompanionState } = useWellness();
  const { campus } = useCampus();
  const [chatOpen, setChatOpen] = useState(false);

  const insight = getWellnessInsight(data);
  const totals = getLifestyleTotals(data);
  const balance = getBalanceScore(data) ?? 72;
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : hour < 21 ? 'Good evening' : 'Good night';
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date());

  const progress = [
    { label: 'Sleep', value: data.sleep.duration / data.profile.sleepGoal, color: '#818CF8' },
    { label: 'Movement', value: (data.exerciseMinutes + totals.movement) / Math.max(data.profile.exerciseGoal * 2, 60), color: '#4F46E5' },
    { label: 'Hydration', value: data.water / data.profile.waterGoal, color: '#34D399' },
    { label: 'Self Care', value: (totals.selfCare + totals.fun + totals.social) / 90, color: '#FBBF24' },
  ];

  return (
    <Screen>
      {/* Top Header */}
      <Header
        eyebrow={today}
        title={`${timeGreeting}, ${data.profile.name || 'Ruchitha'}`}
        subtitle="What do you need today?"
        right={
          <Pressable onPress={() => router.push('/search')} style={styles.searchHeaderBtn}>
            <Text style={styles.searchHeaderIcon}>🔍</Text>
          </Pressable>
        }
      />

      {/* Sakhi Hero Card */}
      <Card tone="rose" style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.sakhiBadge}>
            <Text style={styles.brandText}>SAKHI COMPANION</Text>
          </View>
          <Pressable onPress={() => router.push('/notifications')} style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>🔔 {campus.notifications}</Text>
          </Pressable>
        </View>

        <Pressable onPress={() => setChatOpen(true)} accessibilityRole="button" accessibilityLabel="Talk to Sakhi">
          <Companion state={wellness.state} />
        </Pressable>

        <View style={styles.statusBox}>
          <Text style={styles.statusTitle}>&quot;{wellness.message}&quot;</Text>
          <Text style={styles.statusCopy}>{wellness.recommendation}</Text>
        </View>

        <ActionButton label="Talk to Sakhi 💗" icon="💬" onPress={() => setChatOpen(true)} style={styles.talkButton} />
      </Card>

      {/* Active Moment / Focus Activity */}
      {data.activeActivity ? (
        <Card tone="lilac" style={styles.activeCard}>
          <View style={styles.activeTop}>
            <View>
              <Text style={styles.activeEyebrow}>CURRENT MOMENT</Text>
              <Text style={styles.activeTitle}>{data.activeActivity.name}</Text>
              <Text style={styles.activeMeta}>
                {data.activeActivity.category} · {formatDuration(data.activeActivity.elapsedSeconds)}
              </Text>
            </View>
            <Text style={styles.activeIcon}>{data.activeActivity.icon}</Text>
          </View>
          <View style={styles.activeActions}>
            <ActionButton
              label={data.activeActivity.pausedAt ? 'Resume' : 'Pause'}
              icon={data.activeActivity.pausedAt ? '▶' : 'Ⅱ'}
              onPress={data.activeActivity.pausedAt ? resumeActivity : pauseActivity}
              variant="soft"
              style={styles.activeButton}
            />
            <ActionButton
              label="Finish Session"
              icon="✓"
              onPress={() => {
                finishActiveActivity();
                setCompanionState('celebrating');
                setTimeout(() => setCompanionState(), 1400);
              }}
              style={styles.activeButton}
            />
          </View>
        </Card>
      ) : (
        /* Shortcut Hub Row */
        <View style={styles.shortcutRow}>
          <Pressable onPress={() => router.push('/placements')} style={styles.shortcutTile}>
            <Text style={styles.shortcutIcon}>💼</Text>
            <Text style={styles.shortcutTitle}>Placements</Text>
            <Text style={styles.shortcutSub}>Drives & Q&A</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/clubs')} style={styles.shortcutTile}>
            <Text style={styles.shortcutIcon}>🎭</Text>
            <Text style={styles.shortcutTitle}>Clubs</Text>
            <Text style={styles.shortcutSub}>Dance & Tech</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/events')} style={styles.shortcutTile}>
            <Text style={styles.shortcutIcon}>🎉</Text>
            <Text style={styles.shortcutTitle}>Events</Text>
            <Text style={styles.shortcutSub}>Weekend Fest</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/planner')} style={styles.shortcutTile}>
            <Text style={styles.shortcutIcon}>🗓️</Text>
            <Text style={styles.shortcutTitle}>Planner</Text>
            <Text style={styles.shortcutSub}>Daily schedule</Text>
          </Pressable>
        </View>
      )}

      {/* For You - Campus & Circle Highlights */}
      <SectionTitle title="Campus & Circle Highlights" action="Explore all" onAction={() => router.push('/campus')} />
      <View style={styles.highlightGrid}>
        {campus.placements.slice(0, 1).map((item) => (
          <Pressable key={item.id} onPress={() => router.push('/placements')} style={styles.highlightCard}>
            <View style={styles.tagOfficial}>
              <Text style={styles.tagText}>{item.trust}</Text>
            </View>
            <Text style={styles.highlightTitle}>{item.company} Drive</Text>
            <Text style={styles.highlightSub}>{item.role}</Text>
          </Pressable>
        ))}

        {campus.events.slice(0, 1).map((item) => (
          <Pressable key={item.id} onPress={() => router.push('/events')} style={styles.highlightCard}>
            <View style={styles.tagVerified}>
              <Text style={styles.tagText}>EVENT</Text>
            </View>
            <Text style={styles.highlightTitle}>{item.title}</Text>
            <Text style={styles.highlightSub}>{item.date}</Text>
          </Pressable>
        ))}
      </View>

      {/* Sakhi Balance Gauge */}
      <SectionTitle title="Your Wellbeing Context" action="View details" onAction={() => router.push('/wellness')} />
      <Card tone="white">
        <View style={styles.balanceTop}>
          <View>
            <Text style={styles.balanceEyebrow}>SAKHI BALANCE</Text>
            <Text style={styles.balanceScore}>{balance}</Text>
          </View>
          <View style={styles.balanceCopy}>
            <Text style={styles.balanceTitle}>
              {balance >= 75 ? 'You are finding a lovely rhythm.' : 'Small moments still count.'}
            </Text>
            <Text style={styles.balanceBody}>Calculated dynamically from your daily rest, hydration, focus, and joy.</Text>
          </View>
        </View>
        <View style={styles.balanceBars}>
          {progress.map((item) => (
            <View style={styles.balanceRow} key={item.label}>
              <Text style={styles.balanceLabel}>{item.label}</Text>
              <ProgressBar value={item.value} color={item.color} height={6} />
            </View>
          ))}
        </View>
      </Card>

      {/* Quick Log Action Buttons */}
      <SectionTitle title="Quick Log" />
      <View style={styles.quickGrid}>
        <ActionButton label="Log water (+250ml)" icon="💧" onPress={() => addWater(250)} variant="soft" style={styles.quickButton} />
        <ActionButton label="Log mood" icon="😊" onPress={() => router.push('/mood')} variant="soft" style={styles.quickButton} />
        <ActionButton label="Start activity" icon="⏱️" onPress={() => router.push('/activity')} style={styles.quickButton} />
        <ActionButton label="Log sleep" icon="🌙" onPress={() => router.push('/sleep')} variant="soft" style={styles.quickButton} />
      </View>

      {/* Insight */}
      <SectionTitle title="Sakhi's Insight" />
      <Card tone={insight.tone}>
        <Text style={styles.insightTitle}>
          {insight.title} <Text style={styles.insightIcon}>✦</Text>
        </Text>
        <Text style={styles.insightBody}>{insight.body}</Text>
      </Card>

      <Text style={styles.footer}>One place for my campus life, wellbeing, growth and people.</Text>

      <SakhiChatModal visible={chatOpen} onClose={() => setChatOpen(false)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchHeaderBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  searchHeaderIcon: { fontSize: 16 },
  heroCard: { paddingBottom: 16, overflow: 'hidden' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sakhiBadge: { backgroundColor: '#EEF2FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  brandText: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  notifBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  notifBadgeText: { color: MiraColors.ink, fontSize: 10, fontWeight: '800' },
  talkButton: { marginTop: 12 },
  statusBox: { backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 16, padding: 14, marginTop: 8 },
  statusTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '900' },
  statusCopy: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  activeCard: { marginBottom: 14, padding: 16 },
  activeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  activeEyebrow: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  activeTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900', marginTop: 4 },
  activeMeta: { color: MiraColors.muted, fontSize: 12, marginTop: 2 },
  activeIcon: { fontSize: 28 },
  activeActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  activeButton: { flex: 1 },
  shortcutRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  shortcutTile: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 12, alignItems: 'center' },
  shortcutIcon: { fontSize: 20 },
  shortcutTitle: { color: MiraColors.ink, fontSize: 12, fontWeight: '900', marginTop: 6 },
  shortcutSub: { color: MiraColors.muted, fontSize: 9, marginTop: 2 },
  highlightGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  highlightCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  tagOfficial: { backgroundColor: '#FEF3C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  tagVerified: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start' },
  tagText: { color: MiraColors.ink, fontSize: 9, fontWeight: '900' },
  highlightTitle: { color: MiraColors.ink, fontSize: 13, fontWeight: '900', marginTop: 8 },
  highlightSub: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  balanceTop: { flexDirection: 'row', alignItems: 'center' },
  balanceEyebrow: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  balanceScore: { color: MiraColors.ink, fontSize: 38, lineHeight: 42, fontWeight: '900', marginTop: 2 },
  balanceCopy: { flex: 1, marginLeft: 16 },
  balanceTitle: { color: MiraColors.ink, fontSize: 14, lineHeight: 19, fontWeight: '800' },
  balanceBody: { color: MiraColors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  balanceBars: { marginTop: 14, gap: 8 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  balanceLabel: { color: MiraColors.muted, fontSize: 11, width: 75 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickButton: { width: '48%' },
  insightTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '800' },
  insightIcon: { color: '#4F46E5' },
  insightBody: { color: MiraColors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  footer: { color: MiraColors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16, marginTop: 10, marginBottom: 16 },
});


