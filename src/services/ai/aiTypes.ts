import { CompanionState, Recommendation, WellnessData } from '@/types/wellness';

export type SakhiActionType =
  | 'START_ACTIVITY'
  | 'START_BREATHING'
  | 'START_FOCUS'
  | 'ADD_WATER'
  | 'LOG_MOOD'
  | 'LOG_SLEEP'
  | 'OPEN_WELLNESS'
  | 'OPEN_CIRCLE'
  | 'OPEN_CAMPUS'
  | 'OPEN_CLUBS'
  | 'OPEN_EVENTS'
  | 'OPEN_PLACEMENTS'
  | 'FIND_PEOPLE'
  | 'FIND_STUDY_BUDDY'
  | 'FIND_CLUB'
  | 'OPEN_GROUP'
  | 'OPEN_PLANNER'
  | 'TAKE_BREAK'
  | 'REST'
  | 'JOURNAL'
  | 'VIEW_PROGRESS';

/** @deprecated Legacy alias */
export type MiraActionType = SakhiActionType;

export type SakhiAction = { type: SakhiActionType; label: string; payload?: Record<string, string | number> };
/** @deprecated Legacy alias */
export type MiraAction = SakhiAction;

export type SakhiAiContext = {
  profile: Pick<WellnessData['profile'], 'name' | 'sleepGoal' | 'waterGoal' | 'studyGoal' | 'favoriteActivities' | 'campusName' | 'interests'>;
  currentTime: string;
  currentActivity?: { name?: string; elapsedSeconds: number; category?: string };
  recentActivities: { name?: string; minutes: number; category?: string; date: string }[];
  latestMood?: string;
  sleepHours: number;
  waterMl: number;
  dailyBalance: number;
  currentFeeling?: string;
  periodContext?: string;
  campusContext?: string;
  circleContext?: string;
  memories: { label: string; value: string }[];
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
};
/** @deprecated Legacy alias */
export type MiraAiContext = SakhiAiContext;

export type SakhiAiResponse = {
  message: string;
  tone: 'warm' | 'comforting' | 'calm' | 'focused' | 'playful' | 'celebratory';
  companionState: CompanionState;
  intent: string;
  recommendations: Recommendation[];
  actions: SakhiAction[];
  followUpQuestion?: string;
  memoryCandidate?: { label: string; value: string } | null;
};
/** @deprecated Legacy alias */
export type MiraAiResponse = SakhiAiResponse;

export type SakhiChatMessage = { id: string; role: 'user' | 'sakhi' | 'mira'; text: string; timestamp: string; metadata?: Pick<SakhiAiResponse, 'tone' | 'companionState' | 'actions'> };
/** @deprecated Legacy alias */
export type MiraChatMessage = SakhiChatMessage;

export type SakhiConversation = { id: string; messages: SakhiChatMessage[]; createdAt: string; updatedAt: string };
/** @deprecated Legacy alias */
export type MiraConversation = SakhiConversation;

