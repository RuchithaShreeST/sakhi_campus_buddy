import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { campusClubs, campusEvents, campusQuestions, communityPosts, placementItems } from '@/data/campusData';
import { loadCampusState, saveCampusState } from '@/services/campusStorage';
import { CampusState, CampusQuestion, DirectMessage, SafetyReport, UserConnection } from '@/types/campus';

type CampusContextValue = {
  campus: CampusState;
  loading: boolean;
  messages: DirectMessage[];
  reports: SafetyReport[];
  safetyReports: SafetyReport[];
  userConnections: UserConnection[];
  discoverableUsers: { id: string; name: string; campus: string; year: string; interests: string[]; matchReason: string }[];
  blockedUserIds: string[];
  toggleEvent: (id: string) => void;
  toggleRegisterEvent: (id: string) => void;
  toggleClub: (id: string) => void;
  togglePost: (id: string) => void;
  upvotePost: (id: string) => void;
  addPost: (title: string, body: string, category: CampusState['posts'][number]['category']) => void;
  addComment: (postId: string, body: string) => void;
  addPostComment: (postId: string, body: string) => void;
  reactToPost: (postId: string, reactionType: 'upvote' | 'heart' | 'helpful') => void;
  toggleRegisterPlacement: (id: string) => void;
  addQuestion: (question: string, details?: string, category?: CampusQuestion['category'], anonymous?: boolean) => void;
  connectUser: (id: string, name?: string, reason?: string) => void;
  acceptConnection: (id: string) => void;
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  sendDirectMessage: (conversationId: string, recipientName: string, text: string) => void;
  submitReport: (targetId: string, type: 'user' | 'post' | 'comment' | 'message' | 'club', reason: string, details?: string) => void;
};

const CampusContext = createContext<CampusContextValue | null>(null);

