import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, Card, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useWellness } from '@/hooks/use-wellness';
import { PlannerItem } from '@/types/wellness';

export default function PlannerScreen() {
  const router = useRouter();
  useWellness();
  const [plannerItems, setPlannerItems] = useState<PlannerItem[]>([
    { id: '1', title: 'Java Microservices Lecture', category: 'Class', dateKey: 'Today', startTime: '09:30 AM', durationMinutes: 60, done: true },
    { id: '2', title: 'Placement DSA Practice - Trees', category: 'Productivity', dateKey: 'Today', startTime: '02:00 PM', durationMinutes: 45, done: false },
    { id: '3', title: 'Rhythm Dance Club Practice', category: 'Club', dateKey: 'Today', startTime: '04:30 PM', durationMinutes: 60, done: false },
    { id: '4', title: 'Evening Hydration & Rest Reset', category: 'Wellness', dateKey: 'Today', startTime: '07:00 PM', durationMinutes: 20, done: false },
  ]);

  const [newItemTitle, setNewItemTitle] = useState('');
  const [category, setCategory] = useState<PlannerItem['category']>('Productivity');

  const toggleDone = (id: string) => {
    setPlannerItems((current) =>
      current.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const addItem = () => {
    if (!newItemTitle.trim()) return;
    const newItem: PlannerItem = {
      id: `plan-${Date.now()}`,
      title: newItemTitle.trim(),
      category,
      dateKey: 'Today',
      startTime: 'Flexible',
      done: false,
    };
    setPlannerItems((current) => [...current, newItem]);
    setNewItemTitle('');
  };

  return (
    <Screen>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Daily Planner</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Sakhi Hero */}
      <Card tone="lilac" style={styles.heroCard}>
        <Text style={styles.heroEyebrow}>SAKHI BALANCED SCHEDULER</Text>
        <Text style={styles.heroTitle}>Keep your day human-sized & balanced.</Text>
        <Text style={styles.heroSub}>
          Combine classes, study, clubs, placement prep, and rest without over-scheduling yourself.
        </Text>
      </Card>

      {/* Add Planner Item */}
      <Card tone="white" style={styles.addCard}>
        <Text style={styles.addTitle}>Add to Today&apos;s Schedule</Text>
        <TextInput
          value={newItemTitle}
          onChangeText={setNewItemTitle}
          placeholder="e.g. Java study session, Dance club, 2L water goal..."
          placeholderTextColor={MiraColors.muted}
          style={styles.input}
        />
        <View style={styles.catRow}>
          {(['Class', 'Productivity', 'Club', 'Event', 'Wellness', 'Self Care'] as PlannerItem['category'][]).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.catChip, category === cat && styles.catChipActive]}>
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </View>
        <ActionButton label="Add Schedule Item" icon="+" onPress={addItem} />
      </Card>

      {/* Today's Timeline */}
      <SectionTitle title="Today's Schedule" />

      <FlatList
        data={plannerItems}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <Pressable onPress={() => toggleDone(item.id)}>
            <Card tone="white" style={[styles.itemCard, item.done && styles.itemDoneCard]}>
              <View style={styles.itemRow}>
                <View style={[styles.checkCircle, item.done && styles.checkCircleDone]}>
                  <Text style={styles.checkText}>{item.done ? '✓' : ''}</Text>
                </View>

                <View style={styles.itemCopy}>
                  <Text style={[styles.itemTitle, item.done && styles.itemTitleDone]}>{item.title}</Text>
                  <Text style={styles.itemMeta}>
                    {item.startTime} · {item.category}
                  </Text>
                </View>
              </View>
            </Card>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },
  headerTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  heroCard: { padding: 16, marginBottom: 14 },
  heroEyebrow: { color: '#6366F1', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: MiraColors.ink, fontSize: 17, fontWeight: '900', marginTop: 4 },
  heroSub: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  addCard: { padding: 16, marginBottom: 16 },
  addTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '900', marginBottom: 10 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, color: MiraColors.ink, fontSize: 13, marginBottom: 10 },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  catChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#F1F5F9' },
  catChipActive: { backgroundColor: '#4F46E5' },
  catText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  catTextActive: { color: MiraColors.white },
  itemCard: { marginBottom: 10, padding: 14 },
  itemDoneCard: { opacity: 0.65, backgroundColor: '#F8FAFC' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkCircleDone: { backgroundColor: '#10B981', borderColor: '#10B981' },
  checkText: { color: MiraColors.white, fontSize: 12, fontWeight: '900' },
  itemCopy: { flex: 1 },
  itemTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '800' },
  itemTitleDone: { textDecorationLine: 'line-through', color: MiraColors.muted },
  itemMeta: { color: '#6366F1', fontSize: 11, fontWeight: '700', marginTop: 2 },
});
