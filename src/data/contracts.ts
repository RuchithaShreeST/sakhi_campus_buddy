import type {
  AnnouncementRow,
  CampusRow,
  ClubMemberRow,
  ClubRow,
  CommentRow,
  ConsentRow,
  ConnectionRow,
  DirectMessageRow,
  DsaProgressRow,
  EventRegistrationRow,
  EventRow,
  InterestRow,
  NotificationRow,
  AptitudeProgressRow,
  MockInterviewRow,
  PlacementRegistrationRow,
  PlacementRow,
  PlannerItemRow,
  PostRow,
  ProfileRow,
  ReactionRow,
  ReportRow,
  SakhiConversationRow,
  SakhiMemoryRow,
  Json,
  TrustLabel,
  WellnessLogRow,
  CycleEntryRow,
} from '@/types/database';

export type AuthUser = {
  id: string;
  email: string;
  emailVerified: boolean;
};

export type SignUpResult = {
  user: AuthUser;
  verificationRequired: boolean;
  demoVerificationCode?: string;
};

export interface AuthRepository {
  signUp(email: string, password: string): Promise<SignUpResult>;
  signIn(email: string, password: string): Promise<AuthUser>;
  verifyEmail(code: string): Promise<AuthUser>;
  resetPassword(email: string, newPassword: string): Promise<void>;
  signOut(): Promise<void>;
  currentUser(): Promise<AuthUser | null>;
}

export interface ProfileRepository {
  get(): Promise<ProfileRow | null>;
  save(profile: Partial<ProfileRow>): Promise<ProfileRow>;
  listCampuses(): Promise<CampusRow[]>;
  listInterests(): Promise<InterestRow[]>;
  listInterestOptions(): Promise<string[]>;
}

export type WellnessSummary = {
  days: number;
  score: number | null;
  breakdown: Record<string, number>;
  trend: WellnessLogRow[];
  medicalDisclaimer: string;
  burnoutSignal: boolean;
  suggestion: string;
};

export interface WellnessRepository {
  listLogs(days: number): Promise<WellnessLogRow[]>;
  saveLog(log: Partial<WellnessLogRow> & Pick<WellnessLogRow, 'logged_on'>): Promise<WellnessLogRow>;
  getSummary(days: number): Promise<WellnessSummary>;
  listCycleEntries(): Promise<CycleEntryRow[]>;
  saveCycleEntry(entry: Partial<CycleEntryRow> & Pick<CycleEntryRow, 'start_date'>): Promise<CycleEntryRow>;
  deleteCycleEntry(id: string): Promise<void>;
}

export interface PlannerRepository {
  list(): Promise<PlannerItemRow[]>;
  create(item: Partial<PlannerItemRow> & Pick<PlannerItemRow, 'title' | 'category'>): Promise<PlannerItemRow>;
  update(id: string, changes: Partial<PlannerItemRow>): Promise<PlannerItemRow>;
  remove(id: string): Promise<void>;
  getDailyTopThree(date: string): Promise<string[]>;
  setDailyTopThree(date: string, ids: string[]): Promise<void>;
}

export type SakhiChatChunk = {
  text: string;
  done: boolean;
  crisisSupport?: { phone: string; prompt: string };
};

export interface ChatRepository {
  list(): Promise<SakhiConversationRow[]>;
  streamReply(message: string, signal: AbortSignal): AsyncIterable<SakhiChatChunk>;
  listMemories(): Promise<SakhiMemoryRow[]>;
  saveMemory(memory: Pick<SakhiMemoryRow, 'label' | 'value'>): Promise<SakhiMemoryRow>;
  updateMemory(id: string, changes: Pick<SakhiMemoryRow, 'label' | 'value'>): Promise<SakhiMemoryRow>;
  deleteMemory(id: string): Promise<void>;
}

