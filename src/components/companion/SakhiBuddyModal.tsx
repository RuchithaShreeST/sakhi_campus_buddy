import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { activityCatalog } from '@/data/activityCatalog';
import { MiraColors } from '@/constants/theme';
import { getRecommendations } from '@/services/wellnessRecommendations';
import { useWellness } from '@/hooks/use-wellness';
import { CompanionMode, Feeling } from '@/types/wellness';
import { ActionButton } from '@/components/sakhi-ui';

const modes: { id: CompanionMode; label: string; icon: string }[] = [
  { id: 'comfort', label: 'I need comfort', icon: '♡' },
  { id: 'calm', label: 'Help me calm down', icon: '○' },
  { id: 'study', label: 'Help me study', icon: '▤' },
  { id: 'work', label: 'Help me work', icon: '▣' },
  { id: 'motivate', label: 'Motivate me', icon: '↗' },
  { id: 'tired', label: "I'm tired", icon: '☾' },
  { id: 'periodCare', label: 'Period / Body care', icon: '♡' },
  { id: 'selfCare', label: 'I need self-care', icon: '✦' },
  { id: 'fun', label: 'I want some fun', icon: '◇' },
  { id: 'talk', label: 'I just want to talk', icon: '…' },
];

const feelings: { id: Feeling; label: string; icon: string }[] = [
  { id: 'stressed', label: 'Stressed', icon: '∿' },
  { id: 'tired', label: 'Tired', icon: '☾' },
  { id: 'overwhelmed', label: 'Overwhelmed', icon: '≋' },
  { id: 'lonely', label: 'Lonely', icon: '○' },
  { id: 'periodCramps', label: 'Period cramps', icon: '♡' },
  { id: 'anxious', label: 'Anxious', icon: '∿' },
  { id: 'mentallyExhausted', label: 'Mentally exhausted', icon: '☾' },
  { id: 'inPain', label: 'In pain', icon: '♡' },
  { id: 'happy', label: 'Happy', icon: '✦' },
  { id: 'calm', label: 'Calm', icon: '◌' },
  { id: 'energetic', label: 'Energetic', icon: '↗' },
  { id: 'other', label: 'Something else', icon: '…' },
];

