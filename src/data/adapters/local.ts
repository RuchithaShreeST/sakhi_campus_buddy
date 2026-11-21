import type {
  AptitudeProgressRow,
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
  MockInterviewRow,
  PlacementRegistrationRow,
  PlacementRow,
  PlannerItemRow,
  PostRow,
  ProfileRow,
  ResumeDataRow,
  ReactionRow,
  ReportRow,
  SakhiConversationRow,
  SakhiMemoryRow,
  WellnessLogRow,
  CycleEntryRow,
} from '@/types/database';
import type { AuthUser, NotificationPreferences, SakhiRepositories, WellnessSummary } from '../contracts';
import { browserPreferences } from './preferences.ts';

const STORAGE_KEY = 'sakhi.web.local.v2';
const LEGACY_STORAGE_KEY = 'sakhi.web.local.v1';
const DEMO_CAMPUS_ID = 'demo-campus';
const DEMO_USER_ID = 'demo-user';

type LocalState = {
  authUser: AuthUser | null;
  authCredentials: { email: string; salt: string; passwordHash: string; userId?: string }[];
  pendingVerification: { user: AuthUser; code: string } | null;
  profile: ProfileRow | null;
  campuses: CampusRow[];
  interests: InterestRow[];
  consents: ConsentRow;
  wellnessLogs: WellnessLogRow[];
  cycleEntries: CycleEntryRow[];
  plannerItems: PlannerItemRow[];
  dailyTopThree: Record<string, string[]>;
  conversations: SakhiConversationRow[];
  memories: SakhiMemoryRow[];
  announcements: AnnouncementRow[];
  clubs: ClubRow[];
  clubMembers: ClubMemberRow[];
  events: EventRow[];
  eventRegistrations: EventRegistrationRow[];
  savedEvents: { user_id: string; event_id: string }[];
  placements: PlacementRow[];
  placementRegistrations: PlacementRegistrationRow[];
  dsaProgress: DsaProgressRow[];
  aptitudeProgress: AptitudeProgressRow[];
  resumeData: ResumeDataRow | null;
  mockInterviews: MockInterviewRow[];
  posts: PostRow[];
  comments: CommentRow[];
  reactions: ReactionRow[];
  connections: ConnectionRow[];
  messages: DirectMessageRow[];
  reports: ReportRow[];
  blocks: { blocker_id: string; blocked_id: string }[];
  notifications: NotificationRow[];
  notificationPreferences: NotificationPreferences;
};

const ARRAY_STATE_KEYS = [
  'authCredentials',
  'campuses',
  'interests',
  'wellnessLogs',
  'cycleEntries',
  'plannerItems',
  'conversations',
  'memories',
  'announcements',
  'clubs',
  'clubMembers',
  'events',
  'eventRegistrations',
  'savedEvents',
  'placements',
  'placementRegistrations',
  'dsaProgress',
  'aptitudeProgress',
  'mockInterviews',
  'posts',
  'comments',
  'reactions',
  'connections',
  'messages',
  'reports',
  'blocks',
  'notifications',
] as const satisfies readonly (keyof LocalState)[];

const now = () => new Date().toISOString();
const today = () => now().slice(0, 10);
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const stamp = () => ({ created_at: now(), updated_at: now(), deleted_at: null });
const relativeDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

