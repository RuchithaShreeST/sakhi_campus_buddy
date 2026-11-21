import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Companion } from '@/components/companion/Companion';
import { activityCatalog } from '@/data/activityCatalog';
import { MiraColors } from '@/constants/theme';
import { useSakhiChat } from '@/hooks/use-sakhi-chat';
import { useWellness } from '@/hooks/use-wellness';
import { SakhiChatMessage, SakhiAction } from '@/services/ai/aiTypes';

const quickReplies = [
  'I’m stressed',
  'I need a study partner',
  'What clubs are there?',
  'Help me with placements',
  'I don’t know anyone here',
  'Help me calm down',
];

export function SakhiChatModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { conversation, typing, source, send, clear } = useSakhiChat();
  const { addWater, startActivity, pauseActivity, setCompanionState } = useWellness();
  const router = useRouter();
  const [input, setInput] = useState('');
  const lastState = conversation.messages.findLast((message: SakhiChatMessage) => message.role === 'sakhi' || message.role === 'mira')?.metadata?.companionState ?? 'idle';

  const submit = async (value = input) => {
    if (!value.trim()) return;
    setInput('');
    await send(value);
  };

  const performAction = (type: string) => {
    onClose();
    if (type === 'ADD_WATER') addWater(250);
    else if (type === 'START_BREATHING') startCatalogActivity('breathing');
    else if (type === 'START_FOCUS') startCatalogActivity('studying');
    else if (type === 'OPEN_WELLNESS') router.push('/wellness');
    else if (type === 'OPEN_CAMPUS') router.push('/campus');
    else if (type === 'OPEN_CIRCLE' || type === 'FIND_PEOPLE') router.push('/circle');
    else if (type === 'OPEN_CLUBS' || type === 'FIND_CLUB') router.push('/clubs');
    else if (type === 'OPEN_EVENTS') router.push('/events');
    else if (type === 'OPEN_PLACEMENTS') router.push('/placements');
    else if (type === 'OPEN_PLANNER') router.push('/planner');
    else if (type === 'OPEN_ACTIVITY_PICKER') router.push('/activity');
    else if (type === 'OPEN_SLEEP') router.push('/sleep');
    else if (type === 'VIEW_PROGRESS') router.push('/progress');
    else if (type === 'TAKE_BREAK') {
      pauseActivity();
      setCompanionState('calm');
    } else if (type === 'REST') setCompanionState('needsRest');
  };

  const startCatalogActivity = (type: 'breathing' | 'studying') => {
    const activity = activityCatalog.find((item) => item.type === type);
    if (activity) startActivity(activity);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={styles.headerCharacter}>
              <Companion state={lastState} compact />
            </View>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>SAKHI</Text>
              <Text style={styles.title}>Your campus companion</Text>
              <Text style={styles.status}>{source === 'ai' ? 'Connected thoughtfully' : 'Here with you offline'}</Text>
            </View>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close Sakhi chat">
              <Text style={styles.close}>×</Text>
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
            {conversation.messages.length === 0 && (
              <View style={styles.welcome}>
                <Text style={styles.welcomeTitle}>Hey 💗</Text>
                <Text style={styles.welcomeBody}>I&apos;m here. Tell me what you need right now—study, clubs, career, or just talking.</Text>
              </View>
            )}
            {conversation.messages.map((message: SakhiChatMessage) => (
              <View key={message.id} style={[styles.message, message.role === 'user' ? styles.userMessage : styles.miraMessage]}>
                <Text style={[styles.messageText, message.role === 'user' && styles.userText]}>{message.text}</Text>
                {(message.role === 'sakhi' || message.role === 'mira') && message.metadata?.actions?.length ? (
                  <View style={styles.messageActions}>
                    {message.metadata.actions.map((action: SakhiAction) => (
                      <Pressable key={action.type} onPress={() => performAction(action.type)} style={styles.actionChip} accessibilityRole="button" accessibilityLabel={action.label}>
                        <Text style={styles.actionChipText}>{action.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
            {typing && (
              <View style={[styles.message, styles.miraMessage]}>
                <Text style={styles.typing}>•  •  •</Text>
              </View>
            )}
          </ScrollView>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickReplies}>
            {quickReplies.map((reply) => (
              <Pressable key={reply} onPress={() => void submit(reply)} style={styles.quickReply}>
                <Text style={styles.quickReplyText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.composer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => void submit()}
              placeholder="Talk to Sakhi..."
              placeholderTextColor={MiraColors.muted}
              style={styles.input}
              multiline
              maxLength={500}
              accessibilityLabel="Message Sakhi"
            />
            <Pressable onPress={() => void submit()} style={styles.send} accessibilityRole="button" accessibilityLabel="Send message">
              <Text style={styles.sendText}>↑</Text>
            </Pressable>
          </View>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Sakhi is a virtual companion, not a medical professional.</Text>
            <Pressable onPress={clear} accessibilityRole="button" accessibilityLabel="Clear conversation">
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/** @deprecated Legacy alias */
export const MiraChatModal = SakhiChatModal;


const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(45,41,50,0.4)' },
  sheet: { height: '92%', backgroundColor: MiraColors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: MiraColors.line },
  headerCharacter: { width: 62, height: 62, overflow: 'hidden', justifyContent: 'flex-end' }, headerCopy: { flex: 1, marginLeft: 8 },
  eyebrow: { color: MiraColors.rose, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 }, title: { color: MiraColors.ink, fontSize: 16, fontWeight: '900', marginTop: 2 }, status: { color: MiraColors.muted, fontSize: 11, marginTop: 3 }, close: { color: MiraColors.muted, fontSize: 27 },
  messages: { padding: 18, paddingBottom: 10, flexGrow: 1, justifyContent: 'flex-start' }, welcome: { backgroundColor: MiraColors.blush, borderRadius: 20, padding: 17, marginBottom: 14 }, welcomeTitle: { color: MiraColors.ink, fontSize: 23, fontWeight: '900' }, welcomeBody: { color: MiraColors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  message: { maxWidth: '84%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 10 }, userMessage: { alignSelf: 'flex-end', backgroundColor: MiraColors.coral, borderBottomRightRadius: 5 }, miraMessage: { alignSelf: 'flex-start', backgroundColor: '#F7F1F0', borderBottomLeftRadius: 5 }, messageText: { color: MiraColors.ink, fontSize: 14, lineHeight: 21 }, userText: { color: MiraColors.white },
  messageActions: { gap: 6, marginTop: 10 }, actionChip: { alignSelf: 'flex-start', backgroundColor: MiraColors.blush, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 }, actionChipText: { color: MiraColors.rose, fontSize: 11, fontWeight: '900' }, typing: { color: MiraColors.rose, fontWeight: '900', letterSpacing: 2 },
  quickReplies: { paddingHorizontal: 18, paddingVertical: 8, gap: 8 }, quickReply: { borderWidth: 1, borderColor: MiraColors.line, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 }, quickReplyText: { color: MiraColors.rose, fontSize: 11, fontWeight: '800' },
  composer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderTopWidth: 1, borderTopColor: MiraColors.line }, input: { flex: 1, maxHeight: 90, backgroundColor: '#FFF9F7', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11, color: MiraColors.ink, fontSize: 14 }, send: { width: 43, height: 43, borderRadius: 22, backgroundColor: MiraColors.coral, alignItems: 'center', justifyContent: 'center' }, sendText: { color: MiraColors.white, fontSize: 23, fontWeight: '900' }, footer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12 }, footerText: { color: MiraColors.muted, fontSize: 9 }, clearText: { color: MiraColors.rose, fontSize: 10, fontWeight: '800' },
});
