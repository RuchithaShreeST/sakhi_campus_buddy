import { useState } from 'react';
import { Alert, Pressable, Switch, Text, TextInput, View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { ActionButton, Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { activityCatalog } from '@/data/activityCatalog';
import { MiraColors } from '@/constants/theme';
import { useWellness } from '@/hooks/use-wellness';
import { useAuth } from '@/hooks/use-auth';
import { clearAllSakhiLocalData } from '@/services/storage';

export default function ProfileScreen() {
  const router = useRouter();
  const auth = useAuth();
  const {
    data,
    updateProfile,
    toggleFavorite,
    addCycleEntry,
    addMemory,
    removeMemory,
    setNotifications: saveNotifications,
  } = useWellness();

  const [name, setName] = useState(data.profile.name);
  const [age, setAge] = useState(data.profile.age || '');
  const [campusName, setCampusName] = useState(data.profile.campusName || '');
  const [stepGoal, setStepGoal] = useState(String(data.profile.stepGoal));
  const [waterGoal, setWaterGoal] = useState(String(data.profile.waterGoal));
  const [sleepGoal, setSleepGoal] = useState(String(data.profile.sleepGoal));
  const [exerciseGoal, setExerciseGoal] = useState(String(data.profile.exerciseGoal));
  const [studyGoal, setStudyGoal] = useState(String(data.profile.studyGoal));
  const [periodStart, setPeriodStart] = useState('');
  const [notifications, setNotifications] = useState(data.appPreferences.notifications);

  // New Memory Input
  const [memLabel, setMemLabel] = useState('');
  const [memValue, setMemValue] = useState('');
  const [discoveryVisible, setDiscoveryVisible] = useState(data.profile.discoveryVisible);
  const [aiMemoryConsent, setAiMemoryConsent] = useState(data.profile.aiMemoryConsent);
  const [cycleTrackingConsent, setCycleTrackingConsent] = useState(data.profile.cycleTrackingConsent);

  const memoriesList = data.sakhiMemories || data.miraMemories || [];

  const save = () =>
    updateProfile({
      ...data.profile,
      name: name.trim(),
      age,
      campusName: campusName.trim(),
      discoveryVisible,
      aiMemoryConsent,
      cycleTrackingConsent,
      stepGoal: Number(stepGoal) || 8000,
      waterGoal: Number(waterGoal) || 2000,
      sleepGoal: Number(sleepGoal) || 8,
      exerciseGoal: Number(exerciseGoal) || 30,
      studyGoal: Number(studyGoal) || 120,
    });

  const toggleNotifications = (value: boolean) => {
    setNotifications(value);
    saveNotifications(value);
  };

  const handleAddMemory = () => {
    if (!aiMemoryConsent) return;
    if (!memLabel.trim() || !memValue.trim()) return;
    addMemory(memLabel.trim(), memValue.trim());
    setMemLabel('');
    setMemValue('');
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Sign out of Sakhi on this device?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          await auth.signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This permanently deletes your Sakhi account and local data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (auth.configured) await auth.deleteAccount();
              await clearAllSakhiLocalData();
              router.replace(auth.configured ? '/auth' : '/onboarding');
            } catch (error) {
              Alert.alert('Deletion failed', error instanceof Error ? error.message : 'Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <Screen>
      <Header eyebrow="Your Space" title="Profile & Preferences" subtitle="Make Sakhi feel uniquely yours." />

      {/* Avatar Header */}
      <Card tone="rose">
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(name[0] || 'S').toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{name || 'Student'}</Text>
        <Text style={styles.profileCopy}>{campusName} · Verified Campus Student</Text>
      </Card>

      {/* Identity */}
      <SectionTitle title="About You" />
      <Card>
        <Field label="Name" value={name} onChangeText={setName} />
        <Field label="Campus / Institution" value={campusName} onChangeText={setCampusName} />
        <Text style={styles.label}>
          Age <Text style={styles.optional}>(Optional)</Text>
        </Text>
        <TextInput
          value={age}
          onChangeText={setAge}
          keyboardType="number-pad"
          style={styles.input}
        />
      </Card>

      {/* Daily Goals */}
      <SectionTitle title="Your Daily Wellbeing Goals" />
      <Card>
        <GoalField label="Steps Goal" value={stepGoal} onChangeText={setStepGoal} unit="steps" />
        <GoalField label="Hydration Goal" value={waterGoal} onChangeText={setWaterGoal} unit="ml" />
        <GoalField label="Sleep Goal" value={sleepGoal} onChangeText={setSleepGoal} unit="hrs" />
        <GoalField label="Exercise Goal" value={exerciseGoal} onChangeText={setExerciseGoal} unit="mins" />
        <GoalField label="Study Focus Goal" value={studyGoal} onChangeText={setStudyGoal} unit="mins" />
        <ActionButton label="Save Profile Changes" icon="✓" onPress={save} />
      </Card>

      {/* Favorite Activities */}
      <SectionTitle title="Favorite Activities & Hobbies" />
      <Card>
        <Text style={styles.cardCopy}>Selected hobbies appear on your home screen and assist buddy matching.</Text>
        <View style={styles.favoriteGrid}>
          {activityCatalog
            .filter((activity) =>
              ['walking', 'reading', 'music', 'dancing', 'meditation', 'cooking', 'friends', 'selfCare'].includes(
                activity.type
              )
            )
            .map((activity) => {
              const selected = data.profile.favoriteActivities.includes(activity.type);
              return (
                <Pressable
                  key={activity.id}
                  onPress={() => toggleFavorite(activity.type)}
                  style={[styles.favoriteChoice, selected && styles.favoriteSelected]}
                  accessibilityRole="button"
                >
                  <Text style={styles.favoriteChoiceIcon}>{activity.icon}</Text>
                  <Text style={[styles.favoriteChoiceText, selected && styles.favoriteSelectedText]}>
                    {activity.name}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      </Card>

      {/* App Preferences */}
      <SectionTitle title="Preferences" />
      <Card>
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Gentle Notifications</Text>
            <Text style={styles.settingCopy}>Hydration, movement and study break nudges</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={toggleNotifications}
            trackColor={{ false: '#E8DCDD', true: MiraColors.coral }}
            thumbColor={MiraColors.white}
          />
        </View>

        <Text style={styles.label}>Work & Study Rhythm</Text>
        <View style={styles.preferenceRow}>
          {(['balanced', 'focused', 'flexible'] as const).map((preference) => (
            <Pressable
              key={preference}
              onPress={() => updateProfile({ ...data.profile, workPreference: preference })}
              style={[
                styles.preference,
                data.profile.workPreference === preference && styles.preferenceSelected,
              ]}
            >
              <Text
                style={[
                  styles.preferenceText,
                  data.profile.workPreference === preference && styles.preferenceSelectedText,
                ]}
              >
                {preference}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Theme</Text>
            <Text style={styles.settingCopy}>Warm light mode / Charcoal dark mode</Text>
          </View>
          <Text style={styles.themeValue}>System Default</Text>
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Allow Sakhi memory</Text>
            <Text style={styles.settingCopy}>Save preferences only with your explicit consent</Text>
          </View>
          <Switch value={aiMemoryConsent} onValueChange={setAiMemoryConsent} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Optional cycle tracking</Text>
            <Text style={styles.settingCopy}>Private cycle-care entries; never used for diagnosis</Text>
          </View>
          <Switch value={cycleTrackingConsent} onValueChange={setCycleTrackingConsent} />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Buddy discovery</Text>
            <Text style={styles.settingCopy}>Appear in interest-based, non-dating matching</Text>
          </View>
          <Switch value={discoveryVisible} onValueChange={setDiscoveryVisible} />
        </View>
      </Card>

      {/* Optional Cycle Note */}
      <SectionTitle title="Optional Cycle Care" />
      <Card>
        {!cycleTrackingConsent ? (
          <Text style={styles.cardCopy}>Cycle tracking is off. Enable it above to create private cycle-care entries.</Text>
        ) : (
          <>
            <Text style={styles.cardCopy}>
              Only add this context if useful. Sakhi uses it for softer support, never medical diagnosis.
            </Text>
            <TextInput
              value={periodStart}
              onChangeText={setPeriodStart}
              placeholder="Period start date"
              placeholderTextColor={MiraColors.muted}
              style={[styles.input, styles.cycleInput]}
            />
            <ActionButton
              label="Save Cycle Note"
              icon="♡"
              onPress={() => {
                if (periodStart.trim()) {
                  addCycleEntry({ startDate: periodStart.trim(), symptoms: [] });
                  setPeriodStart('');
                }
              }}
              variant="soft"
            />
          </>
        )}
      </Card>

      {/* Sakhi Memory Flow */}
      <SectionTitle title="Sakhi Memory Manager" />
      <Card>
        <Text style={styles.cardCopy}>
          Sakhi remembers explicit preferences you share to customize recommendations. You have full control to view, add, or delete memories.
        </Text>

        {aiMemoryConsent ? (
          <View style={styles.memoryAddBox}>
            <TextInput
              value={memLabel}
              onChangeText={setMemLabel}
              placeholder="Preference name"
              placeholderTextColor={MiraColors.muted}
              style={[styles.input, { marginBottom: 6 }]}
            />
            <TextInput
              value={memValue}
              onChangeText={setMemValue}
              placeholder="Details"
              placeholderTextColor={MiraColors.muted}
              style={styles.input}
            />
            <Pressable onPress={handleAddMemory} style={styles.addMemBtn}>
              <Text style={styles.addMemText}>+ Save Memory to Sakhi</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.cardCopy, { marginTop: 10 }]}>Memory consent is off. Enable it above before saving new memories.</Text>
        )}

        {memoriesList.length === 0 ? (
          <Text style={[styles.cardCopy, { marginTop: 10 }]}>No memories stored yet.</Text>
        ) : (
          memoriesList.map((memory) => (
            <View style={styles.memoryRow} key={memory.id}>
              <View style={styles.memoryCopy}>
                <Text style={styles.memoryLabel}>{memory.label}</Text>
                <Text style={styles.memoryText}>{memory.value}</Text>
              </View>
              <Pressable
                onPress={() => removeMemory(memory.id)}
                accessibilityRole="button"
                accessibilityLabel={`Delete memory ${memory.label}`}
              >
                <Text style={styles.deleteMemory}>✕</Text>
              </Pressable>
            </View>
          ))
        )}
      </Card>

      {/* Navigation & Trust */}
      <SectionTitle title="Trust, Safety & Notifications" />
      <Card>
        <Pressable onPress={() => router.push('/notifications')} style={styles.settingLinkRow}>
          <View>
            <Text style={styles.settingTitle}>Notification Center</Text>
            <Text style={styles.settingCopy}>View recent campus & circle alerts</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Pressable>

        <Pressable onPress={() => router.push('/safety')} style={styles.settingLinkRow}>
          <View>
            <Text style={styles.settingTitle}>Safety & Privacy Center</Text>
            <Text style={styles.settingCopy}>Block list, reports, and privacy controls</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Pressable>

      </Card>

      <SectionTitle title="Account" />
      <Card>
        <Pressable onPress={handleSignOut} accessibilityRole="button" style={styles.settingLinkRow}>
          <View>
            <Text style={styles.settingTitle}>Sign out</Text>
            <Text style={styles.settingCopy}>End this device session</Text>
          </View>
          <Text style={styles.arrowIcon}>→</Text>
        </Pressable>
        <Pressable onPress={handleDeleteAccount} accessibilityRole="button" style={styles.settingLinkRow}>
          <View>
            <Text style={[styles.settingTitle, { color: MiraColors.rose }]}>Delete account</Text>
            <Text style={styles.settingCopy}>Permanently remove account and local Sakhi data</Text>
          </View>
          <Text style={styles.arrowIcon}>×</Text>
        </Pressable>
      </Card>

      <Text style={styles.footer}>Sakhi is a women-first campus life and wellbeing platform.</Text>
    </Screen>
  );
}

function Field({ label, value, onChangeText }: { label: string; value: string; onChangeText: (value: string) => void }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={styles.input} />
    </>
  );
}

function GoalField({
  label,
  value,
  onChangeText,
  unit,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  unit: string;
}) {
  return (
    <View style={styles.goalField}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.goalInput}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="decimal-pad"
          style={styles.goalTextInput}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: MiraColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  avatarText: { color: MiraColors.white, fontSize: 27, fontWeight: '900' },
  profileName: { color: MiraColors.ink, fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 11 },
  profileCopy: { color: MiraColors.muted, fontSize: 12, textAlign: 'center', marginTop: 4 },
  cardCopy: { color: MiraColors.muted, fontSize: 12, lineHeight: 18 },
  label: { color: MiraColors.muted, fontSize: 11, fontWeight: '700', marginBottom: 4, marginTop: 10 },
  optional: { fontWeight: '400' },
  input: {
    backgroundColor: '#FFF9F7',
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: MiraColors.ink,
    fontSize: 12,
  },
  goalField: { marginBottom: 4 },
  goalInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9F7',
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 10,
    paddingRight: 10,
  },
  goalTextInput: { flex: 1, paddingHorizontal: 10, paddingVertical: 8, color: MiraColors.ink, fontSize: 12 },
  unit: { color: MiraColors.muted, fontSize: 11 },
  favoriteGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  favoriteChoice: {
    width: '23%',
    minHeight: 62,
    backgroundColor: '#FFF9F7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MiraColors.line,
    padding: 4,
  },
  favoriteSelected: { backgroundColor: MiraColors.blush, borderColor: MiraColors.coral },
  favoriteChoiceIcon: { fontSize: 18 },
  favoriteChoiceText: { color: MiraColors.muted, fontSize: 9, textAlign: 'center', marginTop: 3 },
  favoriteSelectedText: { color: MiraColors.rose, fontWeight: '800' },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  settingLinkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: MiraColors.line,
  },
  settingTitle: { color: MiraColors.ink, fontSize: 13, fontWeight: '800' },
  settingCopy: { color: MiraColors.muted, fontSize: 11, marginTop: 2, maxWidth: 240 },
  arrowIcon: { color: MiraColors.rose, fontSize: 16, fontWeight: '900' },
  themeValue: { color: MiraColors.rose, fontSize: 12, fontWeight: '800' },
  preferenceRow: { flexDirection: 'row', gap: 6, marginBottom: 6, marginTop: 4 },
  preference: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10, backgroundColor: '#FFF9F7' },
  preferenceSelected: { backgroundColor: MiraColors.blush },
  preferenceText: { color: MiraColors.muted, fontSize: 11 },
  preferenceSelectedText: { color: MiraColors.rose, fontWeight: '800' },
  cycleInput: { marginVertical: 8 },
  memoryAddBox: { marginTop: 10, marginBottom: 8 },
  addMemBtn: {
    backgroundColor: MiraColors.ink,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addMemText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: MiraColors.line,
  },
  memoryCopy: { flex: 1 },
  memoryLabel: { color: MiraColors.ink, fontSize: 12, fontWeight: '800' },
  memoryText: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  deleteMemory: { color: MiraColors.rose, fontSize: 16, paddingHorizontal: 8, fontWeight: '900' },
  footer: {
    color: MiraColors.muted,
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 22,
  },
});