function createInitialState(): LocalState {
  const created = now();
  const todayKey = today();
  return {
    authUser: null,
    authCredentials: [],
    pendingVerification: null,
    profile: null,
    campuses: [{
      id: DEMO_CAMPUS_ID,
      name: 'Demo Campus',
      city: 'Demo City',
      state: 'Demo Region',
      allowed_email_domains: [],
      ...stamp(),
    }],
    interests: [],
    consents: {
      user_id: DEMO_USER_ID,
      ai_memory_opt_in: false,
      cycle_tracking_opt_in: false,
      discovery_visible: false,
      ai_memory_consent_at: null,
      cycle_tracking_consent_at: null,
      created_at: created,
      updated_at: created,
    },
    wellnessLogs: [{
      id: 'demo-wellness-today',
      user_id: DEMO_USER_ID,
      logged_on: todayKey,
      mood: null,
      mood_note: null,
      sleep_hours: null,
      water_ml: 0,
      steps: 0,
      exercise_minutes: 0,
      activity_minutes: 0,
      ...stamp(),
    }],
    cycleEntries: [],
    plannerItems: [{
      id: 'demo-planner-today',
      user_id: DEMO_USER_ID,
      title: 'Demo: plan one small task',
      category: 'Study',
      date_key: todayKey,
      start_time: null,
      duration_minutes: 25,
      completed: false,
      ...stamp(),
    }],
    dailyTopThree: {},
    conversations: [],
    memories: [],
    announcements: [{
      id: 'demo-announcement',
      campus_id: DEMO_CAMPUS_ID,
      title: 'Demo campus update',
      body: 'Sample notice for preview only; this is not an official campus announcement.',
      author_name: 'Demo Campus',
      trust_label: 'community',
      moderation_status: 'active',
      ...stamp(),
    }],
    clubs: [{
      id: 'demo-club',
      campus_id: DEMO_CAMPUS_ID,
      name: 'Demo Study Circle',
      category: 'Study',
      description: 'Sample club for exploring the campus experience.',
      meeting_time: 'Demo schedule',
      location: 'Demo room',
      lead_name: 'Demo club lead',
      trust_label: 'community',
      moderation_status: 'active',
      ...stamp(),
    }],
    clubMembers: [],
    events: [{
      id: 'demo-event',
      campus_id: DEMO_CAMPUS_ID,
      title: 'Demo campus welcome session',
      starts_at: relativeDate(5),
      ends_at: null,
      venue: 'Demo hall',
      organizer: 'Demo campus team',
      category: 'Community',
      description: 'A generated sample event for preview. Details are not real.',
      capacity: 30,
      trust_label: 'community',
      moderation_status: 'active',
      ...stamp(),
    }],
    eventRegistrations: [],
    savedEvents: [],
    placements: [{
      id: 'demo-placement',
      campus_id: DEMO_CAMPUS_ID,
      company: 'Demo employer',
      role: 'Demo internship role',
      type: 'Internship',
      ctc: null,
      eligibility: 'Demo eligibility details',
      deadline: relativeDate(18),
      description: 'Synthetic listing for preview only. This is not a real opportunity.',
      trust_label: 'community',
      moderation_status: 'active',
      ...stamp(),
    }],
    placementRegistrations: [],
    dsaProgress: [],
    aptitudeProgress: [],
    resumeData: null,
    mockInterviews: [],
    posts: [{
      id: 'demo-post',
      user_id: DEMO_USER_ID,
      is_anonymous: true,
      author_id: null,
      campus_id: DEMO_CAMPUS_ID,
      title: 'Demo: welcome to Circle',
      body: 'This sample post is here to preview the community feed.',
      category: 'Campus',
      trust_label: 'community',
      moderation_status: 'active',
      ...stamp(),
    }],
    comments: [],
    reactions: [],
    connections: [],
    messages: [],
    reports: [],
    blocks: [],
    notifications: [{
      id: 'demo-notification',
      user_id: DEMO_USER_ID,
      category: 'campus',
      title: 'Demo notification',
      body: 'Sample notification content.',
      read_at: null,
      ...stamp(),
    }],
    notificationPreferences: { campus: true, planner: true, wellness: true, circle: true },
  };
}

let memoryState: LocalState | null = null;

function getState(): LocalState {
  if (memoryState) return memoryState;
  if (typeof window === 'undefined') return (memoryState = createInitialState());
  const saved = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!saved) return (memoryState = createInitialState());
  let parsed: unknown;
  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error('Local Sakhi data could not be read. Clear local app data to continue.');
  }
  if (!isRecord(parsed)) throw new Error('Local Sakhi data has an invalid shape. Clear local app data to continue.');
  for (const key of ARRAY_STATE_KEYS) {
    if (key in parsed && !Array.isArray(parsed[key])) {
      throw new Error(`Local Sakhi data has an invalid ${key} value. Clear local app data to continue.`);
    }
  }
  const savedTopThree = parsed.dailyTopThree;
  if (savedTopThree !== undefined && (!isRecord(savedTopThree) || Object.values(savedTopThree).some((ids) => !isStringArray(ids)))) {
    throw new Error('Local Sakhi data has invalid daily priorities. Clear local app data to continue.');
  }
  const savedNotificationPreferences = parsed.notificationPreferences;
  if (
    savedNotificationPreferences !== undefined &&
    (!isRecord(savedNotificationPreferences) ||
      Object.keys(savedNotificationPreferences).some((key) => !['campus', 'planner', 'wellness', 'circle'].includes(key)) ||
      Object.values(savedNotificationPreferences).some((value) => typeof value !== 'boolean'))
  ) {
    throw new Error('Local Sakhi data has invalid notification preferences. Clear local app data to continue.');
  }
  const defaults = createInitialState();
  const state = {
    ...defaults,
    ...parsed,
    savedEvents: Array.isArray(parsed.savedEvents) ? parsed.savedEvents : defaults.savedEvents,
    dsaProgress: Array.isArray(parsed.dsaProgress) ? parsed.dsaProgress : defaults.dsaProgress,
    aptitudeProgress: Array.isArray(parsed.aptitudeProgress) ? parsed.aptitudeProgress : defaults.aptitudeProgress,
    mockInterviews: Array.isArray(parsed.mockInterviews) ? parsed.mockInterviews : defaults.mockInterviews,
    dailyTopThree: isRecord(parsed.dailyTopThree) ? parsed.dailyTopThree : defaults.dailyTopThree,
    notificationPreferences: isRecord(parsed.notificationPreferences)
      ? { ...defaults.notificationPreferences, ...parsed.notificationPreferences }
      : defaults.notificationPreferences,
  } as LocalState;
  memoryState = state;
  saveState(state);
  window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  return memoryState;
}

