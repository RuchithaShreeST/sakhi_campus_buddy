import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import { Companion } from '@/components/companion/Companion';
import { ActionButton, Card, Screen } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useWellness } from '@/hooks/use-wellness';

const interestOptions = ['AI/ML', 'Coding', 'Dance', 'Painting', 'Music', 'Books', 'Fitness', 'Travel', 'Self-care', 'Career'];
const goalOptions = ['Study consistently', 'Improve placement prep', 'Feel less stressed', 'Build friendships', 'Stay active', 'Sleep better'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { data, updateProfile } = useWellness();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(data.profile.name);
  const [pronouns, setPronouns] = useState(data.profile.pronouns ?? '');
  const [campusName, setCampusName] = useState(data.profile.campusName ?? '');
  const [course, setCourse] = useState(data.profile.course ?? '');
  const [year, setYear] = useState(data.profile.year ?? '');
  const [interests, setInterests] = useState(data.profile.interests);
  const [goals, setGoals] = useState(data.profile.goals ?? []);
  const [aiMemoryConsent, setAiMemoryConsent] = useState(data.profile.aiMemoryConsent);
  const [cycleTrackingConsent, setCycleTrackingConsent] = useState(data.profile.cycleTrackingConsent);
  const [discoveryVisible, setDiscoveryVisible] = useState(data.profile.discoveryVisible);
  const [error, setError] = useState('');

  const steps = [
    { title: 'Make this space yours', subtitle: 'Tell Sakhi the name you want to use.' },
    { title: 'Campus identity', subtitle: 'Add your campus and academic details.' },
    { title: 'What interests you?', subtitle: 'Choose interests for clubs and buddy matching.' },
    { title: 'What matters right now?', subtitle: 'Select the goals Sakhi should keep in mind.' },
    { title: 'AI memory consent', subtitle: 'Choose whether Sakhi may remember preferences you explicitly save.' },
    { title: 'Optional cycle tracking', subtitle: 'Choose whether to enable private cycle-care tracking.' },
    { title: 'Discovery & privacy', subtitle: 'Control whether others can discover you for non-dating buddy matching.' },
  ];

  const toggle = (value: string, values: string[], setter: (next: string[]) => void) => {
    setter(values.includes(value) ? values.filter((item) => item !== value) : [...values, value]);
  };

  const validate = () => {
    if (step === 0 && !name.trim()) return 'Please enter the name you want Sakhi to use.';
    if (step === 1 && (!campusName.trim() || !course.trim() || !year.trim())) {
      return 'Please enter your campus, course, and year.';
    }
    if (step === 2 && interests.length === 0) return 'Choose at least one interest.';
    if (step === 3 && goals.length === 0) return 'Choose at least one goal.';
    return '';
  };

  const next = () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    updateProfile({
      ...data.profile,
      name: name.trim(),
      pronouns: pronouns.trim() || undefined,
      campusName: campusName.trim(),
      course: course.trim(),
      year: year.trim(),
      interests,
      goals,
      lookingFor: discoveryVisible ? ['Looking for study partners', 'Looking for friends'] : [],
      discoveryVisible,
      aiMemoryConsent,
      cycleTrackingConsent,
      onboardingCompleted: true,
    });
    router.replace('/');
  };

  const current = steps[step];

  const skipOnboarding = () => {
    updateProfile({
      ...data.profile,
      onboardingCompleted: true,
    });
    router.replace('/');
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.stepText}>Step {step + 1} of {steps.length}</Text>
        <Pressable onPress={skipOnboarding} accessibilityRole="button" style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.avatarContainer}>
        <Companion state={step === 4 ? 'happy' : step === 5 ? 'periodCare' : 'celebrating'} />
      </View>

      <Card tone="lilac" style={styles.card}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {step === 0 && (
          <View style={styles.form}>
            <Text style={styles.label}>Name</Text>
            <TextInput value={name} onChangeText={setName} placeholder="Your name" style={styles.input} />
            <Text style={styles.label}>Pronouns <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput value={pronouns} onChangeText={setPronouns} placeholder="e.g. she/her, they/them" style={styles.input} />
          </View>
        )}

        {step === 1 && (
          <View style={styles.form}>
            <Text style={styles.label}>Campus / Institution</Text>
            <TextInput value={campusName} onChangeText={setCampusName} placeholder="Enter your campus name" style={styles.input} />
            <Text style={styles.label}>Course</Text>
            <TextInput value={course} onChangeText={setCourse} placeholder="e.g. B.Tech Computer Science" style={styles.input} />
            <Text style={styles.label}>Year</Text>
            <TextInput value={year} onChangeText={setYear} placeholder="e.g. 2nd Year" style={styles.input} />
          </View>
        )}

        {step === 2 && (
          <View style={styles.chips}>
            {interestOptions.map((item) => (
              <Pressable key={item} onPress={() => toggle(item, interests, setInterests)} style={[styles.chip, interests.includes(item) && styles.activeChip]}>
                <Text style={[styles.chipText, interests.includes(item) && styles.activeChipText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 3 && (
          <View style={styles.chips}>
            {goalOptions.map((item) => (
              <Pressable key={item} onPress={() => toggle(item, goals, setGoals)} style={[styles.chip, goals.includes(item) && styles.activeChip]}>
                <Text style={[styles.chipText, goals.includes(item) && styles.activeChipText]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {step === 4 && (
          <View style={styles.consentRow}>
            <View style={styles.consentCopy}>
              <Text style={styles.settingTitle}>Allow Sakhi memory</Text>
              <Text style={styles.settingCopy}>You can view, edit, or delete every saved memory later.</Text>
            </View>
            <Switch value={aiMemoryConsent} onValueChange={setAiMemoryConsent} />
          </View>
        )}

        {step === 5 && (
          <View style={styles.consentRow}>
            <View style={styles.consentCopy}>
              <Text style={styles.settingTitle}>Enable cycle care</Text>
              <Text style={styles.settingCopy}>Optional private tracking. Sakhi will never diagnose or prescribe medication.</Text>
            </View>
            <Switch value={cycleTrackingConsent} onValueChange={setCycleTrackingConsent} />
          </View>
        )}

        {step === 6 && (
          <View style={styles.consentRow}>
            <View style={styles.consentCopy}>
              <Text style={styles.settingTitle}>Allow buddy discovery</Text>
              <Text style={styles.settingCopy}>Your profile can appear for interest-based, non-dating study and friend matching.</Text>
            </View>
            <Switch value={discoveryVisible} onValueChange={setDiscoveryVisible} />
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Card>

      <View style={styles.footer}>
        {step > 0 && (
          <Pressable onPress={() => setStep((current) => current - 1)} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </Pressable>
        )}
        <ActionButton label={step === steps.length - 1 ? 'Finish setup' : 'Continue'} icon="→" onPress={next} style={{ flex: 1 }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  stepText: { color: MiraColors.rose, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  skipButton: { minHeight: 44, justifyContent: 'center' },
  skipText: { color: MiraColors.muted, fontSize: 13, fontWeight: '700' },
  avatarContainer: { height: 180, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 22, alignItems: 'center' },
  title: { color: MiraColors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: MiraColors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  form: { width: '100%', marginTop: 14 },
  label: { color: MiraColors.muted, fontSize: 11, fontWeight: '800', marginTop: 10, marginBottom: 5 },
  optional: { fontWeight: '400' },
  input: { backgroundColor: MiraColors.white, borderWidth: 1, borderColor: MiraColors.line, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, color: MiraColors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 12, backgroundColor: MiraColors.white, borderWidth: 1, borderColor: MiraColors.line },
  activeChip: { backgroundColor: MiraColors.rose, borderColor: MiraColors.rose },
  chipText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  activeChipText: { color: MiraColors.white },
  consentRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 18 },
  consentCopy: { flex: 1, paddingRight: 12 },
  settingTitle: { color: MiraColors.ink, fontSize: 13, fontWeight: '900' },
  settingCopy: { color: MiraColors.muted, fontSize: 11, lineHeight: 17, marginTop: 4 },
  error: { color: MiraColors.rose, fontSize: 12, textAlign: 'center', marginTop: 12 },
  footer: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 'auto', paddingTop: 20 },
  backButton: { minHeight: 44, minWidth: 70, justifyContent: 'center', alignItems: 'center' },
  backText: { color: MiraColors.muted, fontSize: 13, fontWeight: '800' },
});