export function CampusProvider({ children }: PropsWithChildren) {
  const [campus, setCampus] = useState<CampusState>({
    events: campusEvents,
    clubs: campusClubs,
    posts: communityPosts.map((p) => ({
      ...p,
      reactions: { upvote: p.upvotes ?? 3, heart: 2, helpful: 4 },
      commentsList: p.comments ?? [],
    })),
    placements: placementItems,
    questions: campusQuestions,
    connections: [
      {
        id: 'conn-sanya',
        name: 'Sanya Malhotra',
        targetUserId: 'user-sanya',
        targetUserName: 'Sanya Malhotra',
        campus: 'State University',
        interests: ['Coding', 'AI/ML', 'Music'],
        status: 'pending',
        matchReason: 'Both studying Java Data Structures',
      },
      {
        id: 'conn-ananya',
        name: 'Ananya Sharma',
        targetUserId: 'user-ananya',
        targetUserName: 'Ananya Sharma',
        campus: 'State University',
        interests: ['Dance', 'Self-care', 'Movies'],
        status: 'accepted',
        matchReason: 'Same Campus & Dance Club member',
      },
    ],
    interests: ['Coding', 'Dance', 'AI/ML'],
    notifications: 2,
  });

  const [discoverableUsers] = useState([
    {
      id: 'user-priya',
      name: 'Priya Verma',
      campus: 'State University',
      year: '3rd Year CSE',
      interests: ['Coding', 'Web Dev', 'Books'],
      matchReason: '3 Shared Interests & Same Campus',
    },
    {
      id: 'user-meera',
      name: 'Meera Kapoor',
      campus: 'State University',
      year: '2nd Year IT',
      interests: ['Dance', 'Painting', 'Self-care'],
      matchReason: 'Looking for a Dance practice partner',
    },
    {
      id: 'user-kavya',
      name: 'Kavya Singh',
      campus: 'State University',
      year: '4th Year ECE',
      interests: ['Placements', 'AI/ML', 'Coding'],
      matchReason: 'Preparing for Microsoft & Google drives',
    },
  ]);

  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  const [messages, setMessages] = useState<DirectMessage[]>([
    {
      id: 'msg-1',
      conversationId: 'conv-ananya',
      senderId: 'user-ananya',
      senderName: 'Ananya Sharma',
      text: 'Hey! Saw you joined the Dance Circle too! Excited for the workshop this Saturday.',
      createdAt: '10:15 AM',
      isMe: false,
      status: 'read',
    },
  ]);

  const [reports, setReports] = useState<SafetyReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampusState().then((value) => {
      setCampus((current) => ({
        ...current,
        ...value,
        events: value.events?.length ? value.events : campusEvents,
        clubs: value.clubs?.length ? value.clubs : campusClubs,
        posts: value.posts?.length ? value.posts : communityPosts,
        placements: value.placements?.length ? value.placements : placementItems,
        questions: value.questions?.length ? value.questions : campusQuestions,
        connections: value.connections?.length ? value.connections : current.connections,
      }));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) void saveCampusState(campus);
  }, [campus, loading]);

  const value = useMemo<CampusContextValue>(
    () => ({
      campus,
      loading,
      messages,
      reports,
      safetyReports: reports,
      userConnections: campus.connections,
      discoverableUsers,
      blockedUserIds,
      toggleEvent: (id) =>
        setCampus((current) => ({
          ...current,
          events: current.events.map((event) => (event.id === id ? { ...event, saved: !event.saved } : event)),
        })),
      toggleRegisterEvent: (id) =>
        setCampus((current) => ({
          ...current,
          events: current.events.map((event) => (event.id === id ? { ...event, registered: !event.registered } : event)),
        })),
      toggleClub: (id) =>
        setCampus((current) => ({
          ...current,
          clubs: current.clubs.map((club) =>
            club.id === id ? { ...club, joined: !club.joined, members: club.joined ? Math.max(0, club.members - 1) : club.members + 1 } : club
          ),
        })),
      togglePost: (id) =>
        setCampus((current) => ({
          ...current,
          posts: current.posts.map((post) => (post.id === id ? { ...post, saved: !post.saved } : post)),
        })),
      upvotePost: (id) =>
        setCampus((current) => ({
          ...current,
          posts: current.posts.map((post) =>
            post.id === id
              ? { ...post, userUpvoted: !post.userUpvoted, upvotes: (post.upvotes ?? 0) + (post.userUpvoted ? -1 : 1) }
              : post
          ),
        })),
      addPost: (title, body, category) =>
        setCampus((current) => ({
          ...current,
          posts: [
            {
              id: `post-${Date.now()}`,
              title,
              body,
              category,
              author: 'You',
              createdAt: 'Just now',
              replies: 0,
              saved: false,
              upvotes: 1,
              userUpvoted: true,
              commentsList: [],
              reactions: { upvote: 1, heart: 0, helpful: 0 },
            },
            ...current.posts,
          ],
        })),
      addComment: (postId, body) =>
        setCampus((current) => ({
          ...current,
          posts: current.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  replies: post.replies + 1,
                  commentsList: [
                    ...(post.commentsList ?? []),
                    { id: `comment-${Date.now()}`, postId, author: 'You', body, createdAt: 'Just now' },
                  ],
                }
              : post
          ),
        })),
      addPostComment: (postId, body) =>
        setCampus((current) => ({
          ...current,
          posts: current.posts.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  replies: (post.replies || 0) + 1,
                  commentsList: [
                    ...(post.commentsList ?? []),
                    { id: `comment-${Date.now()}`, postId, author: 'You', body, createdAt: 'Just now' },
                  ],
                }
              : post
          ),
        })),
      reactToPost: (postId, reactionType) =>
        setCampus((current) => ({
          ...current,
          posts: current.posts.map((post) => {
            if (post.id !== postId) return post;
            const rx = post.reactions ?? { upvote: 0, heart: 0, helpful: 0 };
            return {
              ...post,
              reactions: {
                ...rx,
                [reactionType]: rx[reactionType] + 1,
              },
            };
          }),
        })),
      toggleRegisterPlacement: (id) =>
        setCampus((current) => ({
          ...current,
          placements: current.placements.map((item) => (item.id === id ? { ...item, registered: !item.registered } : item)),
        })),
      addQuestion: (question, details, category = 'General', anonymous = false) =>
        setCampus((current) => ({
          ...current,
          questions: [
            {
              id: `q-${Date.now()}`,
              question,
              details,
              category,
              authorName: anonymous ? 'Anonymous Student' : 'You',
              anonymous,
              createdAt: 'Just now',
              answersCount: 0,
              upvotes: 1,
              saved: false,
            },
            ...current.questions,
          ],
        })),
      connectUser: (id, name = 'Student', reason = 'Same Campus & Shared Interests') =>
        setCampus((current) => ({
          ...current,
          connections: [
            ...current.connections,
            {
              id: `conn-${Date.now()}`,
              name,
              targetUserId: id,
              targetUserName: name,
              interests: ['Campus', 'Study'],
              status: 'pending',
              matchReason: reason,
            },
          ],
        })),
      acceptConnection: (id) =>
        setCampus((current) => ({
          ...current,
          connections: current.connections.map((conn) => (conn.id === id ? { ...conn, status: 'accepted' } : conn)),
        })),
      blockUser: (id) => {
        setBlockedUserIds((current) => [...current, id]);
        setCampus((current) => ({
          ...current,
          connections: current.connections.filter((conn) => conn.targetUserId !== id && conn.id !== id),
        }));
      },
      unblockUser: (id) => setBlockedUserIds((current) => current.filter((item) => item !== id)),
      sendDirectMessage: (conversationId, recipientName, text) => {
        const newMsg: DirectMessage = {
          id: `msg-${Date.now()}`,
          conversationId,
          senderId: 'user-me',
          senderName: 'You',
          text,
          createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: true,
          status: 'sent',
        };
        setMessages((current) => [...current, newMsg]);
      },
      submitReport: (targetId, type, reason, details) => {
        const report: SafetyReport = {
          id: `report-${Date.now()}`,
          targetType: type as any,
          targetId,
          reason: reason as any,
          details,
          createdAt: new Date().toISOString(),
          status: 'open',
        };
        setReports((current) => [report, ...current]);
      },
    }),
    [campus, loading, messages, reports, discoverableUsers, blockedUserIds]
  );

  return <CampusContext.Provider value={value}>{children}</CampusContext.Provider>;
}

export function useCampus() {
  const context = useContext(CampusContext);
  if (!context) throw new Error('useCampus must be used inside CampusProvider');
  return context;
}


