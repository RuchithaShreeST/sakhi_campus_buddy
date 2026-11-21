import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

type EventFilter = 'all' | 'today' | 'registered' | 'saved';

export default function EventsScreen() {
  const router = useRouter();
  const { campus, toggleEvent, toggleRegisterEvent } = useCampus();
  const [filter, setFilter] = useState<EventFilter>('all');

  const filteredEvents = campus.events.filter((item) => {
    if (filter === 'registered') return item.registered;
    if (filter === 'saved') return item.saved;
    if (filter === 'today') return item.date.toLowerCase().includes('today') || item.date.toLowerCase().includes('sep 12');
    return true;
  });

  return (
    <Screen>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Campus Events & Fest</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Hero */}
      <Card tone="rose" style={styles.heroCard}>
        <Text style={styles.heroTitle}>What&apos;s happening this week on campus</Text>
        <Text style={styles.heroSub}>
          Workshops, tech hackathons, dance auditions, career panels, and social gatherings.
        </Text>
      </Card>

      {/* Filters */}
      <View style={styles.filterRow}>
        {(['all', 'today', 'registered', 'saved'] as EventFilter[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.chip, filter === tab && styles.chipActive]}>
            <Text style={[styles.chipText, filter === tab && styles.chipTextActive]}>
              {tab === 'all' ? 'All Events' : tab === 'today' ? 'Today' : tab === 'registered' ? 'Registered' : 'Saved'}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Upcoming Schedule" />

      {filteredEvents.length === 0 ? (
        <Card tone="white" style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Nothing scheduled yet</Text>
          <Text style={styles.emptySub}>Save or register for events to see them here.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredEvents}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card tone="white" style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{item.date}</Text>
                </View>
                <Pressable onPress={() => toggleEvent(item.id)} style={styles.saveBtn}>
                  <Text style={styles.saveBtnText}>{item.saved ? '❤️ Saved' : '🤍 Save'}</Text>
                </Pressable>
              </View>

              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.metaText}>
                🕒 {item.time} · 📍 {item.venue}
              </Text>
              <Text style={styles.organizerText}>Organized by {item.organizer}</Text>
              <Text style={styles.descText}>{item.description}</Text>

              <View style={styles.cardFooter}>
                {item.capacity && <Text style={styles.capacityText}>Capacity: {item.capacity} seats</Text>}

                <Pressable
                  onPress={() => toggleRegisterEvent(item.id)}
                  style={[styles.registerBtn, item.registered && styles.registeredBtn]}>
                  <Text style={[styles.registerBtnText, item.registered && styles.registeredBtnText]}>
                    {item.registered ? 'Registered ✓' : 'RSVP / Register'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },
  headerTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  heroCard: { padding: 16, marginBottom: 14 },
  heroTitle: { color: MiraColors.ink, fontSize: 17, fontWeight: '900' },
  heroSub: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14, backgroundColor: '#F1F5F9' },
  chipActive: { backgroundColor: '#4F46E5' },
  chipText: { color: MiraColors.muted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: MiraColors.white },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '800' },
  emptySub: { color: MiraColors.muted, fontSize: 12, marginTop: 4 },
  eventCard: { marginBottom: 14 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dateBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dateBadgeText: { color: '#4F46E5', fontSize: 11, fontWeight: '900' },
  saveBtn: { padding: 4 },
  saveBtnText: { fontSize: 12 },
  eventTitle: { color: MiraColors.ink, fontSize: 16, fontWeight: '900', marginTop: 10 },
  metaText: { color: '#4F46E5', fontSize: 12, fontWeight: '800', marginTop: 4 },
  organizerText: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  descText: { color: MiraColors.ink, fontSize: 12, lineHeight: 18, marginTop: 6 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  capacityText: { color: MiraColors.muted, fontSize: 11, fontWeight: '700' },
  registerBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  registeredBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  registerBtnText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  registeredBtnText: { color: '#166534' },
});
