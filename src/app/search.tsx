import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card, Screen } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

export default function SearchScreen() {
  const router = useRouter();
  const { campus } = useCampus();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matchingClubs = q ? campus.clubs.filter((item) => item.name.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) : [];
  const matchingEvents = q ? campus.events.filter((item) => item.title.toLowerCase().includes(q) || item.category.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)) : [];
  const matchingPlacements = q ? campus.placements.filter((item) => item.company.toLowerCase().includes(q) || item.title.toLowerCase().includes(q) || item.requirements.some((r) => r.toLowerCase().includes(q))) : [];
  const matchingPosts = q ? campus.posts.filter((item) => item.title.toLowerCase().includes(q) || item.body.toLowerCase().includes(q)) : [];
  const matchingQuestions = q ? campus.questions.filter((item) => item.question.toLowerCase().includes(q)) : [];
  const matchingPeople = q ? campus.connections.filter((item) => item.name.toLowerCase().includes(q) || item.interests.some((i) => i.toLowerCase().includes(q))) : [];

  const hasResults =
    matchingClubs.length > 0 ||
    matchingEvents.length > 0 ||
    matchingPlacements.length > 0 ||
    matchingPosts.length > 0 ||
    matchingQuestions.length > 0 ||
    matchingPeople.length > 0;

  return (
    <Screen>
      {/* Search Input Top Bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search clubs, Java, placements, events, dance..."
          placeholderTextColor={MiraColors.muted}
          style={styles.searchInput}
          autoFocus
        />
      </View>

      {!q ? (
        <Card tone="lilac" style={styles.promptCard}>
          <Text style={styles.promptTitle}>Global Campus Search</Text>
          <Text style={styles.promptSub}>Search across student clubs, placement drives, study circles, Q&A, events, and people.</Text>
          <View style={styles.suggestionRow}>
            {['Java', 'Placement', 'Dance', 'AI/ML', 'Google', 'Study Partner'].map((tag) => (
              <Pressable key={tag} onPress={() => setQuery(tag)} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      ) : !hasResults ? (
        <Card tone="white" style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No results for &quot;{query}&quot;</Text>
          <Text style={styles.emptySub}>Try searching for broader keywords like coding, placement, dance, or Java.</Text>
        </Card>
      ) : (
        <View style={styles.resultsContainer}>
          {/* Matching People */}
          {matchingPeople.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>People ({matchingPeople.length})</Text>
              {matchingPeople.map((item) => (
                <Card key={item.id} tone="white" style={styles.resultCard}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultDesc}>{item.bio}</Text>
                  <Pressable onPress={() => router.push('/circle')} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Connect on Circle →</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}

          {/* Matching Placements */}
          {matchingPlacements.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Placements ({matchingPlacements.length})</Text>
              {matchingPlacements.map((item) => (
                <Card key={item.id} tone="white" style={styles.resultCard}>
                  <Text style={styles.resultName}>
                    {item.company} - {item.title}
                  </Text>
                  <Text style={styles.resultDesc}>{item.description}</Text>
                  <Pressable onPress={() => router.push('/placements')} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>View Placement Drive →</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}

          {/* Matching Clubs */}
          {matchingClubs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Clubs ({matchingClubs.length})</Text>
              {matchingClubs.map((item) => (
                <Card key={item.id} tone="white" style={styles.resultCard}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  <Text style={styles.resultDesc}>{item.description}</Text>
                  <Pressable onPress={() => router.push('/clubs')} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>Browse Club →</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}

          {/* Matching Events */}
          {matchingEvents.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Events ({matchingEvents.length})</Text>
              {matchingEvents.map((item) => (
                <Card key={item.id} tone="white" style={styles.resultCard}>
                  <Text style={styles.resultName}>{item.title}</Text>
                  <Text style={styles.resultDesc}>{item.description}</Text>
                  <Pressable onPress={() => router.push('/events')} style={styles.actionBtn}>
                    <Text style={styles.actionBtnText}>View Event →</Text>
                  </Pressable>
                </Card>
              ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  backBtn: { paddingVertical: 6, paddingRight: 6 },
  backText: { color: '#6366F1', fontWeight: '800', fontSize: 14 },
  searchInput: { flex: 1, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, color: MiraColors.ink, fontSize: 13 },
  promptCard: { padding: 20, marginVertical: 16 },
  promptTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  promptSub: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  suggestionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  tagChip: { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  emptyCard: { padding: 24, alignItems: 'center', marginVertical: 16 },
  emptyTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '800' },
  emptySub: { color: MiraColors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' },
  resultsContainer: { marginVertical: 12, gap: 16 },
  section: { gap: 8 },
  sectionTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '900', marginBottom: 4 },
  resultCard: { padding: 14, marginBottom: 8 },
  resultName: { color: MiraColors.ink, fontSize: 14, fontWeight: '900' },
  resultDesc: { color: MiraColors.muted, fontSize: 12, marginTop: 2, lineHeight: 16 },
  actionBtn: { marginTop: 8, alignSelf: 'flex-start' },
  actionBtnText: { color: '#6366F1', fontSize: 11, fontWeight: '800' },
});
