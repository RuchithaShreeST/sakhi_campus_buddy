export type TrustLabel = 'OFFICIAL' | 'VERIFIED' | 'COMMUNITY' | 'AI-ASSISTED' | 'Official' | 'Verified' | 'Community' | 'AI-assisted';

export type CampusCategory = 'Events' | 'Clubs' | 'Placements' | 'Study' | 'Announcements' | 'Resources';
export type CircleCategory = 'Campus' | 'Study' | 'Hobbies' | 'Friendship' | 'Placements' | 'Wellness';

export type CampusEvent = {
  id: string;
  title: string;
  category: CampusCategory;
  date: string;
  time: string;
  venue: string;
  organizer: string;
  description: string;
  trust: TrustLabel;
  saved: boolean;
  registered?: boolean;
  capacity?: number;
};

export type CampusClub = {
  id: string;
  name: string;
  category: string;
  description: string;
  members: number;
  trust: TrustLabel;
  joined: boolean;
  interests: string[];
  rules?: string[];
  adminName?: string;
  meetingTime?: string;
  location?: string;
};

export type CommunityPost = {
  id: string;
  title: string;
  body: string;
  category: CircleCategory;
  author: string;
  createdAt: string;
  replies: number;
  saved: boolean;
  upvotes?: number;
  userUpvoted?: boolean;
  comments?: PostComment[];
  commentsList?: PostComment[];
  reactions?: { upvote: number; heart: number; helpful: number };
};

export type PostComment = {
  id: string;
  postId: string;
  author: string;
  body: string;
  createdAt: string;
};

export type PlacementItem = {
  id: string;
  title: string;
  company: string;
  role: string;
  type: 'Full-time' | 'Internship' | 'Drive';
  deadline: string;
  salaryPackage?: string;
  requirements: string[];
  description: string;
  trust: TrustLabel;
  discussionsCount: number;
  registered: boolean;
};

export type PlacementDiscussion = {
  id: string;
  placementId: string;
  authorName: string;
  topic: 'interview' | 'aptitude' | 'coding' | 'resume' | 'general';
  content: string;
  createdAt: string;
  upvotes: number;
  anonymous?: boolean;
};

export type CampusQuestion = {
  id: string;
  question: string;
  details?: string;
  category: CampusCategory | 'General';
  authorName: string;
  anonymous: boolean;
  createdAt: string;
  answersCount: number;
  upvotes: number;
  saved?: boolean;
};

export type CampusAnswer = {
  id: string;
  questionId: string;
  authorName: string;
  content: string;
  createdAt: string;
  upvotes: number;
  isVerified?: boolean;
};

export type UserConnection = {
  id: string;
  name: string;
  targetUserId: string;
  targetUserName: string;
  avatar?: string;
  campusName?: string;
  campus?: string;
  year?: string;
  bio?: string;
  interests: string[];
  lookingFor?: string[];
  sharedInterests?: string[];
  status: 'pending' | 'accepted' | 'suggested' | 'pending_sent' | 'pending_received' | 'connected' | 'blocked';
  matchReason: string;
};

export type DirectMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
};

export type SafetyReport = {
  id: string;
  targetType: 'user' | 'post' | 'comment' | 'message' | 'club';
  targetId: string;
  reason: 'harassment' | 'spam' | 'scam' | 'impersonation' | 'inappropriate' | 'threat' | 'misinformation' | 'other';
  details?: string;
  createdAt: string;
  status?: 'open' | 'in_review' | 'actioned' | 'dismissed';
};

export type CampusState = {
  events: CampusEvent[];
  clubs: CampusClub[];
  posts: CommunityPost[];
  placements: PlacementItem[];
  questions: CampusQuestion[];
  connections: UserConnection[];
  interests: string[];
  notifications: number;
};