function saveState(next: LocalState) {
  memoryState = next;
  if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

async function latency() {
  await new Promise((resolve) => window.setTimeout(resolve, 180));
  if (new URLSearchParams(window.location.search).has('demoError')) {
    throw new Error('Simulated local-adapter failure. Remove ?demoError to retry.');
  }
}

const activeUserId = () => getState().authUser?.id ?? DEMO_USER_ID;
const dailyPriorityKey = (userId: string, date: string) => `${userId}:${date}`;

async function digestPassword(password: string, salt: string) {
  const encoded = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey('raw', encoded, 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256
  );
  return Array.from(new Uint8Array(bits), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function userFor(email: string, emailVerified = false): AuthUser {
  return { id: makeId('user'), email, emailVerified };
}

function buildSummary(logs: WellnessLogRow[], days: number): WellnessSummary {
  const meaningfulLogs = logs.filter((log) =>
    log.mood !== null ||
    log.sleep_hours !== null ||
    (log.water_ml ?? 0) > 0 ||
    (log.steps ?? 0) > 0 ||
    (log.activity_minutes ?? 0) > 0 ||
    (log.exercise_minutes ?? 0) > 0
  );
  const sleep = meaningfulLogs.filter((log) => log.sleep_hours !== null);
  const water = meaningfulLogs.filter((log) => log.water_ml !== null && log.water_ml > 0);
  const averageSleep = sleep.length ? sleep.reduce((sum, row) => sum + (row.sleep_hours ?? 0), 0) / sleep.length : 0;
  const averageWater = water.length ? water.reduce((sum, row) => sum + (row.water_ml ?? 0), 0) / water.length : 0;
  const breakdown = {
    sleep: Math.max(0, Math.min(30, averageSleep / 8 * 30)),
    movement: Math.max(0, Math.min(20, meaningfulLogs.reduce((sum, row) => sum + (row.exercise_minutes ?? row.activity_minutes ?? 0), 0) / Math.max(meaningfulLogs.length, 1) / 30 * 20)),
    hydration: Math.max(0, Math.min(25, averageWater / 2000 * 25)),
    checkIns: meaningfulLogs.some((row) => row.mood !== null) ? 25 : 0,
  };
  const score = meaningfulLogs.length ? Math.max(0, Math.min(100, Math.round(Object.values(breakdown).reduce((sum, value) => sum + value, 0)))) : null;
  const burnoutSignal = meaningfulLogs.length >= 3 && (
    (sleep.length > 0 && averageSleep < 6.5) ||
    meaningfulLogs.filter((row) => ['low', 'stressed', 'tired'].includes(row.mood ?? '')).length >= 2
  );
  return {
    days,
    score,
    breakdown,
    trend: logs,
    medicalDisclaimer: 'Sakhi insights are supportive and are not medical advice.',
    burnoutSignal,
    suggestion: burnoutSignal
      ? 'Consider a smaller workload, a real break, and an earlier wind-down.'
      : 'Choose one small supportive step for today.',
  };
}

function sortNewest<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function insertConversation(role: SakhiConversationRow['role'], message: string) {
  const state = getState();
  const row: SakhiConversationRow = {
    id: makeId('message'),
    user_id: activeUserId(),
    role,
    message,
    summary: null,
    deleted_at: null,
    created_at: now(),
  };
  state.conversations.push(row);
  saveState(state);
}

function responseFor(message: string) {
  if (/\b(suicid|kill myself|end my life|self harm|hurt myself|don't want to live|do not want to live)\b/i.test(message)) {
    return {
      text: 'I’m really sorry this feels heavy. You deserve support from a real person right now. Please call Tele-MANAS at 14416 and reach out to someone you trust who can stay with you.',
      crisisSupport: { phone: '14416', prompt: 'Can you contact a trusted person and let them know you need support right now?' },
    };
  }
  if (/mock interview reflection/i.test(message)) {
    return { text: 'Thank you for practising. You might reflect on one specific example, what you did, and what you learned. Keep your answer in your own voice; there is no single perfect response.' };
  }
  if (/\bstudy|exam|assignment|dsa|placement|interview\b/i.test(message)) {
    return { text: 'Let’s make it manageable: choose one small task, work on it for 25 minutes, then take a real break.' };
  }
  if (/\blonely|alone|friend|people\b/i.test(message)) {
    return { text: 'I’m here with you. If it feels right, we can think of one low-pressure way to connect with someone you trust or a campus group.' };
  }
  if (/\btired|sleep|exhausted|burnout\b/i.test(message)) {
    return { text: 'Your energy matters. A pause, a glass of water, or an earlier wind-down may be more helpful than pushing through.' };
  }
  return { text: 'I’m glad you told me. What would feel like one kind, helpful next step for you right now?' };
}

const localPlacementPrep: SakhiRepositories['placementPrep'] = {
  listDsaProgress: async () => {
    await latency();
    return getState().dsaProgress.filter((row) => row.user_id === activeUserId() && !row.deleted_at);
  },
  saveDsaProgress: async (topic, completedCount, targetCount) => {
    await latency();
    if (!Number.isInteger(completedCount) || completedCount < 0 || !Number.isInteger(targetCount) || targetCount < 1 || completedCount > targetCount) {
      throw new Error('Progress must be a whole number between zero and the target.');
    }
    const state = getState();
    const existing = state.dsaProgress.find((row) => row.user_id === activeUserId() && row.topic === topic);
    if (existing) {
      existing.completed_count = completedCount;
      existing.target_count = targetCount;
      existing.updated_at = now();
      saveState(state);
      return existing;
    }
    const row: DsaProgressRow = {
      id: makeId('dsa'),
      user_id: activeUserId(),
      topic,
      completed_count: completedCount,
      target_count: targetCount,
      updated_at: now(),
      deleted_at: null,
    };
    state.dsaProgress.push(row);
    saveState(state);
    return row;
  },
  listAptitudeProgress: async () => {
    await latency();
    return getState().aptitudeProgress.filter((row) => row.user_id === activeUserId() && !row.deleted_at);
  },
  saveAptitudeProgress: async (section, score) => {
    await latency();
    if (score !== null && (!Number.isFinite(score) || score < 0 || score > 100)) throw new Error('Enter a score from 0 to 100.');
    const state = getState();
    const existing = state.aptitudeProgress.find((row) => row.user_id === activeUserId() && row.section === section);
    if (existing) {
      existing.score = score;
      existing.attempts += 1;
      existing.updated_at = now();
      saveState(state);
      return existing;
    }
    const row: AptitudeProgressRow = {
      id: makeId('aptitude'),
      user_id: activeUserId(),
      section,
      score,
      attempts: 1,
      updated_at: now(),
      deleted_at: null,
    };
    state.aptitudeProgress.push(row);
    saveState(state);
    return row;
  },
  getResumeData: async () => {
    await latency();
    const resume = getState().resumeData;
    return resume?.user_id === activeUserId() ? resume.resume_json : null;
  },
  saveResumeData: async (resume) => {
    await latency();
    const state = getState();
    state.resumeData = { user_id: activeUserId(), resume_json: resume, updated_at: now(), deleted_at: null };
    saveState(state);
  },
  listMockInterviews: async () => {
    await latency();
    return getState().mockInterviews.filter((row) => row.user_id === activeUserId());
  },
  saveMockInterview: async (interview) => {
    await latency();
    const row: MockInterviewRow = {
      id: makeId('interview'),
      user_id: activeUserId(),
      ...interview,
      created_at: now(),
    };
    const state = getState();
    state.mockInterviews.unshift(row);
    saveState(state);
    return row;
  },
};

export const localRepositories: SakhiRepositories = {
  preferences: browserPreferences,
  auth: {
    signUp: async (email, password) => {
      await latency();
      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) throw new Error('Enter a valid email address.');
      if (password.length < 8) throw new Error('Use a password with at least 8 characters.');
      const state = getState();
      if (state.authCredentials.some((credential) => credential.email === cleanEmail)) throw new Error('An account already exists for this email.');
      const salt = crypto.randomUUID();
      const passwordHash = await digestPassword(password, salt);
      const user = userFor(cleanEmail);
      const code = crypto.randomUUID().replaceAll('-', '').slice(0, 8);
      state.authCredentials.push({ email: cleanEmail, salt, passwordHash, userId: user.id });
      state.pendingVerification = { user, code };
      saveState(state);
      return { user, verificationRequired: true, demoVerificationCode: code };
    },
    signIn: async (email, password) => {
      await latency();
      const state = getState();
      const credential = state.authCredentials.find((item) => item.email === email.trim().toLowerCase());
      if (!credential || credential.passwordHash !== await digestPassword(password, credential.salt)) {
        throw new Error('Email or password is incorrect.');
      }
      if (state.pendingVerification?.user.email === credential.email) throw new Error('Please verify your email before signing in.');
      const user: AuthUser = { id: credential.userId ?? state.profile?.id ?? makeId('user'), email: credential.email, emailVerified: true };
      credential.userId = user.id;
      state.authUser = user;
      state.consents.user_id = user.id;
      saveState(state);
      return user;
    },
    verifyEmail: async (code) => {
      await latency();
      const state = getState();
      if (!state.pendingVerification || state.pendingVerification.code !== code.trim()) throw new Error('That verification code is not valid.');
      const user = { ...state.pendingVerification.user, emailVerified: true };
      state.authUser = user;
      state.pendingVerification = null;
      state.consents.user_id = user.id;
      saveState(state);
      return user;
    },
    resetPassword: async (email, newPassword) => {
      await latency();
      const credential = getState().authCredentials.find((item) => item.email === email.trim().toLowerCase());
      if (!credential) {
        throw new Error('No local demo account exists for that email.');
      }
      if (newPassword.length < 8) throw new Error('Use a password with at least 8 characters.');
      const salt = crypto.randomUUID();
      credential.salt = salt;
      credential.passwordHash = await digestPassword(newPassword, salt);
      saveState(getState());
    },
    signOut: async () => {
      await latency();
      const state = getState();
      state.authUser = null;
      saveState(state);
    },
    currentUser: async () => {
      await latency();
      return getState().authUser;
    },
  },
  profile: {
    get: async () => {
      await latency();
      const profile = getState().profile;
      return profile?.id === activeUserId() ? profile : null;
    },
    save: async (changes) => {
      await latency();
      const state = getState();
      const existing = state.profile?.id === activeUserId() ? state.profile : null;
      const profile: ProfileRow = {
        ...stamp(),
        ...(existing ?? {}),
        ...changes,
        id: activeUserId(),
        display_name: changes.display_name ?? existing?.display_name ?? '',
        pronouns: changes.pronouns ?? existing?.pronouns ?? null,
        bio: changes.bio ?? existing?.bio ?? null,
        avatar_url: changes.avatar_url ?? existing?.avatar_url ?? null,
        campus_name: changes.campus_name ?? existing?.campus_name ?? null,
        course: changes.course ?? existing?.course ?? null,
        year: changes.year ?? existing?.year ?? null,
        city: changes.city ?? existing?.city ?? null,
        interests: changes.interests ?? existing?.interests ?? [],
        looking_for: changes.looking_for ?? existing?.looking_for ?? [],
        discovery_visible: changes.discovery_visible ?? existing?.discovery_visible ?? false,
        verified: existing?.verified ?? false,
        deleted_at: null,
      };
      state.profile = profile;
      saveState(state);
      return profile;
    },
    listCampuses: async () => {
      await latency();
      return getState().campuses;
    },
    listInterests: async () => {
      await latency();
      return getState().interests.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    listInterestOptions: async () => {
      await latency();
      return ['Study groups', 'Creative projects', 'Wellbeing', 'Technology', 'Sports', 'Arts and culture', 'Career growth', 'Community'];
    },
  },
  wellness: {
    listLogs: async (days) => {
      await latency();
      const earliest = new Date();
      earliest.setDate(earliest.getDate() - Math.max(days, 1));
      return getState().wellnessLogs
        .filter((item) => item.user_id === activeUserId() && !item.deleted_at && new Date(item.logged_on) >= earliest)
        .sort((a, b) => a.logged_on.localeCompare(b.logged_on));
    },
    saveLog: async (changes) => {
      await latency();
      const state = getState();
      const existing = state.wellnessLogs.find((item) => item.user_id === activeUserId() && item.logged_on === changes.logged_on);
      if (existing) Object.assign(existing, changes, { updated_at: now() });
      else {
        state.wellnessLogs.push({
          id: makeId('wellness'),
          user_id: activeUserId(),
          logged_on: changes.logged_on,
          mood: changes.mood ?? null,
          mood_note: changes.mood_note ?? null,
          sleep_hours: changes.sleep_hours ?? null,
          water_ml: changes.water_ml ?? null,
          steps: changes.steps ?? null,
          exercise_minutes: changes.exercise_minutes ?? null,
          activity_minutes: changes.activity_minutes ?? null,
          ...stamp(),
        });
      }
      saveState(state);
      return state.wellnessLogs.find((item) => item.user_id === activeUserId() && item.logged_on === changes.logged_on)!;
    },
    getSummary: async (days) => {
      await latency();
      const earliest = new Date();
      earliest.setDate(earliest.getDate() - Math.max(days, 1));
      const logs = getState().wellnessLogs.filter((item) => item.user_id === activeUserId() && !item.deleted_at && new Date(item.logged_on) >= earliest);
      return buildSummary(logs, days);
    },
    listCycleEntries: async () => {
      await latency();
      const state = getState();
      if (!state.consents.cycle_tracking_opt_in) return [];
      return state.cycleEntries.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    saveCycleEntry: async (entry) => {
      await latency();
      const state = getState();
      if (!state.consents.cycle_tracking_opt_in) throw new Error('Enable cycle tracking consent before saving cycle data.');
      const row: CycleEntryRow = {
        id: makeId('cycle'),
        user_id: activeUserId(),
        start_date: entry.start_date,
        end_date: entry.end_date ?? null,
        flow: entry.flow ?? null,
        symptoms: entry.symptoms ?? [],
        cramps_severity: entry.cramps_severity ?? null,
        bloating: entry.bloating ?? false,
        headache: entry.headache ?? false,
        fatigue: entry.fatigue ?? false,
        notes: entry.notes ?? null,
        ...stamp(),
      };
      state.cycleEntries.push(row);
      saveState(state);
      return row;
    },
    deleteCycleEntry: async (id) => {
      await latency();
      const state = getState();
      state.cycleEntries = state.cycleEntries.filter((item) => item.id !== id || item.user_id !== activeUserId());
      saveState(state);
    },
  },
  planner: {
    list: async () => {
      await latency();
      return getState().plannerItems.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    create: async (item) => {
      await latency();
      const state = getState();
      const row: PlannerItemRow = {
        id: makeId('planner'),
        user_id: activeUserId(),
        title: item.title,
        category: item.category,
        date_key: item.date_key ?? today(),
        start_time: item.start_time ?? null,
        duration_minutes: item.duration_minutes ?? null,
        completed: item.completed ?? false,
        ...stamp(),
      };
      state.plannerItems.push(row);
      saveState(state);
      return row;
    },
    update: async (id, changes) => {
      await latency();
      const state = getState();
      const row = state.plannerItems.find((item) => item.id === id && item.user_id === activeUserId());
      if (!row) throw new Error('Planner item not found.');
      const previousDate = row.date_key ?? today();
      Object.assign(row, changes, { updated_at: now() });
      if (changes.completed || (changes.date_key && changes.date_key !== previousDate)) {
        const key = dailyPriorityKey(activeUserId(), previousDate);
        state.dailyTopThree[key] = (state.dailyTopThree[key] ?? []).filter((itemId) => itemId !== id);
      }
      saveState(state);
      return row;
    },
    remove: async (id) => {
      await latency();
      const state = getState();
      const row = state.plannerItems.find((item) => item.id === id && item.user_id === activeUserId());
      if (row) {
        row.deleted_at = now();
        const key = dailyPriorityKey(activeUserId(), row.date_key ?? today());
        state.dailyTopThree[key] = (state.dailyTopThree[key] ?? []).filter((itemId) => itemId !== id);
      }
      saveState(state);
    },
    getDailyTopThree: async (date) => {
      await latency();
      return getState().dailyTopThree[dailyPriorityKey(activeUserId(), date)] ?? [];
    },
    setDailyTopThree: async (date, ids) => {
      await latency();
      if (ids.length > 3 || new Set(ids).size !== ids.length) throw new Error('Choose up to three different priorities.');
      const state = getState();
      const validIds = new Set(state.plannerItems.filter((item) => item.user_id === activeUserId() && item.date_key === date && !item.deleted_at && !item.completed).map((item) => item.id));
      if (ids.some((id) => !validIds.has(id))) throw new Error('A priority must be an incomplete plan item for that day.');
      state.dailyTopThree[dailyPriorityKey(activeUserId(), date)] = ids;
      saveState(state);
    },
  },
  placementPrep: localPlacementPrep,
  chat: {
    list: async () => {
      await latency();
      return getState().conversations.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    streamReply: async function* (message, signal) {
      await latency();
      const reply = responseFor(message);
      insertConversation('user', message);
      const words = reply.text.split(/(\s+)/);
      let output = '';
      for (const word of words) {
        if (signal.aborted) {
          yield { text: '', done: true };
          return;
        }
        await new Promise((resolve) => window.setTimeout(resolve, 45));
        output += word;
        yield {
          text: word,
          done: false,
          ...(reply.crisisSupport ? { crisisSupport: reply.crisisSupport } : {}),
        };
      }
      insertConversation('assistant', output);
      yield { text: '', done: true };
    },
    listMemories: async () => {
      await latency();
      if (!getState().consents.ai_memory_opt_in) return [];
      return getState().memories.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    saveMemory: async (memory) => {
      await latency();
      const state = getState();
      if (!state.consents.ai_memory_opt_in) throw new Error('Enable AI memory consent before saving a memory.');
      const row: SakhiMemoryRow = {
        id: makeId('memory'),
        user_id: activeUserId(),
        label: memory.label,
        value: memory.value,
        ...stamp(),
      };
      state.memories.unshift(row);
      saveState(state);
      return row;
    },
    updateMemory: async (id, changes) => {
      await latency();
      const state = getState();
      const row = state.memories.find((item) => item.id === id && item.user_id === activeUserId());
      if (!row) throw new Error('Memory not found.');
      Object.assign(row, changes, { updated_at: now() });
      saveState(state);
      return row;
    },
    deleteMemory: async (id) => {
      await latency();
      const state = getState();
      state.memories = state.memories.filter((item) => item.id !== id || item.user_id !== activeUserId());
      saveState(state);
    },
  },
  campus: {
    listAnnouncements: async () => { await latency(); return getState().announcements.filter((item) => !item.deleted_at); },
    listClubs: async () => { await latency(); return getState().clubs.filter((item) => !item.deleted_at); },
    listClubMemberships: async () => {
      await latency();
      return getState().clubMembers.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    joinClub: async (clubId) => {
      await latency();
      const state = getState();
      const existing = state.clubMembers.find((item) => item.club_id === clubId && item.user_id === activeUserId());
      if (existing) {
        existing.deleted_at = null;
        return existing;
      }
      const member: ClubMemberRow = { club_id: clubId, user_id: activeUserId(), role: 'member', deleted_at: null, joined_at: now() };
      state.clubMembers.push(member);
      saveState(state);
      return member;
    },
    leaveClub: async (clubId) => {
      await latency();
      const state = getState();
      const existing = state.clubMembers.find((item) => item.club_id === clubId && item.user_id === activeUserId());
      if (existing) existing.deleted_at = now();
      saveState(state);
    },
    listEvents: async () => { await latency(); return getState().events.filter((item) => !item.deleted_at); },
    listEventRegistrations: async () => {
      await latency();
      return getState().eventRegistrations.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    listSavedEvents: async () => {
      await latency();
      return getState().savedEvents.filter((item) => item.user_id === activeUserId()).map((item) => item.event_id);
    },
    saveEvent: async (eventId, saved) => {
      await latency();
      const state = getState();
      state.savedEvents = state.savedEvents.filter((item) => !(item.user_id === activeUserId() && item.event_id === eventId));
      if (saved) state.savedEvents.push({ user_id: activeUserId(), event_id: eventId });
      saveState(state);
    },
    registerEvent: async (eventId) => {
      await latency();
      const state = getState();
      const event = state.events.find((item) => item.id === eventId);
      if (!event) throw new Error('Event not found.');
      const existing = state.eventRegistrations.find((item) => item.event_id === eventId && item.user_id === activeUserId());
      if (existing && existing.status !== 'cancelled' && !existing.deleted_at) return existing;
      const activeCount = state.eventRegistrations.filter((item) => item.event_id === eventId && item.status === 'registered').length;
      const status = event.capacity !== null && activeCount >= event.capacity ? 'waitlisted' : 'registered';
      const registration: EventRegistrationRow = {
        event_id: eventId,
        user_id: activeUserId(),
        status,
        registered_at: now(),
        deleted_at: null,
      };
      state.eventRegistrations = state.eventRegistrations.filter((item) => !(item.event_id === eventId && item.user_id === activeUserId()));
      state.eventRegistrations.push(registration);
      saveState(state);
      return registration;
    },
    listPlacements: async () => { await latency(); return getState().placements.filter((item) => !item.deleted_at); },
    listPlacementRegistrations: async () => {
      await latency();
      return getState().placementRegistrations.filter((item) => item.user_id === activeUserId() && !item.deleted_at);
    },
    registerPlacement: async (placementId) => {
      await latency();
      const state = getState();
      const registration: PlacementRegistrationRow = { placement_id: placementId, user_id: activeUserId(), registered_at: now(), deleted_at: null };
      state.placementRegistrations = state.placementRegistrations.filter((item) => !(item.placement_id === placementId && item.user_id === activeUserId()));
      state.placementRegistrations.push(registration);
      saveState(state);
      return registration;
    },
  },
  circle: {
    listPosts: async () => { await latency(); return sortNewest(getState().posts.filter((item) => !item.deleted_at)); },
    createPost: async (post) => {
      await latency();
      const state = getState();
      const { anonymous, ...content } = post;
      const row: PostRow = { id: makeId('post'), user_id: activeUserId(), is_anonymous: anonymous, author_id: anonymous ? null : activeUserId(), campus_id: null, ...content, trust_label: 'community', moderation_status: 'active', ...stamp() };
      state.posts.unshift(row);
      saveState(state);
      return row;
    },
    listComments: async (postId) => { await latency(); return sortNewest(getState().comments.filter((item) => item.post_id === postId && !item.deleted_at)); },
    createComment: async (postId, body) => {
      await latency();
      const state = getState();
      const row: CommentRow = { id: makeId('comment'), user_id: activeUserId(), post_id: postId, author_id: activeUserId(), body, trust_label: 'community', moderation_status: 'active', ...stamp() };
      state.comments.push(row);
      saveState(state);
      return row;
    },
    listReactions: async () => {
      await latency();
      return getState().reactions.filter((row) => row.user_id === activeUserId() && !row.deleted_at);
    },
    toggleReaction: async (target, type) => {
      await latency();
      const state = getState();
      const existing = state.reactions.find((row) => row.user_id === activeUserId() && row.reaction_type === type && row.post_id === (target.postId ?? null) && row.comment_id === (target.commentId ?? null));
      if (existing) {
        state.reactions = state.reactions.filter((row) => row.id !== existing.id);
        saveState(state);
        return existing;
      }
      if (Boolean(target.postId) === Boolean(target.commentId)) throw new Error('React to one post or comment at a time.');
      const row: ReactionRow = { id: makeId('reaction'), user_id: activeUserId(), post_id: target.postId ?? null, comment_id: target.commentId ?? null, reaction_type: type, deleted_at: null, created_at: now() };
      state.reactions.push(row);
      saveState(state);
      return row;
    },
    listConnections: async () => { await latency(); return getState().connections.filter((item) => item.requester_id === activeUserId() || item.recipient_id === activeUserId()); },
    listDiscoverableProfiles: async () => {
      await latency();
      if (!getState().consents.discovery_visible) return [];
      return ['demo-peer-a', 'demo-peer-b'].map((id) => ({
        id,
        display_name: 'Demo peer',
        pronouns: null,
        bio: 'Synthetic profile for exploring opt-in buddy discovery.',
        avatar_url: null,
        campus_name: 'Demo Campus',
        course: 'Demo course',
        year: null,
        city: null,
        interests: ['Study groups', 'Creative projects'],
        looking_for: ['Study buddy'],
        discovery_visible: true,
        verified: false,
        created_at: now(),
        updated_at: now(),
        deleted_at: null,
      }));
    },
    listBlockedUsers: async () => {
      await latency();
      return getState().blocks.filter((row) => row.blocker_id === activeUserId()).map((row) => row.blocked_id);
    },
    requestConnection: async (recipientId, reason) => {
      await latency();
      const state = getState();
      if (state.blocks.some((row) => (row.blocker_id === activeUserId() && row.blocked_id === recipientId) || (row.blocker_id === recipientId && row.blocked_id === activeUserId()))) throw new Error('This connection is blocked.');
      const row: ConnectionRow = { requester_id: activeUserId(), recipient_id: recipientId, match_reason: reason ?? null, status: 'pending', ...stamp() };
      state.connections.push(row);
      saveState(state);
      return row;
    },
    listMessages: async () => { await latency(); return getState().messages.filter((item) => item.sender_id === activeUserId() || item.recipient_id === activeUserId()); },
    markMessagesRead: async () => {
      await latency();
      const state = getState();
      for (const message of state.messages) {
        if (message.recipient_id === activeUserId() && !message.read_at) message.read_at = now();
      }
      saveState(state);
    },
    sendMessage: async (recipientId, text) => {
      await latency();
      const state = getState();
      if (state.blocks.some((row) => (row.blocker_id === activeUserId() && row.blocked_id === recipientId) || (row.blocker_id === recipientId && row.blocked_id === activeUserId()))) throw new Error('Messages are unavailable for this connection.');
      const row: DirectMessageRow = { id: makeId('dm'), sender_id: activeUserId(), recipient_id: recipientId, text, read_at: null, deleted_at: null, created_at: now() };
      state.messages.push(row);
      saveState(state);
      return row;
    },
    report: async (input) => {
      await latency();
      const state = getState();
      const row: ReportRow = { id: makeId('report'), reporter_id: activeUserId(), ...input, status: 'reported', moderator_id: null, ...stamp() };
      state.reports.push(row);
      saveState(state);
      return row;
    },
    block: async (userId) => {
      await latency();
      const state = getState();
      if (!state.blocks.some((row) => row.blocker_id === activeUserId() && row.blocked_id === userId)) {
        state.blocks.push({ blocker_id: activeUserId(), blocked_id: userId });
      }
      saveState(state);
    },
  },
  notifications: {
    list: async () => { await latency(); return sortNewest(getState().notifications.filter((item) => item.user_id === activeUserId() && !item.deleted_at)); },
    markRead: async (id) => {
      await latency();
      const state = getState();
      const item = state.notifications.find((row) => row.id === id && row.user_id === activeUserId());
      if (item) item.read_at = now();
      saveState(state);
    },
    markAllRead: async () => {
      await latency();
      const state = getState();
      for (const notification of state.notifications) {
        if (notification.user_id === activeUserId() && !notification.read_at) notification.read_at = now();
      }
      saveState(state);
    },
    getPreferences: async () => {
      await latency();
      return getState().notificationPreferences;
    },
    updatePreferences: async (changes) => {
      await latency();
      const state = getState();
      state.notificationPreferences = { ...state.notificationPreferences, ...changes };
      saveState(state);
      return state.notificationPreferences;
    },
  },
  consents: {
    get: async () => { await latency(); return getState().consents; },
    update: async (changes) => {
      await latency();
      const state = getState();
      const previous = { ...state.consents };
      state.consents = { ...state.consents, ...changes, updated_at: now() };
      if (previous.cycle_tracking_opt_in && changes.cycle_tracking_opt_in === false) state.cycleEntries = [];
      if (previous.ai_memory_opt_in && changes.ai_memory_opt_in === false) state.memories = [];
      if (changes.cycle_tracking_opt_in !== undefined) state.consents.cycle_tracking_consent_at = changes.cycle_tracking_opt_in ? now() : null;
      if (changes.ai_memory_opt_in !== undefined) state.consents.ai_memory_consent_at = changes.ai_memory_opt_in ? now() : null;
      if (changes.discovery_visible !== undefined && state.profile) state.profile.discovery_visible = changes.discovery_visible;
      saveState(state);
      return state.consents;
    },
  },
  account: {
    exportData: async () => {
      await latency();
      const state = getState();
      const userId = activeUserId();
      return {
        exported_at: now(),
        profile: state.profile?.id === userId ? state.profile : null,
        consents: state.consents,
        interests: state.interests.filter((item) => item.user_id === userId),
        wellness_logs: state.wellnessLogs.filter((item) => item.user_id === userId),
        cycle_entries: state.cycleEntries.filter((item) => item.user_id === userId),
        sakhi_memories: state.memories.filter((item) => item.user_id === userId),
        sakhi_conversations: state.conversations.filter((item) => item.user_id === userId),
        planner_items: state.plannerItems.filter((item) => item.user_id === userId),
        daily_top_three: Object.fromEntries(Object.entries(state.dailyTopThree).filter(([key]) => key.startsWith(`${userId}:`))),
        dsa_progress: state.dsaProgress.filter((item) => item.user_id === userId),
        aptitude_progress: state.aptitudeProgress.filter((item) => item.user_id === userId),
        resume_data: state.resumeData?.user_id === userId ? state.resumeData : null,
        mock_interviews: state.mockInterviews.filter((item) => item.user_id === userId),
        club_memberships: state.clubMembers.filter((item) => item.user_id === userId),
        event_registrations: state.eventRegistrations.filter((item) => item.user_id === userId),
        saved_events: state.savedEvents.filter((item) => item.user_id === userId),
        placement_registrations: state.placementRegistrations.filter((item) => item.user_id === userId),
        posts: state.posts.filter((item) => item.user_id === userId || (item.user_id == null && item.author_id === userId)),
        comments: state.comments.filter((item) => item.user_id === userId || (item.user_id == null && item.author_id === userId)),
        reactions: state.reactions.filter((item) => item.user_id === userId),
        connections: state.connections.filter((item) => item.requester_id === userId || item.recipient_id === userId),
        messages: state.messages.filter((item) => item.sender_id === userId || item.recipient_id === userId),
        reports: state.reports.filter((item) => item.reporter_id === userId),
        blocks: state.blocks.filter((item) => item.blocker_id === userId),
        notifications: state.notifications.filter((item) => item.user_id === userId),
        notification_preferences: state.notificationPreferences,
      };
    },
    deleteAccount: async () => {
      await latency();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
        window.localStorage.removeItem('sakhi-theme');
      }
      memoryState = null;
    },
  },
};

export function resetLocalAdapterForTests() {
  memoryState = null;
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  }
}
