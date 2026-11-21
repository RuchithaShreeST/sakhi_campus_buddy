const states = new Set(['idle', 'happy', 'energetic', 'balanced', 'walking', 'running', 'exercising', 'studying', 'working', 'reading', 'dancing', 'watchingMovie', 'music', 'selfCare', 'periodCare', 'comforting', 'social', 'sleeping', 'sleepy', 'tired', 'calm', 'celebrating', 'concerned', 'needsRest', 'planning', 'focused']);
const allowedActions = new Set(['START_ACTIVITY', 'START_BREATHING', 'START_FOCUS', 'ADD_WATER', 'LOG_MOOD', 'LOG_SLEEP', 'OPEN_WELLNESS', 'OPEN_CIRCLE', 'OPEN_CAMPUS', 'OPEN_CLUBS', 'OPEN_EVENTS', 'OPEN_PLACEMENTS', 'FIND_PEOPLE', 'FIND_STUDY_BUDDY', 'FIND_CLUB', 'OPEN_GROUP', 'OPEN_PLANNER', 'TAKE_BREAK', 'REST', 'JOURNAL', 'VIEW_PROGRESS', 'OPEN_SLEEP', 'OPEN_PERIOD_CARE', 'OPEN_ACTIVITY_PICKER']);

export function parseMiraResponse(value) {
  const parsed = typeof value === 'string' ? JSON.parse(value) : value;
  if (!parsed || typeof parsed.message !== 'string') throw new Error('Invalid MIRA response');
  
  const parsedActions = Array.isArray(parsed.actions)
    ? parsed.actions
        .map((item) => {
          if (typeof item === 'string' && allowedActions.has(item)) return { type: item, label: item };
          if (item && typeof item === 'object' && allowedActions.has(item.type)) {
            return { type: item.type, label: typeof item.label === 'string' ? item.label : item.type };
          }
          return null;
        })
        .filter(Boolean)
        .slice(0, 3)
    : [];

  return {
    message: parsed.message.slice(0, 1200),
    tone: typeof parsed.tone === 'string' ? parsed.tone : 'warm',
    companionState: states.has(parsed.companionState) ? parsed.companionState : 'comforting',
    intent: typeof parsed.intent === 'string' ? parsed.intent : 'conversation',
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 3) : [],
    actions: parsedActions,
    followUpQuestion: parsed.followUpQuestion || null,
    memoryCandidate: parsed.memoryCandidate || null,
  };
}

export const parseSakhiResponse = parseMiraResponse;

