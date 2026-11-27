import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

import type { AuthRepository, ConsentRepository, ProfileRepository, SakhiRepositories } from '../contracts';
import type { Database, ProfileUpdate } from '@/types/database';
import { browserPreferences } from './preferences.ts';

const PENDING_SIGNUP_EMAIL_KEY = 'sakhi.auth.pending-signup-email';
const env = import.meta.env;
const supabaseUrl = env?.VITE_SUPABASE_URL?.trim() ?? '';
const supabaseAnonKey = env?.VITE_SUPABASE_ANON_KEY?.trim() ?? '';

function unavailable(): never {
  throw new Error('This Supabase repository method has not been implemented yet.');
}

function authUnavailable(): never {
  throw new Error('Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
}

function throwIfError(error: { message: string } | null): void {
  if (error) throw new Error(error.message);
}

async function requireUserId(client: SupabaseClient<Database>): Promise<string> {
  const { data, error } = await client.auth.getUser();
  throwIfError(error);
  if (!data.user) throw new Error('Sign in before accessing your Sakhi profile.');
  return data.user.id;
}

function toAuthUser(user: User): { id: string; email: string; emailVerified: boolean } {
  if (!user.email) throw new Error('Supabase returned an account without an email address.');
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_confirmed_at),
  };
}

export function createSupabaseProfileRepository(client: SupabaseClient<Database>): ProfileRepository {
  return {
    get: async () => {
      const userId = await requireUserId(client);
      const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
      throwIfError(error);
      return data;
    },
    save: async (changes) => {
      const userId = await requireUserId(client);
      const update: ProfileUpdate = {};
      if (changes.display_name !== undefined) update.display_name = changes.display_name;
      if (changes.pronouns !== undefined) update.pronouns = changes.pronouns;
      if (changes.bio !== undefined) update.bio = changes.bio;
      if (changes.avatar_url !== undefined) update.avatar_url = changes.avatar_url;
      if (changes.campus_name !== undefined) update.campus_name = changes.campus_name;
      if (changes.course !== undefined) update.course = changes.course;
      if (changes.year !== undefined) update.year = changes.year;
      if (changes.city !== undefined) update.city = changes.city;
      if (changes.interests !== undefined) update.interests = changes.interests;
      if (changes.looking_for !== undefined) update.looking_for = changes.looking_for;
      const { data, error } = await client
        .from('profiles')
        .update(update)
        .eq('id', userId)
        .select('*')
        .maybeSingle();
      throwIfError(error);
      if (!data) throw new Error('Your Sakhi profile was not found. Please sign out and sign in again.');
      return data;
    },
    listCampuses: async () => {
      const { data, error } = await client
        .from('campuses')
        .select('*')
        .is('deleted_at', null)
        .order('name');
      throwIfError(error);
      return data ?? [];
    },
    listInterests: async () => {
      const userId = await requireUserId(client);
      const { data, error } = await client
        .from('interests')
        .select('*')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .order('interest_name');
      throwIfError(error);
      return data ?? [];
    },
    listInterestOptions: async () => [
      'Study groups',
      'Creative projects',
      'Wellbeing',
      'Technology',
      'Sports',
      'Arts and culture',
      'Career growth',
      'Community',
    ],
  };
}

export function createSupabaseConsentRepository(client: SupabaseClient<Database>): ConsentRepository {
  return {
    get: async () => {
      const userId = await requireUserId(client);
      const { data, error } = await client.from('consents').select('*').eq('user_id', userId).maybeSingle();
      throwIfError(error);
      if (!data) throw new Error('Your privacy preferences could not be found. Please sign out and sign in again.');
      return data;
    },
    update: async (changes) => {
      const userId = await requireUserId(client);
      const { data, error } = await client
        .from('consents')
        .update(changes)
        .eq('user_id', userId)
        .select('*')
        .maybeSingle();
      throwIfError(error);
      if (!data) throw new Error('Your privacy preferences could not be found. Please sign out and sign in again.');
      return data;
    },
  };
}

