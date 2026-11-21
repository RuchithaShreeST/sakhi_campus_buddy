import { useState } from 'react';
import { Pressable, Text, TextInput, View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { Card, Header, Screen, SectionTitle } from '@/components/sakhi-ui';
import { MiraColors } from '@/constants/theme';
import { useCampus } from '@/hooks/use-campus';
import { ReportModal } from '@/components/ui/ReportModal';

const categories = ['For you', 'Study', 'Friendship', 'Placements', 'Hobbies', 'Campus', 'Advice'];

export default function CircleScreen() {
  const router = useRouter();
  const {
    campus,
    userConnections,
    discoverableUsers,
    connectUser,
    acceptConnection,
    addPost,
    togglePost,
    addPostComment,
    reactToPost,
    submitReport,
  } = useCampus();

  const [activeTab, setActiveTab] = useState<'feed' | 'people' | 'requests'>('feed');
  const [filter, setFilter] = useState('For you');
  const [composerOpen, setComposerOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expandedCommentsPostId, setExpandedCommentsPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  // Report Modal State
  const [reportingItem, setReportingItem] = useState<{ id: string; type: 'user' | 'post' | 'comment' | 'message' } | null>(null);

  const posts = filter === 'For you'
    ? campus.posts
    : campus.posts.filter((post) => post.category.toLowerCase() === filter.toLowerCase());

  const pendingRequests = userConnections.filter((c) => c.status === 'pending');
  const acceptedFriends = userConnections.filter((c) => c.status === 'accepted');

  const submitPost = () => {
    if (!title.trim() || !body.trim()) return;
    addPost(
      title.trim(),
      body.trim(),
      filter === 'For you' ? 'Campus' : (filter as any)
    );
    setTitle('');
    setBody('');
    setComposerOpen(false);
  };

  const handleAddComment = (postId: string) => {
    if (!commentText.trim()) return;
    addPostComment(postId, commentText.trim());
    setCommentText('');
  };

  return (
    <Screen>
      <Header
        eyebrow="Circle Social"
        title="Find your people"
        subtitle="Women-first community. Connect for studies, hobbies & campus life."
      />

      {/* Main Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          onPress={() => setActiveTab('feed')}
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Community Feed</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('people')}
          style={[styles.tab, activeTab === 'people' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'people' && styles.tabTextActive]}>
            Discover People ({discoverableUsers.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('requests')}
          style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.tabTextActive]}>
            Requests {pendingRequests.length > 0 ? `(${pendingRequests.length})` : ''}
          </Text>
        </Pressable>
      </View>

      {/* TAB 1: FEED */}
      {activeTab === 'feed' && (
        <View>
          {/* Quick Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filters}>
            {categories.map((item) => (
              <Pressable
                key={item}
                onPress={() => setFilter(item)}
                style={[styles.filter, filter === item && styles.filterOn]}
              >
                <Text style={[styles.filterText, filter === item && styles.filterTextOn]}>{item}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Call to action card */}
          <Card tone="rose">
            <View style={styles.cardHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroTitle}>New in Campus or looking for study partners?</Text>
                <Text style={styles.copy}>
                  Share a thought, ask a question, or introduce yourself to fellow students.
                </Text>
              </View>
              <Pressable onPress={() => setComposerOpen(!composerOpen)} style={styles.primaryBtn}>
                <Text style={styles.primaryText}>{composerOpen ? 'Cancel' : 'Create Post'}</Text>
              </Pressable>
            </View>
          </Card>

          {/* Composer */}
          {composerOpen && (
            <Card tone="lilac" style={{ marginTop: 10 }}>
              <Text style={styles.formTitle}>Start a conversation</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="What's on your mind? (Title)"
                placeholderTextColor={MiraColors.muted}
                style={styles.input}
              />
              <TextInput
                value={body}
                onChangeText={setBody}
                placeholder="Add context or questions..."
                placeholderTextColor={MiraColors.muted}
                multiline
                style={[styles.input, styles.bodyInput]}
              />
              <Pressable onPress={submitPost} style={styles.submitBtn}>
                <Text style={styles.submitBtnText}>Publish to Circle</Text>
              </Pressable>
            </Card>
          )}

          <SectionTitle title={`${filter} Discussions`} action={`${posts.length} posts`} />

          {posts.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>Your circle is still growing.</Text>
              <Text style={styles.copy}>Be the first to create a post in {filter}!</Text>
            </Card>
          ) : (
            posts.map((post) => {
              const isCommentsExpanded = expandedCommentsPostId === post.id;
              return (
                <Card key={post.id} style={styles.postCard}>
                  <View style={styles.postTop}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{post.author[0]}</Text>
                    </View>
                    <View style={styles.postCopy}>
                      <Text style={styles.postTitle}>{post.title}</Text>
                      <Text style={styles.meta}>
                        {post.author} · {post.createdAt} · <Text style={styles.badgeText}>{post.category}</Text>
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setReportingItem({ id: post.id, type: 'post' })}
                      style={styles.reportBtn}
                    >
                      <Text style={styles.reportText}>Flag</Text>
                    </Pressable>
                  </View>

                  <Text style={styles.postBody}>{post.body}</Text>

                  <View style={styles.postActions}>
                    <Pressable
                      onPress={() => reactToPost(post.id, 'upvote')}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>👍 {post.reactions?.upvote ?? post.upvotes ?? 0}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => reactToPost(post.id, 'heart')}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>💗 {post.reactions?.heart ?? 0}</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => reactToPost(post.id, 'helpful')}
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>💡 {post.reactions?.helpful ?? 0}</Text>
                    </Pressable>

                    <Pressable
                      onPress={() =>
                        setExpandedCommentsPostId(isCommentsExpanded ? null : post.id)
                      }
                      style={styles.actionBtn}
                    >
                      <Text style={styles.actionBtnText}>💬 {post.commentsList ? post.commentsList.length : post.replies}</Text>
                    </Pressable>

                    <Pressable onPress={() => togglePost(post.id)}>
                      <Text style={styles.saveText}>{post.saved ? 'Saved' : 'Save'}</Text>
                    </Pressable>
                  </View>

                  {/* Comment Section */}
                  {isCommentsExpanded && (
                    <View style={styles.commentSection}>
                      {post.commentsList && post.commentsList.length > 0 ? (
                        post.commentsList.map((c) => (
                          <View key={c.id} style={styles.commentRow}>
                            <Text style={styles.commentAuthor}>{c.author}: </Text>
                            <Text style={styles.commentBody}>{c.body}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.meta}>No comments yet. Start the conversation!</Text>
                      )}

                      <View style={styles.commentInputRow}>
                        <TextInput
                          value={commentText}
                          onChangeText={setCommentText}
                          placeholder="Write a supportive reply..."
                          placeholderTextColor={MiraColors.muted}
                          style={styles.commentInput}
                        />
                        <Pressable
                          onPress={() => handleAddComment(post.id)}
                          style={styles.sendCommentBtn}
                        >
                          <Text style={styles.sendCommentText}>Send</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })
          )}
        </View>
      )}

      {/* TAB 2: DISCOVER PEOPLE */}
      {activeTab === 'people' && (
        <View>
          <SectionTitle title="You may get along" action="Match Reasons" />
          <Text style={styles.sectionSubtitleText}>
            Connect with girls who share your campus, study goals, or hobbies.
          </Text>

          {discoverableUsers.map((person) => {
            const isConnected = userConnections.some(
              (c) => c.targetUserId === person.id && c.status === 'accepted'
            );
            const isPending = userConnections.some(
              (c) => c.targetUserId === person.id && c.status === 'pending'
            );

            return (
              <Card key={person.id} style={styles.personCard}>
                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.avatarText}>{person.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.personName}>{person.name}</Text>
                    <Text style={styles.personMeta}>{person.campus} · {person.year}</Text>
                    <View style={styles.reasonBadge}>
                      <Text style={styles.reasonText}>✨ {person.matchReason}</Text>
                    </View>
                  </View>
                </View>

                {/* Shared Interests */}
                <View style={styles.interestsRow}>
                  {person.interests.map((interest) => (
                    <View key={interest} style={styles.interestPill}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.personActionRow}>
                  {isConnected ? (
                    <Pressable
                      onPress={() => router.push({ pathname: '/chat', params: { userId: person.id, userName: person.name } })}
                      style={styles.chatConnectBtn}
                    >
                      <Text style={styles.chatConnectText}>💬 Chat</Text>
                    </Pressable>
                  ) : isPending ? (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Request Sent</Text>
                    </View>
                  ) : (
                    <Pressable
                      onPress={() => connectUser(person.id, person.name, person.matchReason)}
                      style={styles.connectBtn}
                    >
                      <Text style={styles.connectText}>+ Connect</Text>
                    </Pressable>
                  )}

                  <Pressable
                    onPress={() => setReportingItem({ id: person.id, type: 'user' })}
                    style={styles.flagIconBtn}
                  >
                    <Text style={styles.reportText}>Flag</Text>
                  </Pressable>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* TAB 3: REQUESTS & CONNECTIONS */}
      {activeTab === 'requests' && (
        <View>
          <SectionTitle title="Pending Requests" action={`${pendingRequests.length} waiting`} />
          {pendingRequests.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>No pending connection requests.</Text>
              <Text style={styles.copy}>Check &quot;Discover People&quot; to connect with classmates!</Text>
            </Card>
          ) : (
            pendingRequests.map((req) => (
              <Card key={req.id} style={styles.reqCard}>
                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.avatarText}>{req.targetUserName[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.personName}>{req.targetUserName}</Text>
                    <Text style={styles.personMeta}>Wants to connect: {req.matchReason}</Text>
                  </View>
                  <Pressable
                    onPress={() => acceptConnection(req.id)}
                    style={styles.acceptBtn}
                  >
                    <Text style={styles.acceptText}>Accept</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}

          <SectionTitle title="Your Circle Connections" action={`${acceptedFriends.length} friends`} />
          {acceptedFriends.length === 0 ? (
            <Card>
              <Text style={styles.emptyTitle}>No active connections yet.</Text>
              <Text style={styles.copy}>Connections unlock private 1-on-1 chats.</Text>
            </Card>
          ) : (
            acceptedFriends.map((friend) => (
              <Card key={friend.id} style={styles.reqCard}>
                <View style={styles.personRow}>
                  <View style={styles.personAvatar}>
                    <Text style={styles.avatarText}>{friend.targetUserName[0]}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.personName}>{friend.targetUserName}</Text>
                    <Text style={styles.personMeta}>Connected · {friend.matchReason}</Text>
                  </View>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: '/chat',
                        params: { userId: friend.targetUserId, userName: friend.targetUserName },
                      })
                    }
                    style={styles.chatConnectBtn}
                  >
                    <Text style={styles.chatConnectText}>💬 Open Chat</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      )}

      {/* Safety Report Modal */}
      {reportingItem && (
        <ReportModal
          visible={!!reportingItem}
          targetId={reportingItem.id}
          targetType={reportingItem.type}
          onClose={() => setReportingItem(null)}
          onSubmitReport={(targetId: string, type: any, reason: any, details?: string) => {
            submitReport(targetId, type, reason, details);
            setReportingItem(null);
          }}
        />
      )}

      <Text style={styles.disclaimer}>
        Community content is moderated. Be respectful, safeguard your privacy, and report any inappropriate behavior.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: MiraColors.white,
    borderRadius: 14,
    padding: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: MiraColors.line,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: MiraColors.ink,
  },
  tabText: {
    color: MiraColors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  tabTextActive: {
    color: MiraColors.white,
    fontWeight: '900',
  },
  filterScroll: {
    marginBottom: 10,
  },
  filters: {
    flexDirection: 'row',
    gap: 6,
  },
  filter: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 15,
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
  },
  filterOn: {
    backgroundColor: MiraColors.rose,
    borderColor: MiraColors.rose,
  },
  filterText: {
    color: MiraColors.muted,
    fontSize: 11,
    fontWeight: '800',
  },
  filterTextOn: {
    color: MiraColors.white,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroTitle: {
    color: MiraColors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  copy: {
    color: MiraColors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  primaryBtn: {
    backgroundColor: MiraColors.coral,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  primaryText: {
    color: MiraColors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  formTitle: {
    color: MiraColors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  input: {
    marginTop: 8,
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 10,
    color: MiraColors.ink,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  bodyInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitBtn: {
    marginTop: 10,
    backgroundColor: MiraColors.ink,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: MiraColors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionSubtitleText: {
    color: MiraColors.muted,
    fontSize: 11,
    marginBottom: 10,
    marginTop: -4,
  },
  postCard: {
    padding: 14,
    marginBottom: 10,
  },
  postTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: MiraColors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: MiraColors.rose,
    fontWeight: '900',
    fontSize: 14,
  },
  postCopy: {
    flex: 1,
    marginLeft: 10,
  },
  postTitle: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  meta: {
    color: MiraColors.muted,
    fontSize: 10,
    marginTop: 2,
  },
  badgeText: {
    color: MiraColors.rose,
    fontWeight: '700',
  },
  postBody: {
    color: MiraColors.ink,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MiraColors.line,
  },
  actionBtn: {
    backgroundColor: MiraColors.sand,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  actionBtnText: {
    color: MiraColors.ink,
    fontSize: 10,
    fontWeight: '800',
  },
  saveText: {
    color: MiraColors.rose,
    fontSize: 11,
    fontWeight: '800',
  },
  commentSection: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: MiraColors.line,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  commentAuthor: {
    color: MiraColors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  commentBody: {
    color: MiraColors.muted,
    fontSize: 11,
    flex: 1,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  commentInput: {
    flex: 1,
    backgroundColor: MiraColors.white,
    borderWidth: 1,
    borderColor: MiraColors.line,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    color: MiraColors.ink,
  },
  sendCommentBtn: {
    backgroundColor: MiraColors.coral,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  sendCommentText: {
    color: MiraColors.white,
    fontSize: 10,
    fontWeight: '900',
  },
  personCard: {
    padding: 12,
    marginBottom: 10,
  },
  personRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: MiraColors.blush,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    color: MiraColors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  personMeta: {
    color: MiraColors.muted,
    fontSize: 10,
  },
  reasonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: MiraColors.lilac,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 3,
  },
  reasonText: {
    color: MiraColors.ink,
    fontSize: 9,
    fontWeight: '800',
  },
  interestsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  interestPill: {
    backgroundColor: MiraColors.sand,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  interestText: {
    color: MiraColors.muted,
    fontSize: 9,
    fontWeight: '700',
  },
  personActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  connectBtn: {
    backgroundColor: MiraColors.rose,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  connectText: {
    color: MiraColors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  pendingBadge: {
    backgroundColor: MiraColors.sand,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  pendingText: {
    color: MiraColors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  chatConnectBtn: {
    backgroundColor: MiraColors.ink,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chatConnectText: {
    color: MiraColors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  reportBtn: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reportText: {
    color: MiraColors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  flagIconBtn: {
    paddingHorizontal: 6,
  },
  reqCard: {
    padding: 12,
    marginBottom: 8,
  },
  acceptBtn: {
    backgroundColor: MiraColors.coral,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  acceptText: {
    color: MiraColors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  emptyTitle: {
    color: MiraColors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  disclaimer: {
    color: MiraColors.muted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginVertical: 12,
  },
});

