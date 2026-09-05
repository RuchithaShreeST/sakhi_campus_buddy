import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Companion } from '@/components/companion/Companion';
import { ActionButton, Card, Screen } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useWellness } from '@/hooks/use-wellness';

const onboardingSteps = [
  { step: 1, title: 'Meet Sakhi', subtitle: 'Your personal AI companion for campus life, wellbeing, and growth.' },
  { step: 2, title: 'What can Sakhi help with?', subtitle: 'Study timers, period care, placement prep, clubs, campus events & making friends.' },
  { step: 3, title: 'Personal Wellbeing', subtitle: 'Track sleep, water, mood, movement, and period symptoms with zero judgment.' },
  { step: 4, title: 'Study & Work Focus', subtitle: 'Stay on track with customizable focus sessions and friendly break reminders.' },
  { step: 5, title: 'Campus Career & Placements', subtitle: 'Peer discussions, aptitude practice, and verified company placement drives.' },
  { step: 6, title: 'Clubs & Hobbies', subtitle: 'Dance, AI/ML, literature, painting, music, and sports clubs on campus.' },
  { step: 7, title: 'Women-First Social Circle', subtitle: 'Discover people who share your specific interests without dating swipes or noise.' },
  { step: 8, title: 'Select Your Interests', subtitle: 'Personalize your campus discovery with topics you care about.' },
  { step: 9, title: 'Campus & Privacy', subtitle: 'Your private health and chat data stays strictly protected and safe.' },
  { step: 10, title: 'All Ready!', subtitle: 'Your campus is about to feel a little smaller. Welcome to Sakhi.' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { updateProfile } = useWellness();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Coding', 'Dance', 'AI/ML']);

  const current = onboardingSteps[currentStep];

  const toggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest]
    );
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      updateProfile({
        name: 'Ruchitha',
        interests: selectedInterests,
        lookingFor: ['Looking for study partners', 'Looking for friends'],
        stepGoal: 8000,
        waterGoal: 2000,
        sleepGoal: 8,
        exerciseGoal: 30,
        studyGoal: 120,
        workPreference: 'balanced',
        favoriteActivities: ['studying', 'walking', 'meditation'],
        themePreference: 'system',
      });
      router.replace('/');
    }
  };

  return (
    <Screen>
      <View style={styles.topRow}>
        <Text style={styles.stepText}>Step {current.step} of 10</Text>
        <Pressable onPress={() => router.replace('/')}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      <View style={styles.avatarContainer}>
        <Companion state={currentStep === 0 || currentStep === 9 ? 'celebrating' : currentStep === 2 ? 'periodCare' : 'happy'} />
      </View>

      <Card tone="lilac" style={styles.card}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>

        {currentStep === 7 && (
          <View style={styles.interestsGrid}>
            {['AI/ML', 'Coding', 'Dance', 'Painting', 'Music', 'Books', 'Fitness', 'Travel', 'Self-care', 'Career'].map((item) => (
              <Pressable
                key={item}
                onPress={() => toggleInterest(item)}
                style={[styles.interestChip, selectedInterests.includes(item) && styles.interestChipActive]}>
                <Text style={[styles.interestChipText, selectedInterests.includes(item) && styles.interestChipTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Card>

      <View style={styles.footer}>
        <ActionButton label={currentStep === onboardingSteps.length - 1 ? 'Get Started ✨' : 'Continue'} icon="→" onPress={handleNext} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  stepText: { color: '#6366F1', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  skipText: { color: MiraColors.muted, fontSize: 13, fontWeight: '700' },
  avatarContainer: { height: 220, alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  card: { padding: 22, marginVertical: 10, alignItems: 'center' },
  title: { color: MiraColors.ink, fontSize: 22, fontWeight: '900', textAlign: 'center' },
  subtitle: { color: MiraColors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8 },
  interestsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16, justifyContent: 'center' },
  interestChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F1F5F9' },
  interestChipActive: { backgroundColor: '#4F46E5' },
  interestChipText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  interestChipTextActive: { color: MiraColors.white },
  footer: { marginTop: 'auto', paddingTop: 20 },
});
