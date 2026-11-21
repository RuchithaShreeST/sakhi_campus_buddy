import { useState } from 'react';
import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

const categories = ['All', 'Dance', 'AI/ML', 'Coding', 'Books', 'Painting', 'Music', 'Career'];

export default function ClubsScreen() {
  const router = useRouter();
  const { campus, toggleClub } = useCampus();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [joinedOnly, setJoinedOnly] = useState(false);

  const filteredClubs = campus.clubs.filter((club) => {
    if (joinedOnly && !club.joined) return false;
    if (selectedCategory !== 'All' && club.category !== selectedCategory) return false;
    return true;
  });

  return (
    <Screen>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Campus Clubs & Communities</Text>
        <Pressable onPress={() => setJoinedOnly(!joinedOnly)} style={[styles.filterToggle, joinedOnly && styles.filterToggleActive]}>
          <Text style={[styles.filterToggleText, joinedOnly && styles.filterToggleTextActive]}>{joinedOnly ? 'My Clubs' : 'All'}</Text>
        </Pressable>
      </View>

      {/* Hero */}
      <Card tone="lilac" style={styles.heroCard}>
        <Text style={styles.heroTitle}>Find your people & express your passion</Text>
        <Text style={styles.heroSub}>
          Join student-led clubs, dance crews, coding circles, art hubs, and literature meetups.
        </Text>
      </Card>

      {/* Category Pills */}
      <View style={styles.categoryRow}>
        {categories.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}>
            <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </View>

      {/* Clubs List */}
      <SectionTitle title={joinedOnly ? 'Clubs You Joined' : `${selectedCategory} Clubs`} />

      {filteredClubs.length === 0 ? (
        <Card tone="white" style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No clubs found</Text>
          <Text style={styles.emptySub}>Try selecting a different category or search parameter.</Text>
        </Card>
      ) : (
        <FlatList
          data={filteredClubs}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <Card tone="white" style={styles.clubCard}>
              <View style={styles.clubHeader}>
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{item.category}</Text>
                </View>
                <View style={[styles.trustTag, item.trust === 'OFFICIAL' ? styles.trustOfficial : styles.trustVerified]}>
                  <Text style={styles.trustTagText}>{item.trust}</Text>
                </View>
              </View>

              <Text style={styles.clubName}>{item.name}</Text>
              <Text style={styles.clubDesc}>{item.description}</Text>

              {item.meetingTime && (
                <Text style={styles.meetingText}>
                  🕒 {item.meetingTime} · {item.location ?? 'Campus Hall'}
                </Text>
              )}

              {item.adminName && <Text style={styles.adminText}>Lead: {item.adminName}</Text>}

              <View style={styles.interestRow}>
                {item.interests.map((interest, idx) => (
                  <View key={idx} style={styles.interestChip}>
                    <Text style={styles.interestChipText}>#{interest}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.clubFooter}>
                <Text style={styles.membersCount}>👥 {item.members} members</Text>

                <Pressable
                  onPress={() => toggleClub(item.id)}
                  style={[styles.joinBtn, item.joined && styles.joinedBtn]}>
                  <Text style={[styles.joinBtnText, item.joined && styles.joinedBtnText]}>
                    {item.joined ? 'Joined ✓' : '+ Join Club'}
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
  headerTitle: { color: MiraColors.ink, fontSize: 17, fontWeight: '900' },
  filterToggle: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: '#F1F5F9' },
  filterToggleActive: { backgroundColor: '#4F46E5' },
  filterToggleText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  filterToggleTextActive: { color: MiraColors.white },
  heroCard: { padding: 16, marginBottom: 14 },
  heroTitle: { color: MiraColors.ink, fontSize: 17, fontWeight: '900' },
  heroSub: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F1F5F9' },
  catChipActive: { backgroundColor: '#6366F1' },
  catText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  catTextActive: { color: MiraColors.white },
  emptyCard: { padding: 24, alignItems: 'center' },
  emptyTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '800' },
  emptySub: { color: MiraColors.muted, fontSize: 12, marginTop: 4 },
  clubCard: { marginBottom: 14 },
  clubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  categoryBadgeText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  trustTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  trustOfficial: { backgroundColor: '#FEF3C7' },
  trustVerified: { backgroundColor: '#DCFCE7' },
  trustTagText: { color: MiraColors.ink, fontSize: 9, fontWeight: '900' },
  clubName: { color: MiraColors.ink, fontSize: 16, fontWeight: '900', marginTop: 10 },
  clubDesc: { color: MiraColors.ink, fontSize: 12, lineHeight: 18, marginTop: 4 },
  meetingText: { color: '#4F46E5', fontSize: 11, fontWeight: '700', marginTop: 8 },
  adminText: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  interestRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  interestChip: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  interestChipText: { color: MiraColors.muted, fontSize: 10, fontWeight: '700' },
  clubFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  membersCount: { color: MiraColors.muted, fontSize: 12, fontWeight: '700' },
  joinBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
  joinedBtn: { backgroundColor: '#DCFCE7', borderWidth: 1, borderColor: '#86EFAC' },
  joinBtnText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  joinedBtnText: { color: '#166534' },
});
