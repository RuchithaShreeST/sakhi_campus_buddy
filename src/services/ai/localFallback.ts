import { getRecommendations } from '@/services/wellnessRecommendations';
import { SakhiAiContext, SakhiAiResponse } from './aiTypes';
import { ActivityCategory } from '@/types/wellness';

export function getLocalSakhiResponse(text: string, context: SakhiAiContext): SakhiAiResponse {
  const lower = text.toLowerCase();

  const period = lower.includes('period') || lower.includes('cramp') || lower.includes('bloat') || lower.includes('pms');
  const tired = lower.includes('tired') || lower.includes('exhausted') || lower.includes('sleep') || lower.includes('drained');
  const stressed = lower.includes('stress') || lower.includes('overwhelm') || lower.includes('anxious') || lower.includes('panic');
  const study = lower.includes('study') || lower.includes('exam') || lower.includes('java') || lower.includes('dsa') || lower.includes('coding') || lower.includes('assignment');
  const placement = lower.includes('placement') || lower.includes('interview') || lower.includes('resume') || lower.includes('career') || lower.includes('mock');
  const club = lower.includes('club') || lower.includes('dance') || lower.includes('music') || lower.includes('painting') || lower.includes('hobby');
  const event = lower.includes('event') || lower.includes('weekend') || lower.includes('workshop') || lower.includes('fest');
  const lonely = lower.includes('lonely') || lower.includes('friend') || lower.includes('alone') || lower.includes('new') || lower.includes('people');
  const water = lower.includes('water') || lower.includes('thirst') || lower.includes('hydrate');

  const recommendations = getRecommendations({
    currentFeeling: period ? 'periodCramps' : tired ? 'tired' : stressed ? 'stressed' : undefined,
    timeOfDay: getTimeOfDay(),
    data: contextToData(context),
  });

  if (period) {
    return response(
      'I hear you. Let’s make today a little gentler. We can choose quiet rest, hydration, or a comforting break. If your symptoms are severe, unusual, or worsening, please consult a healthcare professional.',
      'periodCare',
      'period_support',
      recommendations,
      [
        { type: 'REST', label: 'Rest & Pause' },
        { type: 'ADD_WATER', label: 'Log Water' },
        { type: 'OPEN_WELLNESS', label: 'Open Wellness' },
      ],
      'How severe are your cramps right now?'
    );
  }

  if (placement) {
    return response(
      'Placement prep is a marathon, not a sprint. We have dedicated placement discussion circles, interview experiences, and mock interview practice on Sakhi.',
      'focused',
      'placement_support',
      recommendations,
      [
        { type: 'OPEN_PLACEMENTS', label: 'Explore Placement Hub' },
        { type: 'START_FOCUS', label: 'Start Placement Study' },
      ],
      'Which topic or company are you preparing for?'
    );
  }

  if (club) {
    return response(
      'Campus clubs are a wonderful way to connect and grow your hobbies. Check out campus clubs like Dance, AI/ML, Painting, and Literature!',
      'happy',
      'club_discovery',
      recommendations,
      [
        { type: 'OPEN_CLUBS', label: 'Browse Clubs' },
        { type: 'FIND_CLUB', label: 'Find Hobby Partners' },
      ]
    );
  }

  if (event) {
    return response(
      'There is always something happening around campus. Check out upcoming events, workshops, and student gatherings for this weekend.',
      'energetic',
      'event_discovery',
      recommendations,
      [
        { type: 'OPEN_EVENTS', label: 'View Campus Events' },
      ]
    );
  }

  if (lonely) {
    return response(
      'I am right here with you. If you want to connect with other students on campus who share your interests, I can introduce you on Circle.',
      'comforting',
      'social_connection',
      recommendations,
      [
        { type: 'FIND_PEOPLE', label: 'Discover People on Circle' },
        { type: 'FIND_STUDY_BUDDY', label: 'Find a Study Buddy' },
      ],
      'Would you prefer to stay with me or explore Circle?'
    );
  }

  if (study) {
    return response(
      'We can make this manageable. Let’s start a focused timer or connect with a study partner who is working on the same subject.',
      'studying',
      'study_support',
      recommendations,
      [
        { type: 'START_FOCUS', label: 'Start 25-Min Study Session' },
        { type: 'FIND_STUDY_BUDDY', label: 'Find Study Buddy' },
      ],
      'Which subject are you studying right now?'
    );
  }

  if (water) {
    return response(
      'Hydration is essential for keeping your energy steady! Let’s log a glass of water right now.',
      'happy',
      'water_log',
      recommendations,
      [
        { type: 'ADD_WATER', label: '+250 ml Water' },
      ]
    );
  }

  if (tired) {
    return response(
      'You have been carrying a lot today. Let’s slow down. A quiet pause or early sleep will help restore your energy.',
      'tired',
      'rest_support',
      recommendations,
      [
        { type: 'REST', label: 'Take a Rest' },
        { type: 'START_BREATHING', label: '2-Min Breathing Reset' },
      ]
    );
  }

  if (stressed) {
    return response(
      'I’m with you. Take a deep breath. We don’t have to solve everything right now—just one small step is enough.',
      'comforting',
      'stress_support',
      recommendations,
      [
        { type: 'START_BREATHING', label: 'Breathing Exercise' },
        { type: 'LOG_MOOD', label: 'Check in Mood' },
      ]
    );
  }

  return response(
    context.dailyBalance >= 75
      ? 'Your day has a wonderful balance. What would feel good to focus on or explore next?'
      : 'I am here with you. Tell me what is on your mind today—study, clubs, career, or just talking.',
    'idle',
    'conversation',
    recommendations,
    [
      { type: 'OPEN_WELLNESS', label: 'Wellness Check' },
      { type: 'OPEN_CAMPUS', label: 'Explore Campus' },
    ],
    'What do you need right now?'
  );
}

