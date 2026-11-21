import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { ActionButton, Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';

const filters = ['All', 'Placements', 'Clubs', 'Events', 'Q&A', 'Announcements'];

export default function CampusScreen() {
  const router = useRouter();
  const { campus, toggleEvent, toggleClub, addQuestion } = useCampus();
  const [filter, setFilter] = useState('All');
  const [qModalOpen, setQModalOpen] = useState(false);
  const [questionText, setQuestionText] = useState('');
  const [questionDetails, setQuestionDetails] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleAskQuestion = () => {
    if (!questionText.trim()) return;
    addQuestion(questionText.trim(), questionDetails.trim() || undefined, 'General', isAnonymous);
    setQuestionText('');
    setQuestionDetails('');
    setIsAnonymous(false);
    setQModalOpen(false);
  };

  return (
    <Screen>
      {/* Top Header */}
      <Header
        eyebrow="CAMPUS HUB"
        title="My Campus Ecosystem"
        subtitle="Verified notices, clubs, placement drives, and student Q&A."
        right={
          <Pressable onPress={() => router.push('/search')} style={styles.searchBtn}>
            <Text style={styles.searchIcon}>🔍</Text>
          </Pressable>
        }
      />

      {/* Hero Action Navigation Banner */}
      <Card tone="lilac" style={styles.navHero}>
        <Text style={styles.heroEyebrow}>CAMPUS DIRECTORY</Text>
        <Text style={styles.heroTitle}>Discover opportunities & campus support</Text>
        <View style={styles.heroBtnRow}>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/placements')}>
            <Text style={styles.heroBtnText}>💼 Placements Hub</Text>
          </Pressable>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/clubs')}>
            <Text style={styles.heroBtnText}>🎭 Campus Clubs</Text>
          </Pressable>
          <Pressable style={styles.heroBtn} onPress={() => router.push('/events')}>
            <Text style={styles.heroBtnText}>🎉 Events & Fest</Text>
          </Pressable>
        </View>
      </Card>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.filterChip, filter === item && styles.filterChipActive]}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {/* Official Announcements */}
      {(filter === 'All' || filter === 'Announcements') && (
        <>
          <SectionTitle title="Official Campus Announcements" />
          <Card tone="gold" style={styles.announcementCard}>
            <View style={styles.annHeader}>
              <View style={styles.officialTag}>
                <Text style={styles.officialTagText}>OFFICIAL NOTICE</Text>
              </View>
              <Text style={styles.annDate}>Today · Dean&apos;s Office</Text>
            </View>
            <Text style={styles.annTitle}>Semester Examination & Placement Drive Timetable Released</Text>
            <Text style={styles.annSub}>
              All final and pre-final year students must complete registration on the Placement Portal by Sep 20.
            </Text>
          </Card>
        </>
      )}

      {/* Campus Q&A */}
      {(filter === 'All' || filter === 'Q&A') && (
        <>
          <SectionTitle title="Campus Q&A" action="+ Ask Question" onAction={() => setQModalOpen(true)} />
          {campus.questions.slice(0, 3).map((item) => (
            <Card key={item.id} tone="white" style={styles.qaCard}>
              <View style={styles.qaHeader}>
                <Text style={styles.qaCategory}>{item.category}</Text>
                <Text style={styles.qaAuthor}>By {item.authorName} · {item.createdAt}</Text>
              </View>
              <Text style={styles.qaQuestion}>{item.question}</Text>
              {item.details && <Text style={styles.qaDetails}>{item.details}</Text>}
              <View style={styles.qaFooter}>
                <Text style={styles.qaAnswers}>💬 {item.answersCount} answers</Text>
                <Text style={styles.qaUpvotes}>👍 {item.upvotes} helpful</Text>
              </View>
            </Card>
          ))}
        </>
      )}

      {/* Placements Preview */}
      {(filter === 'All' || filter === 'Placements') && (
        <>
          <SectionTitle title="Placement Drives" action="View all" onAction={() => router.push('/placements')} />
          {campus.placements.slice(0, 2).map((item) => (
            <Card key={item.id} tone="white" style={styles.placementCard}>
              <View style={styles.placementHeader}>
                <Text style={styles.placementCompany}>{item.company}</Text>
                <View style={styles.officialTag}>
                  <Text style={styles.officialTagText}>{item.trust}</Text>
                </View>
              </View>
              <Text style={styles.placementTitle}>{item.title}</Text>
              <Text style={styles.placementMeta}>
                Package: {item.salaryPackage} · Apply by {item.deadline}
              </Text>
            </Card>
          ))}
        </>
      )}

      {/* Events Preview */}
      {(filter === 'All' || filter === 'Events') && (
        <>
          <SectionTitle title="Upcoming Events" action="View calendar" onAction={() => router.push('/events')} />
          {campus.events.slice(0, 2).map((item) => (
            <Card key={item.id} tone="white" style={styles.eventCard}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventDate}>{item.date}</Text>
                <Pressable onPress={() => toggleEvent(item.id)}>
                  <Text style={styles.saveIcon}>{item.saved ? '❤️' : '🤍'}</Text>
                </Pressable>
              </View>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventVenue}>📍 {item.venue} · {item.time}</Text>
            </Card>
          ))}
        </>
      )}

      {/* Clubs Preview */}
      {(filter === 'All' || filter === 'Clubs') && (
        <>
          <SectionTitle title="Campus Clubs" action="Browse all" onAction={() => router.push('/clubs')} />
          {campus.clubs.slice(0, 2).map((item) => (
            <Card key={item.id} tone="white" style={styles.clubCard}>
              <View style={styles.clubHeader}>
                <Text style={styles.clubName}>{item.name}</Text>
                <Pressable onPress={() => toggleClub(item.id)} style={[styles.joinBtn, item.joined && styles.joinedBtn]}>
                  <Text style={[styles.joinText, item.joined && styles.joinedText]}>{item.joined ? 'Joined ✓' : 'Join'}</Text>
                </Pressable>
              </View>
              <Text style={styles.clubDesc}>{item.description}</Text>
            </Card>
          ))}
        </>
      )}

      {/* Q&A Modal */}
      <Modal visible={qModalOpen} animationType="slide" transparent onRequestClose={() => setQModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalTop}>
              <Text style={styles.modalTitle}>Ask Campus Community</Text>
              <Pressable onPress={() => setQModalOpen(false)}>
                <Text style={styles.modalClose}>×</Text>
              </Pressable>
            </View>

            <Text style={styles.modalLabel}>Question / Topic:</Text>
            <TextInput
              value={questionText}
              onChangeText={setQuestionText}
              placeholder="e.g. Which professor teaches Advanced Java best?"
              placeholderTextColor={MiraColors.muted}
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Additional Details (Optional):</Text>
            <TextInput
              value={questionDetails}
              onChangeText={setQuestionDetails}
              placeholder="Explain context..."
              placeholderTextColor={MiraColors.muted}
              style={[styles.modalInput, { minHeight: 60 }]}
              multiline
            />

            <Pressable onPress={() => setIsAnonymous(!isAnonymous)} style={styles.anonRow}>
              <View style={[styles.checkBox, isAnonymous && styles.checkBoxChecked]}>
                {isAnonymous && <Text style={styles.checkIcon}>✓</Text>}
              </View>
              <Text style={styles.anonText}>Post anonymously to students</Text>
            </Pressable>

            <ActionButton label="Post Question" icon="✦" onPress={handleAskQuestion} style={{ marginTop: 16 }} />
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  searchBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  searchIcon: { fontSize: 16 },
  navHero: { padding: 16, marginBottom: 14 },
  heroEyebrow: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroTitle: { color: MiraColors.ink, fontSize: 16, fontWeight: '900', marginTop: 4 },
  heroBtnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  heroBtn: { backgroundColor: '#4F46E5', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  heroBtnText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F1F5F9' },
  filterChipActive: { backgroundColor: '#4F46E5' },
  filterText: { color: MiraColors.muted, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: MiraColors.white },
  announcementCard: { padding: 16, marginBottom: 14 },
  annHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  officialTag: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  officialTagText: { color: '#92400E', fontSize: 9, fontWeight: '900' },
  annDate: { color: MiraColors.muted, fontSize: 11 },
  annTitle: { color: MiraColors.ink, fontSize: 15, fontWeight: '900', marginTop: 8 },
  annSub: { color: MiraColors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  qaCard: { padding: 14, marginBottom: 10 },
  qaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  qaCategory: { color: '#4F46E5', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  qaAuthor: { color: MiraColors.muted, fontSize: 10 },
  qaQuestion: { color: MiraColors.ink, fontSize: 14, fontWeight: '900', marginTop: 6 },
  qaDetails: { color: MiraColors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  qaFooter: { flexDirection: 'row', gap: 14, marginTop: 10 },
  qaAnswers: { color: '#4F46E5', fontSize: 11, fontWeight: '800' },
  qaUpvotes: { color: MiraColors.muted, fontSize: 11, fontWeight: '700' },
  placementCard: { padding: 14, marginBottom: 10 },
  placementHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  placementCompany: { color: '#4F46E5', fontSize: 14, fontWeight: '900' },
  placementTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '800', marginTop: 4 },
  placementMeta: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  eventCard: { padding: 14, marginBottom: 10 },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eventDate: { color: '#4F46E5', fontSize: 11, fontWeight: '900' },
  saveIcon: { fontSize: 14 },
  eventTitle: { color: MiraColors.ink, fontSize: 14, fontWeight: '900', marginTop: 4 },
  eventVenue: { color: MiraColors.muted, fontSize: 11, marginTop: 2 },
  clubCard: { padding: 14, marginBottom: 10 },
  clubHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clubName: { color: MiraColors.ink, fontSize: 14, fontWeight: '900' },
  joinBtn: { backgroundColor: '#4F46E5', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  joinedBtn: { backgroundColor: '#DCFCE7' },
  joinText: { color: MiraColors.white, fontSize: 11, fontWeight: '900' },
  joinedText: { color: '#166534' },
  clubDesc: { color: MiraColors.muted, fontSize: 11, marginTop: 4, lineHeight: 16 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: MiraColors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { color: MiraColors.ink, fontSize: 18, fontWeight: '900' },
  modalClose: { color: MiraColors.muted, fontSize: 24 },
  modalLabel: { color: MiraColors.ink, fontSize: 12, fontWeight: '800', marginTop: 10, marginBottom: 6 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, padding: 12, color: MiraColors.ink, fontSize: 13 },
  anonRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  checkBox: { width: 20, height: 20, borderRadius: 6, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  checkBoxChecked: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  checkIcon: { color: MiraColors.white, fontSize: 12, fontWeight: '900' },
  anonText: { color: MiraColors.ink, fontSize: 12, fontWeight: '700' },
});

