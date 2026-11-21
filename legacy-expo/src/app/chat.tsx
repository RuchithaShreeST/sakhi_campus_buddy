import { useState } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Screen } from '@/components/sakhi-ui';
import { ReportModal } from '@/components/ui/ReportModal';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ user?: string; name?: string }>();
  const recipientName = params.name ?? 'Sanya Malhotra';
  const { messages, sendDirectMessage } = useCampus();

  const [input, setInput] = useState('');
  const [reportVisible, setReportVisible] = useState(false);

  const conversationMessages = messages.filter((m) => m.conversationId === 'conv-sanya' || m.senderName === recipientName || m.isMe);

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim();
    setInput('');
    sendDirectMessage('conv-sanya', recipientName, text);
  };

  return (
    <Screen scroll={false}>
      {/* Top Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerName}>{recipientName}</Text>
          <Text style={styles.headerSub}>Campus Connection · Mutual Friend</Text>
        </View>
        <Pressable onPress={() => setReportVisible(true)} style={styles.reportIconBtn}>
          <Text style={styles.reportIconText}>⚠️</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.chatContainer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Messages List */}
        <FlatList
          data={conversationMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={[styles.bubbleWrapper, item.isMe ? styles.myWrapper : styles.otherWrapper]}>
              {!item.isMe && <Text style={styles.senderName}>{item.senderName}</Text>}
              <View style={[styles.bubble, item.isMe ? styles.myBubble : styles.otherBubble]}>
                <Text style={[styles.bubbleText, item.isMe && styles.myText]}>{item.text}</Text>
                <Text style={[styles.timestamp, item.isMe && styles.myTimestamp]}>{item.createdAt}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Card tone="lilac" style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>Connected with {recipientName}</Text>
              <Text style={styles.emptySub}>Send a message to start chatting, arrange study sessions, or explore campus together.</Text>
            </Card>
          }
        />

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder={`Message ${recipientName}...`}
            placeholderTextColor={MiraColors.muted}
            style={styles.input}
            onSubmitEditing={handleSend}
          />
          <Pressable onPress={handleSend} style={styles.sendBtn}>
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        targetType="user"
        targetId="conn-sanya"
        targetName={recipientName}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },
  headerTitleBox: { alignItems: 'center' },
  headerName: { color: MiraColors.ink, fontSize: 16, fontWeight: '900' },
  headerSub: { color: MiraColors.muted, fontSize: 11, marginTop: 1 },
  reportIconBtn: { padding: 6 },
  reportIconText: { fontSize: 16 },
  chatContainer: { flex: 1, justifyContent: 'space-between' },
  messageList: { paddingVertical: 14, gap: 10 },
  bubbleWrapper: { maxWidth: '82%', marginBottom: 4 },
  myWrapper: { alignSelf: 'flex-end' },
  otherWrapper: { alignSelf: 'flex-start' },
  senderName: { color: MiraColors.muted, fontSize: 10, fontWeight: '800', marginBottom: 2, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  myBubble: { backgroundColor: '#4F46E5', borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: '#F1F5F9', borderBottomLeftRadius: 4 },
  bubbleText: { color: MiraColors.ink, fontSize: 14, lineHeight: 20 },
  myText: { color: MiraColors.white },
  timestamp: { color: MiraColors.muted, fontSize: 9, textAlign: 'right', marginTop: 4 },
  myTimestamp: { color: 'rgba(255,255,255,0.75)' },
  emptyCard: { padding: 20, alignItems: 'center', marginVertical: 20 },
  emptyTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '900' },
  emptySub: { color: MiraColors.muted, fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  input: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: MiraColors.ink, fontSize: 14 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4F46E5', alignItems: 'center', justifyContent: 'center' },
  sendText: { color: MiraColors.white, fontSize: 20, fontWeight: '900' },
});
