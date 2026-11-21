import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MiraColors } from '@/constants/theme';
import { SafetyReport } from '@/types/campus';
import { useCampus } from '@/hooks/use-campus';

const reasons: { id: SafetyReport['reason']; label: string; desc: string }[] = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Targeted attacks, insults, or unwelcome behavior' },
  { id: 'spam', label: 'Spam or Commercial Post', desc: 'Repeated unwanted links, ads, or automated text' },
  { id: 'scam', label: 'Scam or Fraud', desc: 'Misleading financial requests or suspicious offers' },
  { id: 'impersonation', label: 'Impersonation', desc: 'Pretending to be someone else or institution' },
  { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Nudity, sexual content, or graphic material' },
  { id: 'threat', label: 'Safety Threat or Violence', desc: 'Threats of harm, violence, or dangerous activity' },
  { id: 'misinformation', label: 'False Information', desc: 'Harmful rumors or unverified official notices' },
  { id: 'other', label: 'Other Concern', desc: 'Any other violation of Sakhi community guidelines' },
];

export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
  onSubmitReport,
}: {
  visible: boolean;
  onClose: () => void;
  targetType: SafetyReport['targetType'];
  targetId: string;
  targetName?: string;
  onSubmitReport?: (targetId: string, type: any, reason: any, details?: string) => void;
}) {
  const { submitReport, blockUser } = useCampus();
  const [selectedReason, setSelectedReason] = useState<SafetyReport['reason']>('harassment');
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (onSubmitReport) {
      onSubmitReport(targetId, targetType, selectedReason, details);
    } else {
      submitReport(targetId, targetType, selectedReason, details);
    }
    if (targetType === 'user') {
      blockUser(targetId);
    }
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDetails('');
      onClose();
    }, 1400);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successIcon}>✓</Text>
              <Text style={styles.successTitle}>Report Submitted</Text>
              <Text style={styles.successSub}>Thank you for keeping the Sakhi community safe and supportive.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <Text style={styles.title}>Report {targetType}</Text>
                <Pressable onPress={onClose}>
                  <Text style={styles.close}>×</Text>
                </Pressable>
              </View>
              {targetName && <Text style={styles.targetLabel}>Target: {targetName}</Text>}
              <Text style={styles.subtitle}>Select the primary reason for reporting:</Text>

              <View style={styles.reasonsList}>
                {reasons.map((item) => (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedReason(item.id)}
                    style={[styles.reasonItem, selectedReason === item.id && styles.reasonSelected]}>
                    <Text style={[styles.reasonLabel, selectedReason === item.id && styles.reasonLabelSelected]}>{item.label}</Text>
                    <Text style={styles.reasonDesc}>{item.desc}</Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.inputLabel}>Additional Details (Optional):</Text>
              <TextInput
                value={details}
                onChangeText={setDetails}
                placeholder="Explain context or specific details..."
                placeholderTextColor={MiraColors.muted}
                style={styles.input}
                multiline
                maxLength={300}
              />

              <View style={styles.btnRow}>
                <Pressable style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.submitBtn} onPress={handleSubmit}>
                  <Text style={styles.submitText}>Submit Report</Text>
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: MiraColors.white, borderRadius: 24, padding: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: MiraColors.ink, fontSize: 20, fontWeight: '900' },
  close: { color: MiraColors.muted, fontSize: 24, paddingHorizontal: 6 },
  targetLabel: { color: '#6366F1', fontSize: 12, fontWeight: '800', marginTop: 4 },
  subtitle: { color: MiraColors.muted, fontSize: 13, marginVertical: 12 },
  reasonsList: { gap: 8, marginBottom: 16 },
  reasonItem: { padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  reasonSelected: { borderColor: '#6366F1', backgroundColor: '#EEF2FF' },
  reasonLabel: { color: MiraColors.ink, fontSize: 13, fontWeight: '800' },
  reasonLabelSelected: { color: '#4F46E5' },
  reasonDesc: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  inputLabel: { color: MiraColors.ink, fontSize: 12, fontWeight: '800', marginBottom: 6 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, color: MiraColors.ink, fontSize: 13, minHeight: 64 },
  btnRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  cancelText: { color: MiraColors.muted, fontWeight: '800', fontSize: 13 },
  submitBtn: { flex: 1.4, paddingVertical: 12, borderRadius: 14, backgroundColor: '#EF4444', alignItems: 'center' },
  submitText: { color: MiraColors.white, fontWeight: '900', fontSize: 13 },
  successBox: { alignItems: 'center', paddingVertical: 32 },
  successIcon: { fontSize: 42, color: '#10B981', marginBottom: 12 },
  successTitle: { color: MiraColors.ink, fontSize: 22, fontWeight: '900' },
  successSub: { color: MiraColors.muted, fontSize: 13, textAlign: 'center', marginTop: 6, paddingHorizontal: 20 },
});
