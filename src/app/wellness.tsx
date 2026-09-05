import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Header, ProgressBar, Screen, SectionTitle } from '@/components/sakhi-ui';
import { Companion } from '@/components/companion/Companion';
import { MiraColors } from '@/constants/theme';
import { getBalanceScore } from '@/services/wellnessEngine';
import { useWellness } from '@/hooks/use-wellness';

const cycleSymptoms = [
  'Mild cramps',
  'Moderate cramps',
  'Bloating',
  'Headache',
  'Fatigue',
  'Low energy',
  'Mood swings',
  'Restless sleep',
];

export default function WellnessScreen() {
  const router = useRouter();
  const { data, wellness, addWater, addCycleEntry } = useWellness();

  const [periodLoggerOpen, setPeriodLoggerOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<'light' | 'medium' | 'heavy' | 'spotting'>('medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [cycleNotes] = useState('');
  const [loggedSuccessMsg, setLoggedSuccessMsg] = useState(false);

  const balance = getBalanceScore(data);

  const items = [
    {
      label: 'Sleep',
      value: Math.min(1, data.sleep.duration / Math.max(data.profile.sleepGoal, 1)),
      display: `${data.sleep.duration} hrs / ${data.profile.sleepGoal} hrs`,
      color: MiraColors.lavender,
    },
    {
      label: 'Hydration',
      value: Math.min(1, data.water / Math.max(data.profile.waterGoal, 1)),
      display: `${data.water} ml / ${data.profile.waterGoal} ml`,
      color: MiraColors.sage,
    },
    {
      label: 'Movement',
      value: Math.min(1, data.exerciseMinutes / Math.max(data.profile.exerciseGoal, 1)),
      display: `${data.exerciseMinutes} mins / ${data.profile.exerciseGoal} mins`,
      color: MiraColors.coral,
    },
  ];

  const toggleSymptom = (symptom: string) => {
    if (selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== symptom));
    } else {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
  };

  const handleSaveCycle = () => {
    addCycleEntry({
      startDate: new Date().toLocaleDateString([], { month: 'short', day: 'numeric' }),
      flow: selectedFlow === 'spotting' ? 'light' : selectedFlow,
      symptoms: selectedSymptoms,
      notes: cycleNotes,
    });
    setPeriodLoggerOpen(false);
    setLoggedSuccessMsg(true);
    setTimeout(() => setLoggedSuccessMsg(false), 3000);
  };

  return (
    <Screen>
      <Header
        eyebrow="Wellbeing & Rhythm"
        title="How are you really doing?"
        subtitle="A softer place to track your body, mood, and daily balance."
      />

      {/* Companion Card */}
      <Card tone="rose" style={{ padding: 18, alignItems: 'center' }}>
        <Companion state={wellness.state} />
        <Text style={styles.message}>{wellness.message}</Text>
        <Text style={styles.copy}>{wellness.recommendation}</Text>
      </Card>

      {/* Balance Card */}
      <Card style={{ marginTop: 12 }}>
        <View style={styles.balanceHeader}>
          <Text style={styles.balanceLabel}>SAKHI BALANCE</Text>
          <Text style={styles.balanceScore}>{balance} / 100</Text>
        </View>
        <Text style={styles.note}>A holistic lifestyle indicator, not a medical score.</Text>

        {items.map((item) => (
          <View style={styles.row} key={item.label}>
            <View style={styles.labelCol}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.metaDisplay}>{item.display}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <ProgressBar value={item.value} color={item.color} height={8} />
            </View>
          </View>
        ))}

        {/* Quick Water Button */}
        <View style={styles.quickWaterRow}>
          <Text style={styles.waterText}>💧 Quick Hydration: </Text>
          <Pressable onPress={() => addWater(250)} style={styles.waterBtn}>
            <Text style={styles.waterBtnText}>+ 250 ml</Text>
          </Pressable>
          <Pressable onPress={() => addWater(500)} style={styles.waterBtn}>
            <Text style={styles.waterBtnText}>+ 500 ml</Text>
          </Pressable>
        </View>
      </Card>

      {/* Quick Action Grid */}
      <SectionTitle title="Daily check-ins" />
      <View style={styles.actions}>
        <Pressable onPress={() => router.push('/mood')} style={styles.action}>
          <Text style={styles.actionIcon}>💗</Text>
          <Text style={styles.actionTitle}>Mood & Stress</Text>
          <Text style={styles.actionDesc}>Check in with how you feel</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/sleep')} style={styles.action}>
          <Text style={styles.actionIcon}>🌙</Text>
          <Text style={styles.actionTitle}>Sleep Tracker</Text>
          <Text style={styles.actionDesc}>Log hours & sleep quality</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/activity')} style={styles.action}>
          <Text style={styles.actionIcon}>🏃‍♀️</Text>
          <Text style={styles.actionTitle}>Move & Focus</Text>
          <Text style={styles.actionDesc}>Log workout, study or deep work</Text>
        </Pressable>
        <Pressable onPress={() => setPeriodLoggerOpen(!periodLoggerOpen)} style={styles.action}>
          <Text style={styles.actionIcon}>🌸</Text>
          <Text style={styles.actionTitle}>Period & Body Care</Text>
          <Text style={styles.actionDesc}>Track cycle & symptoms</Text>
        </Pressable>
      </View>

      {loggedSuccessMsg && (
        <View style={styles.toastMsg}>
          <Text style={styles.toastText}>✨ Body care log saved to your timeline!</Text>
        </View>
      )}

      {/* Period & Body Care Logger Card */}
      {periodLoggerOpen && (
        <Card tone="lilac" style={{ marginTop: 12 }}>
          <Text style={styles.formTitle}>🌸 Period & Body Care Check-in</Text>
          <Text style={styles.copy}>
            Keep track of physical rhythm to receive tailored Sakhi comfort suggestions.
          </Text>

          <Text style={styles.subhead}>Flow Intensity:</Text>
          <View style={styles.pillRow}>
            {(['spotting', 'light', 'medium', 'heavy'] as const).map((flow) => (
              <Pressable
                key={flow}
                onPress={() => setSelectedFlow(flow)}
                style={[styles.pill, selectedFlow === flow && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedFlow === flow && styles.pillTextActive]}>
                  {flow.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.subhead}>Symptoms (Optional):</Text>
          <View style={styles.symptomsWrap}>
            {cycleSymptoms.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <Pressable
                  key={sym}
                  onPress={() => toggleSymptom(sym)}
                  style={[styles.symPill, active && styles.symPillActive]}
                >
                  <Text style={[styles.symText, active && styles.symTextActive]}>{sym}</Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={handleSaveCycle} style={styles.saveCycleBtn}>
            <Text style={styles.saveCycleText}>Save Body Care Entry</Text>
          </Pressable>
        </Card>
      )}

      {/* Cycle Log History */}
      {data.cycleEntries && data.cycleEntries.length > 0 && (
        <View style={{ marginTop: 12 }}>
          <SectionTitle title="Recent Cycle Entries" />
          {data.cycleEntries.slice(0, 3).map((entry: any, idx: number) => (
            <Card key={idx} style={{ marginBottom: 8, padding: 12 }}>
              <Text style={styles.entryDate}>{entry.startDate || entry.date}</Text>
              <Text style={styles.entryDetails}>
                Flow: <Text style={{ fontWeight: '800' }}>{entry.flow || 'Normal'}</Text> · Symptoms:{' '}
                {entry.symptoms && entry.symptoms.length > 0 ? entry.symptoms.join(', ') : 'None logged'}
              </Text>
            </Card>
          ))}
        </View>
      )}

      {/* Non-clinical Medical Disclaimer */}
      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerTitle}>💡 Lifestyle & Educational Disclaimer</Text>
        <Text style={styles.disclaimerText}>
          Sakhi is designed for personal wellbeing, habit tracking, and peer support. It does NOT
          diagnose medical conditions (such as PCOS, endometriosis, or clinical anxiety) nor prescribe
          treatments. If you experience severe or unusual pain, please consult a qualified healthcare provider.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  message: {
    color: MiraColors.ink,
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 10,
  },
  copy: {
    color: MiraColors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    color: MiraColors.rose,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  balanceScore: {
    color: MiraColors.ink,
    fontSize: 22,
    fontWeight: '900',
  },
  note: {
    color: MiraColors.muted,
    fontSize: 11,
    marginBottom: 14,
    marginTop: 2,
  },
  row: {
    marginBottom: 10,
  },
  labelCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: MiraColors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  metaDisplay: {
    color: MiraColors.muted,
    fontSize: 11,
  },
  quickWaterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: MiraColors.line,
  },
  waterText: {
    color: MiraColors.ink,
    fontSize: 11,
    fontWeight: '800',
  },
  waterBtn: {
    backgroundColor: MiraColors.blush,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 6,
  },
  waterBtnText: {
    color: MiraColors.rose,
    fontSize: 11,
    fontWeight: '900',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  action: {
    width: '48%',
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 14,
    padding: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  actionTitle: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  actionDesc: {
    color: MiraColors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  toastMsg: {
    backgroundColor: MiraColors.ink,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    alignItems: 'center',
  },
  toastText: {
    color: MiraColors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  formTitle: {
    color: MiraColors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  subhead: {
    color: MiraColors.ink,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pillActive: {
    backgroundColor: MiraColors.rose,
    borderColor: MiraColors.rose,
  },
  pillText: {
    color: MiraColors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  pillTextActive: {
    color: MiraColors.white,
  },
  symptomsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symPill: {
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  symPillActive: {
    backgroundColor: MiraColors.lilac,
    borderColor: MiraColors.ink,
  },
  symText: {
    color: MiraColors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  symTextActive: {
    color: MiraColors.ink,
    fontWeight: '900',
  },
  saveCycleBtn: {
    marginTop: 14,
    backgroundColor: MiraColors.ink,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveCycleText: {
    color: MiraColors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  entryDate: {
    color: MiraColors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  entryDetails: {
    color: MiraColors.muted,
    fontSize: 11,
    marginTop: 2,
  },
  disclaimerBox: {
    backgroundColor: MiraColors.sand,
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MiraColors.line,
  },
  disclaimerTitle: {
    color: MiraColors.ink,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  disclaimerText: {
    color: MiraColors.muted,
    fontSize: 10,
    lineHeight: 15,
  },
});

