import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { ActionButton, Card, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';
import { PlacementItem } from '@/types/campus';

type PlacementFilter = 'all' | 'registered' | 'Drive' | 'Internship' | 'Full-time';

export default function PlacementsScreen() {
  const router = useRouter();
  const { campus, toggleRegisterPlacement } = useCampus();
  const [filter, setFilter] = useState<PlacementFilter>('all');
  const [selectedItem, setSelectedItem] = useState<PlacementItem | null>(null);

  const filteredPlacements = campus.placements.filter((item) => {
    if (filter === 'registered') return item.registered;
    if (filter === 'Drive' || filter === 'Internship' || filter === 'Full-time') return item.type === filter;
    return true;
  });

  return (
    <Screen>
      {/* Header Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Placement Hub</Text>
        <Pressable onPress={() => router.push('/search')} style={styles.searchIconBtn}>
          <Text style={styles.searchIcon}>🔍</Text>
        </Pressable>
      </View>

      {/* Hero Banner */}
      <Card tone="sage" style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>CAREER & PLACEMENT CELL</Text>
        </View>
        <Text style={styles.heroTitle}>Build your career with peer support & verified drives.</Text>
        <Text style={styles.heroSubtitle}>
          Access official placement updates, interview questions, coding practice, and mock GD rounds.
        </Text>
      </Card>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['all', 'registered', 'Drive', 'Internship', 'Full-time'] as PlacementFilter[]).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.filterChip, filter === tab && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>
              {tab === 'all' ? 'All Opportunities' : tab === 'registered' ? 'My Drives' : tab}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Placement List */}
      <SectionTitle title="Campus Drives & Internships" />

      {filteredPlacements.length === 0 ? (
        <Card tone="white" style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No drives matched your filter</Text>
          <Text style={styles.emptySub}>Check back soon for new campus career updates.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredPlacements}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card tone="white" style={styles.placementCard}>
              <View style={styles.cardHeader}>
                <View style={styles.companyBadge}>
                  <Text style={styles.companyText}>{item.company}</Text>
                </View>
                <View style={[styles.trustTag, item.trust === 'OFFICIAL' ? styles.trustOfficial : styles.trustVerified]}>
                  <Text style={styles.trustTagText}>{item.trust}</Text>
                </View>
              </View>

              <Text style={styles.roleTitle}>{item.title}</Text>
              <Text style={styles.packageText}>Package: {item.salaryPackage ?? 'Competitive'}</Text>
              <Text style={styles.deadlineText}>Apply by: {item.deadline}</Text>

              <Text style={styles.descText}>{item.description}</Text>

              {/* Requirement tags */}
              <View style={styles.reqRow}>
                {item.requirements.map((req, i) => (
                  <View key={i} style={styles.reqTag}>
                    <Text style={styles.reqTagText}>{req}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.cardFooter}>
                <Pressable onPress={() => setSelectedItem(item)} style={styles.discussionBtn}>
                  <Text style={styles.discussionBtnText}>💬 {item.discussionsCount} Q&A & Experiences</Text>
                </Pressable>

                <Pressable
                  onPress={() => toggleRegisterPlacement(item.id)}
                  style={[styles.registerBtn, item.registered && styles.registeredBtn]}>
                  <Text style={[styles.registerBtnText, item.registered && styles.registeredBtnText]}>
                    {item.registered ? 'Registered ✓' : 'Register Drive'}
                  </Text>
                </Pressable>
              </View>
            </Card>
          )}
        />
      )}

      {/* Discussion Modal Preview */}
      {selectedItem && (
        <Card tone="lilac" style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItem.company} Interview Prep & Discussion</Text>
            <Pressable onPress={() => setSelectedItem(null)}>
              <Text style={styles.modalClose}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.modalSub}>
            Discuss technical rounds, aptitude patterns, and salary details with campus peers.
          </Text>
          <ActionButton
            label="Join Placement Study Group"
            icon="👥"
            onPress={() => {
              setSelectedItem(null);
              router.push('/circle');
            }}
            style={{ marginTop: 12 }}
          />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  backBtn: { paddingVertical: 6, paddingRight: 12 },
  backText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },
  headerTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  searchIconBtn: { padding: 6 },
  searchIcon: { fontSize: 18 },
  heroCard: { padding: 18, marginBottom: 16 },
  heroBadge: { backgroundColor: '#4F46E5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  heroBadgeText: { color: MiraColors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900', marginTop: 10 },
  heroSubtitle: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  filterText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: MiraColors.white },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '800' },
  emptySub: { color: MiraColors.muted, fontSize: 12, marginTop: 4 },
  placementCard: { marginBottom: 14 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  companyBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  companyText: { color: '#4F46E5', fontSize: 13, fontWeight: '900' },
  trustTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trustOfficial: { backgroundColor: '#FEF3C7' },
  trustVerified: { backgroundColor: '#DCFCE7' },
  trustTagText: { color: MiraColors.ink, fontSize: 9, fontWeight: '900' },
  roleTitle: { color: MiraColors.ink, fontSize: 16, fontWeight: '900', marginTop: 10 },
  packageText: { color: '#059669', fontSize: 13, fontWeight: '800', marginTop: 4 },
  deadlineText: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  descText: { color: MiraColors.ink, fontSize: 12, lineHeight: 18, marginTop: 8 },
  reqRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  reqTag: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  reqTagText: { color: MiraColors.muted, fontSize: 10, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  discussionBtn: { paddingVertical: 6 },
  discussionBtnText: { color: '#6366F1', fontSize: 11, fontWeight: '800' },
  registerBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  registeredBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  registerBtnText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  registeredBtnText: { color: '#166534' },
  modalCard: { marginTop: 12, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '900', flex: 1 },
  modalClose: { color: MiraColors.muted, fontSize: 20, paddingHorizontal: 6 },
  modalSub: { color: MiraColors.muted, fontSize: 11, marginTop: 4 },
});
