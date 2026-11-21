import type { SakhiRepositories } from '../contracts';
import { browserPreferences } from './preferences.ts';

function unavailable(): never {
  throw new Error('The Supabase adapter is not configured yet. Use VITE_DATA_MODE=local during frontend development.');
}

export const supabaseRepositories: SakhiRepositories = {
  preferences: browserPreferences,
  auth: {
    signUp: async () => unavailable(),
    signIn: async () => unavailable(),
    verifyEmail: async () => unavailable(),
    resetPassword: async () => unavailable(),
    signOut: async () => unavailable(),
    currentUser: async () => unavailable(),
  },
  profile: {
    get: async () => unavailable(),
    save: async () => unavailable(),
    listCampuses: async () => unavailable(),
    listInterests: async () => unavailable(),
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
    joinClub: async () => unavailable(),
    leaveClub: async () => unavailable(),
    listEvents: async () => unavailable(),
    registerEvent: async () => unavailable(),
    listPlacements: async () => unavailable(),
    registerPlacement: async () => unavailable(),
  },
  circle: {
    listPosts: async () => unavailable(),
    createPost: async () => unavailable(),
    listComments: async () => unavailable(),
    createComment: async () => unavailable(),
    toggleReaction: async () => unavailable(),
    listConnections: async () => unavailable(),
    requestConnection: async () => unavailable(),
    listMessages: async () => unavailable(),
    sendMessage: async () => unavailable(),
    report: async () => unavailable(),
    block: async () => unavailable(),
  },
  notifications: {
    list: async () => unavailable(),
    markRead: async () => unavailable(),
  },
  consents: {
    get: async () => unavailable(),
    update: async () => unavailable(),
  },
  account: {
    exportData: async () => unavailable(),
    deleteAccount: async () => unavailable(),
  },
};
