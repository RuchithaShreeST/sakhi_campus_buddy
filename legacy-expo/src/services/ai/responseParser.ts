import { CompanionState, Recommendation } from '@/types/wellness';
import { SakhiAction, SakhiAiResponse } from './aiTypes';

const allowedStates: CompanionState[] = [
  'idle', 'happy', 'energetic', 'balanced', 'walking', 'running', 'exercising',
  'studying', 'working', 'reading', 'dancing', 'watchingMovie', 'music', 'selfCare',
  'periodCare', 'comforting', 'social', 'sleeping', 'sleepy', 'tired', 'calm',
  'celebrating', 'concerned', 'needsRest', 'planning', 'focused',
];

const allowedActions = [
  'START_ACTIVITY', 'START_BREATHING', 'START_FOCUS', 'ADD_WATER', 'LOG_MOOD', 'LOG_SLEEP',
  'OPEN_WELLNESS', 'OPEN_CIRCLE', 'OPEN_CAMPUS', 'OPEN_CLUBS', 'OPEN_EVENTS', 'OPEN_PLACEMENTS',
  'FIND_PEOPLE', 'FIND_STUDY_BUDDY', 'FIND_CLUB', 'OPEN_GROUP', 'OPEN_PLANNER', 'TAKE_BREAK',
  'REST', 'JOURNAL', 'VIEW_PROGRESS',
];

export function parseSakhiResponse(value: unknown): SakhiAiResponse | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<SakhiAiResponse>;
  if (typeof raw.message !== 'string' || !raw.message.trim()) return null;
  const companionState = allowedStates.includes(raw.companionState as CompanionState) ? (raw.companionState as CompanionState) : 'comforting';
  const actions = Array.isArray(raw.actions)
    ? raw.actions.filter((action): action is SakhiAction => Boolean(action && typeof action === 'object' && allowedActions.includes((action as SakhiAction).type) && typeof (action as SakhiAction).label === 'string')).slice(0, 3)
    : [];
  const recommendations = Array.isArray(raw.recommendations)
    ? raw.recommendations.filter((item): item is Recommendation => Boolean(item && typeof item === 'object' && typeof (item as Recommendation).title === 'string')).slice(0, 3)
    : [];
  return {
    message: raw.message.trim(),
    tone: raw.tone ?? 'warm',
    companionState,
    intent: raw.intent ?? 'conversation',
    recommendations,
    actions,
    followUpQuestion: raw.followUpQuestion,
    memoryCandidate: raw.memoryCandidate ?? null,
  };
}

/** @deprecated Legacy alias */
export const parseMiraResponse = parseSakhiResponse;