export function SakhiBuddyModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data, addWater, addFeeling, startActivity, setCompanionState } = useWellness();
  const router = useRouter();
  const [screen, setScreen] = useState<'welcome' | 'mode' | 'feeling' | 'study' | 'recommendation'>('welcome');
  const [feeling, setFeeling] = useState<Feeling>();
  const [mode, setMode] = useState<CompanionMode>();
  const [subject, setSubject] = useState('');
  const [duration, setDuration] = useState(25);
  const [savedFeeling, setSavedFeeling] = useState('');
  const recommendations = feeling ? getRecommendations({ currentFeeling: feeling, timeOfDay: getTimeOfDay(), data }) : [];

  const close = () => {
    setScreen('welcome');
    setFeeling(undefined);
    setMode(undefined);
    setSavedFeeling('');
    onClose();
  };

  const chooseMode = (nextMode: CompanionMode) => {
    setMode(nextMode);
    if (nextMode === 'study' || nextMode === 'work') setScreen('study');
    else setScreen('feeling');
  };

  const chooseFeeling = (nextFeeling: Feeling) => {
    setFeeling(nextFeeling);
    addFeeling(nextFeeling);
    setSavedFeeling(nextFeeling);

    if (nextFeeling === 'lonely') {
      setCompanionState('comforting');
    } else {
      setCompanionState(
        nextFeeling === 'period' || nextFeeling === 'periodCramps'
          ? 'periodCare'
          : nextFeeling === 'tired'
          ? 'tired'
          : nextFeeling === 'stressed' || nextFeeling === 'overwhelmed' || nextFeeling === 'sad' || nextFeeling === 'anxious'
          ? 'comforting'
          : 'happy'
      );
    }
    setScreen('recommendation');
  };

  const startFocus = () => {
    const definition = activityCatalog.find((item) => item.type === (mode === 'study' ? 'studying' : 'working'));
    if (!definition) return;
    startActivity({ ...definition, name: subject.trim() || definition.name });
    close();
  };

  const doRecommendation = (actionType: string, recommendationId: string) => {
    if (actionType === 'water') addWater(250);
    else if (actionType === 'activity') {
      const targetType =
        recommendationId === 'breathing-reset'
          ? 'breathing'
          : recommendationId === 'movement-reset'
          ? 'stretching'
          : recommendationId === 'joy-break'
          ? 'music'
          : recommendationId === 'wind-down'
          ? 'relaxing'
          : 'resting';
      const definition = activityCatalog.find((item) => item.type === targetType);
      if (definition) startActivity(definition);
    } else setCompanionState('calm');
    close();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <View style={styles.sheetTop}>
              <View>
                <Text style={styles.eyebrow}>SAKHI IS HERE</Text>
                <Text style={styles.title}>{screen === 'welcome' ? 'Hey 💗' : screen === 'recommendation' ? 'I hear you.' : 'What do you need?'}</Text>
              </View>
              <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close Sakhi">
                <Text style={styles.close}>×</Text>
              </Pressable>
            </View>

            {screen === 'welcome' && (
              <>
                <Text style={styles.opening}>I&apos;m here.{"\n\n"}What do you need right now?</Text>
                <ActionButton label="Tell Sakhi how you feel" icon="♡" onPress={() => setScreen('feeling')} />
                <Pressable onPress={() => setScreen('mode')} style={styles.secondary}>
                  <Text style={styles.secondaryText}>Choose a focus or support mode</Text>
                </Pressable>
              </>
            )}

            {screen === 'mode' && (
              <>
                <Text style={styles.prompt}>Pick the kind of support you need.</Text>
                <View style={styles.optionGrid}>
                  {modes.map((item) => (
                    <Pressable key={item.id} onPress={() => chooseMode(item.id)} style={styles.option}>
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                      <Text style={styles.optionText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={() => setScreen('feeling')}>
                  <Text style={styles.backText}>Check in your feeling instead</Text>
                </Pressable>
              </>
            )}

            {screen === 'feeling' && (
              <>
                <Text style={styles.prompt}>How are you feeling today?</Text>
                <View style={styles.optionGrid}>
                  {feelings.map((item) => (
                    <Pressable key={item.id} onPress={() => chooseFeeling(item.id)} style={styles.option}>
                      <Text style={styles.optionIcon}>{item.icon}</Text>
                      <Text style={styles.optionText}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            {screen === 'study' && (
              <>
                <Text style={styles.prompt}>What subject or task are we working on?</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder={mode === 'study' ? 'Java, DSA, Biology, Placement resume...' : 'Project report, slides, inbox...'}
                  placeholderTextColor={MiraColors.muted}
                  style={styles.input}
                />
                <Text style={styles.promptSmall}>How long do you want to focus?</Text>
                <View style={styles.durationRow}>
                  {[15, 25, 45, 60].map((value) => (
                    <Pressable key={value} onPress={() => setDuration(value)} style={[styles.duration, duration === value && styles.durationSelected]}>
                      <Text style={[styles.durationText, duration === value && styles.durationTextSelected]}>{value}m</Text>
                    </Pressable>
                  ))}
                </View>
                <ActionButton label={`Start ${mode === 'study' ? 'study' : 'focus'} session`} icon="▶" onPress={startFocus} />
                <Text style={styles.helper}>Sakhi will remind you to take real breaks.</Text>
              </>
            )}

            {screen === 'recommendation' && (
              <>
                <Text style={styles.response}>
                  {savedFeeling === 'periodCramps'
                    ? "Let's make today a little gentler. If pain is severe or worsening, please consult a medical professional."
                    : savedFeeling === 'lonely'
                    ? "I am here with you. If you want to connect with people on campus who share your interests, explore Circle."
                    : savedFeeling === 'tired' || savedFeeling === 'mentallyExhausted'
                    ? 'You look like you could use a little extra care. Let’s slow down.'
                    : 'Thank you for telling me. We can take the next step together.'}
                </Text>

                {savedFeeling === 'lonely' && (
                  <View style={styles.socialBridgeCard}>
                    <Text style={styles.socialBridgeTitle}>Connect on Circle</Text>
                    <Text style={styles.socialBridgeBody}>Discover study buddies, clubs, or students with matching interests on campus.</Text>
                    <Pressable
                      style={styles.socialBridgeBtn}
                      onPress={() => {
                        close();
                        router.push('/circle');
                      }}>
                      <Text style={styles.socialBridgeBtnText}>Explore Circle People</Text>
                    </Pressable>
                  </View>
                )}

                {recommendations.map((item) => (
                  <View style={styles.recommendation} key={item.id}>
                    <View style={styles.recommendationIcon}>
                      <Text>{item.icon}</Text>
                    </View>
                    <View style={styles.recommendationCopy}>
                      <Text style={styles.recommendationTitle}>{item.title}</Text>
                      <Text style={styles.recommendationBody}>{item.description}</Text>
                      <Text style={styles.recommendationMeta}>
                        {item.duration} min · {item.category}
                      </Text>
                    </View>
                    <Pressable onPress={() => doRecommendation(item.actionType, item.id)} style={styles.start}>
                      <Text style={styles.startText}>{item.actionType === 'water' ? 'Add' : 'Start'}</Text>
                    </Pressable>
                  </View>
                ))}
                <Pressable onPress={close} style={styles.secondary}>
                  <Text style={styles.secondaryText}>I just needed to be heard</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** @deprecated Legacy alias */
export const MiraBuddyModal = SakhiBuddyModal;

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,41,50,0.38)' },
  sheet: { maxHeight: '92%', backgroundColor: MiraColors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  content: { padding: 22, paddingBottom: 34 },
  sheetTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  eyebrow: { color: '#6366F1', fontSize: 10, fontWeight: '900', letterSpacing: 1.3, marginBottom: 7 },
  title: { color: MiraColors.ink, fontSize: 28, fontWeight: '900' },
  close: { color: MiraColors.muted, fontSize: 28, lineHeight: 28 },
  opening: { color: MiraColors.ink, fontSize: 20, lineHeight: 29, fontWeight: '700', marginVertical: 30 },
  prompt: { color: MiraColors.muted, fontSize: 15, lineHeight: 21, marginVertical: 18 },
  promptSmall: { color: MiraColors.muted, fontSize: 13, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 18 },
  option: { width: '31%', minHeight: 72, borderRadius: 16, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: MiraColors.line, padding: 10, justifyContent: 'center' },
  optionIcon: { color: '#6366F1', fontSize: 20, fontWeight: '900' },
  optionText: { color: MiraColors.ink, fontSize: 11, fontWeight: '800', marginTop: 5 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: MiraColors.line, borderRadius: 14, padding: 13, color: MiraColors.ink, fontSize: 14 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  duration: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 13 },
  durationSelected: { backgroundColor: '#EEF2FF' },
  durationText: { color: MiraColors.muted, fontWeight: '800' },
  durationTextSelected: { color: '#4F46E5' },
  helper: { color: MiraColors.muted, textAlign: 'center', fontSize: 11, marginTop: 13 },
  secondary: { paddingVertical: 16, alignItems: 'center' },
  secondaryText: { color: '#6366F1', fontSize: 13, fontWeight: '800' },
  backText: { color: '#6366F1', fontSize: 13, fontWeight: '800', textAlign: 'center', padding: 12 },
  response: { color: MiraColors.ink, fontSize: 18, lineHeight: 26, fontWeight: '800', marginVertical: 18 },
  socialBridgeCard: { backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#C7D2FE' },
  socialBridgeTitle: { color: '#312E81', fontSize: 15, fontWeight: '900' },
  socialBridgeBody: { color: '#4338CA', fontSize: 12, lineHeight: 18, marginTop: 4 },
  socialBridgeBtn: { marginTop: 12, backgroundColor: '#4F46E5', borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  socialBridgeBtnText: { color: MiraColors.white, fontSize: 12, fontWeight: '900' },
  recommendation: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: MiraColors.line, borderRadius: 17, padding: 12, marginBottom: 9 },
  recommendationIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  recommendationCopy: { flex: 1, marginHorizontal: 10 },
  recommendationTitle: { color: MiraColors.ink, fontSize: 13, fontWeight: '900' },
  recommendationBody: { color: MiraColors.muted, fontSize: 11, lineHeight: 16, marginTop: 2 },
  recommendationMeta: { color: '#6366F1', fontSize: 10, fontWeight: '800', marginTop: 4 },
  start: { backgroundColor: '#4F46E5', borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 },
  startText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
});