export interface CampusRepository {
  listAnnouncements(): Promise<AnnouncementRow[]>;
  listClubs(): Promise<ClubRow[]>;
  listClubMemberships(): Promise<ClubMemberRow[]>;
  joinClub(clubId: string): Promise<ClubMemberRow>;
  leaveClub(clubId: string): Promise<void>;
  listEvents(): Promise<EventRow[]>;
  listEventRegistrations(): Promise<EventRegistrationRow[]>;
  listSavedEvents(): Promise<string[]>;
  saveEvent(eventId: string, saved: boolean): Promise<void>;
  registerEvent(eventId: string): Promise<EventRegistrationRow>;
  listPlacements(): Promise<PlacementRow[]>;
  listPlacementRegistrations(): Promise<PlacementRegistrationRow[]>;
  registerPlacement(placementId: string): Promise<PlacementRegistrationRow>;
}

export interface CircleRepository {
  listPosts(): Promise<PostRow[]>;
  createPost(post: Pick<PostRow, 'title' | 'body' | 'category'> & { anonymous: boolean }): Promise<PostRow>;
  listComments(postId: string): Promise<CommentRow[]>;
  createComment(postId: string, body: string): Promise<CommentRow>;
  listReactions(): Promise<ReactionRow[]>;
  toggleReaction(target: { postId?: string; commentId?: string }, type: ReactionRow['reaction_type']): Promise<ReactionRow>;
  listConnections(): Promise<ConnectionRow[]>;
  listDiscoverableProfiles(): Promise<ProfileRow[]>;
  listBlockedUsers(): Promise<string[]>;
  requestConnection(recipientId: string, reason?: string): Promise<ConnectionRow>;
  listMessages(): Promise<DirectMessageRow[]>;
  markMessagesRead(): Promise<void>;
  sendMessage(recipientId: string, text: string): Promise<DirectMessageRow>;
  report(input: Pick<ReportRow, 'target_type' | 'target_id' | 'reason' | 'details'>): Promise<ReportRow>;
  block(userId: string): Promise<void>;
}

export interface NotificationRepository {
  list(): Promise<NotificationRow[]>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(changes: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
}

export type NotificationPreferences = {
  campus: boolean;
  planner: boolean;
  wellness: boolean;
  circle: boolean;
};

export interface PlacementPrepRepository {
  listDsaProgress(): Promise<DsaProgressRow[]>;
  saveDsaProgress(topic: string, completedCount: number, targetCount: number): Promise<DsaProgressRow>;
  listAptitudeProgress(): Promise<AptitudeProgressRow[]>;
  saveAptitudeProgress(section: string, score: number | null): Promise<AptitudeProgressRow>;
  getResumeData(): Promise<Json | null>;
  saveResumeData(resume: Json): Promise<void>;
  listMockInterviews(): Promise<MockInterviewRow[]>;
  saveMockInterview(interview: Pick<MockInterviewRow, 'role' | 'questions' | 'responses' | 'score' | 'completed_at'>): Promise<MockInterviewRow>;
}

export interface ConsentRepository {
  get(): Promise<ConsentRow>;
  update(changes: Partial<Pick<ConsentRow, 'ai_memory_opt_in' | 'cycle_tracking_opt_in' | 'discovery_visible'>>): Promise<ConsentRow>;
}

export interface AccountRepository {
  exportData(): Promise<Record<string, unknown>>;
  deleteAccount(): Promise<void>;
}

export type SakhiRepositories = {
  auth: AuthRepository;
  profile: ProfileRepository;
  wellness: WellnessRepository;
  planner: PlannerRepository;
  chat: ChatRepository;
  campus: CampusRepository;
  circle: CircleRepository;
  notifications: NotificationRepository;
  placementPrep: PlacementPrepRepository;
  consents: ConsentRepository;
  account: AccountRepository;
  preferences: PreferencesRepository;
};

export type ContentTrust = TrustLabel;

export type ThemePreference = 'light' | 'dark';

export interface PreferencesRepository {
  getTheme(): ThemePreference;
  setTheme(theme: ThemePreference): void;
  getRuntimeStatus(): { offline: boolean; simulatedError: boolean };
}
