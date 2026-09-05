import { WellnessData } from '@/types/wellness';

export const currentWellnessSchema = 2;

export const emptyWellnessData: WellnessData = {
  schemaVersion: currentWellnessSchema,
  profile: {
    name: '',
    stepGoal: 8000,
    waterGoal: 2000,
    sleepGoal: 8,
    exerciseGoal: 30,
    studyGoal: 120,
    workPreference: 'balanced',
    favoriteActivities: [],
    interests: [],
    lookingFor: [],
    themePreference: 'system',
  },
  steps: 0,
  water: 0,
  exerciseMinutes: 0,
  waterEntries: [],
  wellnessCheckIns: [],
  cycleEntries: [],
  sakhiMemories: [],
  miraMemories: [],
  appPreferences: { notifications: false, reducedMotion: false },
  goals: [
    { id: 'movement', title: 'Move for 30 minutes', category: 'Fitness', target: 30, unit: 'minutes', enabled: true },
    { id: 'water', title: 'Drink 2L water', category: 'Wellness', target: 2000, unit: 'ml', enabled: true },
    { id: 'rest', title: 'Make space for rest', category: 'Self Care', target: 1, unit: 'count', enabled: true },
  ],
  achievements: [],
  sleep: { id: 'none', duration: 0, bedtime: '', wakeTime: '', quality: 'okay', date: '' },
  mood: { id: 'none', mood: 'okay', note: '', date: '' },
  activityHistory: [],
  customActivities: [],
  sleepHistory: [],
  moodHistory: [],
  completedGoals: [],
  streak: 0,
  lastUpdated: new Date().toISOString(),
  plannerItems: [],
  cycleCareEnabled: false,
};

/** @deprecated Use emptyWellnessData. Kept so existing imports keep compiling during migration. */
export const initialWellnessData = emptyWellnessData;