/** @deprecated Legacy alias */
export const getLocalMiraResponse = getLocalSakhiResponse;

function response(
  message: string,
  companionState: SakhiAiResponse['companionState'],
  intent: string,
  recommendations: SakhiAiResponse['recommendations'],
  actions: SakhiAiResponse['actions'] = [],
  followUpQuestion?: string
): SakhiAiResponse {
  return {
    message,
    tone: companionState === 'comforting' || companionState === 'periodCare' ? 'comforting' : 'warm',
    companionState,
    intent,
    recommendations,
    actions,
    followUpQuestion,
    memoryCandidate: null,
  };
}

function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  return hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
}

function contextToData(context: SakhiAiContext) {
  const memories = context.memories.map((m, i) => ({ id: `${i}`, label: m.label, value: m.value, createdAt: new Date().toISOString() }));
  return {
    profile: {
      name: context.profile.name,
      stepGoal: 8000,
      waterGoal: context.profile.waterGoal,
      sleepGoal: context.profile.sleepGoal,
      exerciseGoal: 30,
      studyGoal: context.profile.studyGoal,
      workPreference: 'balanced' as const,
      favoriteActivities: context.profile.favoriteActivities,
      interests: context.profile.interests ?? [],
      lookingFor: [],
      themePreference: 'system' as const,
      discoveryVisible: true,
      aiMemoryConsent: false,
      cycleTrackingConsent: false,
      onboardingCompleted: false,
    },
    steps: 0,
    water: context.waterMl,
    exerciseMinutes: 0,
    sleep: { id: 'context', duration: context.sleepHours, bedtime: '', wakeTime: '', quality: 'good' as const, date: new Date().toISOString() },
    mood: { id: 'context', mood: 'okay' as const, note: '', date: new Date().toISOString() },
    activityHistory: context.recentActivities.map((item, index) => ({ id: `${index}`, type: 'custom' as const, name: item.name, category: item.category as ActivityCategory | undefined, minutes: item.minutes, date: item.date })),
    customActivities: [],
    waterEntries: [],
    wellnessCheckIns: [],
    cycleEntries: [],
    sakhiMemories: memories,
    miraMemories: memories,
    appPreferences: { notifications: false, reducedMotion: false },
    goals: [],
    achievements: [],
    sleepHistory: [],
    moodHistory: [],
    completedGoals: [],
    streak: 0,
    lastUpdated: new Date().toISOString(),
    schemaVersion: 1,
    plannerItems: [],
    cycleCareEnabled: Boolean(context.periodContext),
  };
}