type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function createSupabaseAuthRepository(
  client: SupabaseClient<Database>,
  options: { storage?: AuthStorage; origin?: string } = {},
): AuthRepository {
  const storage = options.storage ?? (typeof window === 'undefined' ? undefined : window.sessionStorage);
  const origin = options.origin ?? (typeof window === 'undefined' ? undefined : window.location.origin);
  let pendingSignupEmail: string | null = null;

  function getPendingSignupEmail(): string | null {
    return storage?.getItem(PENDING_SIGNUP_EMAIL_KEY) ?? pendingSignupEmail;
  }

  function setPendingSignupEmail(email: string): void {
    pendingSignupEmail = email;
    storage?.setItem(PENDING_SIGNUP_EMAIL_KEY, email);
  }

  function clearPendingSignupEmail(): void {
    pendingSignupEmail = null;
    storage?.removeItem(PENDING_SIGNUP_EMAIL_KEY);
  }

  return {
    signUp: async (email, password) => {
      const cleanEmail = email.trim().toLowerCase();
      const emailRedirectTo = origin ? new URL('/onboarding', origin).toString() : undefined;
      const { data, error } = await client.auth.signUp({
        email: cleanEmail,
        password,
        options: { emailRedirectTo },
      });
      throwIfError(error);
      if (!data.user) throw new Error('Supabase did not return the newly created account.');
      const user = toAuthUser(data.user);
      const verificationRequired = !data.session && !user.emailVerified;
      if (verificationRequired) setPendingSignupEmail(cleanEmail);
      else clearPendingSignupEmail();
      return { user, verificationRequired };
    },
    signIn: async (email, password) => {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      throwIfError(error);
      if (!data.user) throw new Error('Supabase did not return a signed-in account.');
      clearPendingSignupEmail();
      return toAuthUser(data.user);
    },
    verifyEmail: async (code) => {
      const email = getPendingSignupEmail();
      if (!email) throw new Error('Start email verification again so Sakhi knows which address to verify.');
      const { data, error } = await client.auth.verifyOtp({
        email,
        token: code.trim(),
        type: 'signup',
      });
      throwIfError(error);
      if (!data.user) throw new Error('Supabase did not return a verified account.');
      clearPendingSignupEmail();
      return toAuthUser(data.user);
    },
    requestPasswordReset: async (email) => {
      const { error } = await client.auth.resetPasswordForEmail(email.trim().toLowerCase());
      throwIfError(error);
      return {};
    },
    verifyPasswordReset: async (email, code) => {
      const { data, error } = await client.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: code.trim(),
        type: 'recovery',
      });
      throwIfError(error);
      if (!data.user || !data.session) throw new Error('Supabase did not return a password recovery session.');
    },
    updatePassword: async (newPassword) => {
      if (newPassword.length < 8) throw new Error('Use a password with at least 8 characters.');
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      throwIfError(sessionError);
      if (!sessionData.session) throw new Error('Verify the password-reset code from your email before choosing a new password.');
      const { error } = await client.auth.updateUser({ password: newPassword });
      throwIfError(error);
    },
    signOut: async () => {
      const { error } = await client.auth.signOut({ scope: 'local' });
      throwIfError(error);
      clearPendingSignupEmail();
    },
    currentUser: async () => {
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      throwIfError(sessionError);
      if (!sessionData.session) return null;
      const { data, error } = await client.auth.getUser();
      throwIfError(error);
      return data.user ? toAuthUser(data.user) : null;
    },
  };
}

const client = supabaseUrl && supabaseAnonKey
  ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        persistSession: true,
      },
    })
  : null;

const auth: AuthRepository = client
  ? createSupabaseAuthRepository(client)
  : {
      signUp: async () => authUnavailable(),
      signIn: async () => authUnavailable(),
      verifyEmail: async () => authUnavailable(),
      requestPasswordReset: async () => authUnavailable(),
      verifyPasswordReset: async () => authUnavailable(),
      updatePassword: async () => authUnavailable(),
      signOut: async () => authUnavailable(),
      currentUser: async () => authUnavailable(),
    };

export const supabaseRepositories: SakhiRepositories = {
  preferences: browserPreferences,
  auth,
  profile: client ? createSupabaseProfileRepository(client) : {
    get: async () => authUnavailable(),
    save: async () => authUnavailable(),
    listCampuses: async () => authUnavailable(),
    listInterests: async () => authUnavailable(),
    listInterestOptions: async () => authUnavailable(),
  },
  wellness: {
    listLogs: async () => unavailable(),
    saveLog: async () => unavailable(),
    getSummary: async () => unavailable(),
    listCycleEntries: async () => unavailable(),
    saveCycleEntry: async () => unavailable(),
    deleteCycleEntry: async () => unavailable(),
  },
  planner: {
    list: async () => unavailable(),
    create: async () => unavailable(),
    update: async () => unavailable(),
    remove: async () => unavailable(),
    getDailyTopThree: async () => unavailable(),
    setDailyTopThree: async () => unavailable(),
  },
  placementPrep: {
    listDsaProgress: async () => unavailable(),
    saveDsaProgress: async () => unavailable(),
    listAptitudeProgress: async () => unavailable(),
    saveAptitudeProgress: async () => unavailable(),
    getResumeData: async () => unavailable(),
    saveResumeData: async () => unavailable(),
    listMockInterviews: async () => unavailable(),
    saveMockInterview: async () => unavailable(),
  },
  chat: {
    list: async () => unavailable(),
    streamReply: async function* () { unavailable(); },
    listMemories: async () => unavailable(),
    saveMemory: async () => unavailable(),
    updateMemory: async () => unavailable(),
    deleteMemory: async () => unavailable(),
  },
  campus: {
    listAnnouncements: async () => unavailable(),
    listClubs: async () => unavailable(),
    listClubMemberships: async () => unavailable(),
    joinClub: async () => unavailable(),
    leaveClub: async () => unavailable(),
    listEvents: async () => unavailable(),
    listEventRegistrations: async () => unavailable(),
    listSavedEvents: async () => unavailable(),
    saveEvent: async () => unavailable(),
    registerEvent: async () => unavailable(),
    listPlacements: async () => unavailable(),
    listPlacementRegistrations: async () => unavailable(),
    registerPlacement: async () => unavailable(),
  },
  circle: {
    listPosts: async () => unavailable(),
    createPost: async () => unavailable(),
    listComments: async () => unavailable(),
    createComment: async () => unavailable(),
    listReactions: async () => unavailable(),
    toggleReaction: async () => unavailable(),
    listConnections: async () => unavailable(),
    listDiscoverableProfiles: async () => unavailable(),
    listBlockedUsers: async () => unavailable(),
    requestConnection: async () => unavailable(),
    listMessages: async () => unavailable(),
    markMessagesRead: async () => unavailable(),
    sendMessage: async () => unavailable(),
    report: async () => unavailable(),
    block: async () => unavailable(),
  },
  notifications: {
    list: async () => unavailable(),
    markRead: async () => unavailable(),
    markAllRead: async () => unavailable(),
    getPreferences: async () => unavailable(),
    updatePreferences: async () => unavailable(),
  },
  consents: client ? createSupabaseConsentRepository(client) : {
    get: async () => authUnavailable(),
    update: async () => authUnavailable(),
  },
  account: {
    exportData: async () => unavailable(),
    deleteAccount: async () => unavailable(),
  },
};
