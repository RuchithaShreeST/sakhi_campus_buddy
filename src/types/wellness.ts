export type CompanionState =
  | 'idle'
  | 'happy'
  | 'energetic'
  | 'balanced'
  | 'walking'
  | 'running'
  | 'exercising'
  | 'studying'
  | 'working'
  | 'reading'
  | 'dancing'
  | 'watchingMovie'
  | 'music'
  | 'selfCare'
  | 'periodCare'
  | 'comforting'
  | 'social'
  | 'sleeping'
  | 'sleepy'
  | 'tired'
  | 'calm'
  | 'celebrating'
  | 'concerned'
  | 'needsRest'
  | 'planning'
  | 'focused';

export type CompanionMode = 'comfort' | 'calm' | 'study' | 'work' | 'plan' | 'motivate' | 'tired' | 'periodCare' | 'selfCare' | 'fun' | 'talk';

export type Feeling = 'stressed' | 'tired' | 'sad' | 'low' | 'overwhelmed' | 'irritated' | 'anxious' | 'mentallyExhausted' | 'lonely' | 'inPain' | 'headache' | 'sick' | 'happy' | 'calm' | 'energetic' | 'excited' | 'peaceful' | 'good' | 'period' | 'periodCramps' | 'pms' | 'bloating' | 'fatigue' | 'other';

export type ActivityCategory = 'Wellness' | 'Fitness' | 'Productivity' | 'Fun' | 'Social' | 'Self Care' | 'Other';

export type ActivityType =
  | 'walking' | 'running' | 'workout' | 'yoga' | 'stretching' | 'meditation' | 'breathing' | 'resting'
  | 'studying' | 'working' | 'reading' | 'learning' | 'tasks' | 'deepWork' | 'break'
  | 'movie' | 'series' | 'dancing' | 'music' | 'gaming' | 'drawing' | 'painting' | 'photography' | 'cooking' | 'shopping' | 'travelling' | 'gardening'
  | 'friends' | 'family' | 'calling' | 'socializing' | 'outing'
  | 'skincare' | 'hairCare' | 'relaxing' | 'journaling' | 'selfCare' | 'personalTime'
  | 'clubActivity' | 'campusEvent' | 'studyGroup' | 'workshop' | 'volunteering'
  | 'custom' | 'exercise';

export type Mood = 'happy' | 'calm' | 'good' | 'okay' | 'low' | 'stressed' | 'tired';

export type WaterEntry = { id: string; amount: number; date: string };

export type WellnessCheckIn = { id: string; feeling: Feeling; note?: string; severity?: string; date: string };

export type CycleEntry = { id: string; startDate: string; endDate?: string; flow?: 'light' | 'medium' | 'heavy'; symptoms: string[]; notes?: string; date: string };

export type SakhiMemory = { id: string; label: string; value: string; createdAt: string };
/** @deprecated Use SakhiMemory */
export type MiraMemory = SakhiMemory;

export type AppPreferences = { notifications: boolean; reducedMotion: boolean };

export type DailyGoal = { id: string; title: string; category: ActivityCategory; target: number; unit: 'minutes' | 'ml' | 'hours' | 'count'; enabled: boolean };

export type Recommendation = { id: string; title: string; description: string; category: ActivityCategory; duration: number; priority: 'low' | 'medium' | 'high'; icon: string; actionType: 'activity' | 'water' | 'mood' | 'rest' };

export type ActivitySession = {
  id: string;
  type: ActivityType;
  name?: string;
  category?: ActivityCategory;
  minutes: number;
  date: string;
  startTime?: string;
  endTime?: string;
  icon?: string;
  companionState?: CompanionState;
  completed?: boolean;
  elapsedSeconds?: number;
  pausedAt?: string;
};

export type ActiveActivity = ActivitySession & { startedAt: string; elapsedSeconds: number; pausedAt?: string };

export type SleepEntry = {
  id: string;
  duration: number;
  bedtime: string;
  wakeTime: string;
  quality: 'restful' | 'good' | 'okay' | 'restless';
  date: string;
};

export type MoodEntry = {
  id: string;
  mood: Mood;
  note: string;
  date: string;
};

export type Profile = {
  name: string;
  age?: string;
  bio?: string;
  campusName?: string;
  city?: string;
  interests: string[];
  lookingFor: string[];
  stepGoal: number;
  waterGoal: number;
  sleepGoal: number;
  exerciseGoal: number;
  studyGoal: number;
  workPreference: 'balanced' | 'focused' | 'flexible';
  favoriteActivities: ActivityType[];
  themePreference: 'system' | 'light' | 'dark';
  quietHoursStart?: string;
  quietHoursEnd?: string;
};

export type PlannerItem = {
  id: string;
  title: string;
  category: ActivityCategory | 'Class' | 'Event' | 'Club';
  dateKey: string;
  startTime?: string;
  durationMinutes?: number;
  done: boolean;
};

export type WellnessData = {
  schemaVersion: number;
  profile: Profile;
  steps: number;
  water: number;
  exerciseMinutes: number;
  activeActivity?: ActiveActivity;
  waterEntries: WaterEntry[];
  wellnessCheckIns: WellnessCheckIn[];
  cycleEntries: CycleEntry[];
  sakhiMemories: SakhiMemory[];
  /** @deprecated Kept for legacy key compatibility */
  miraMemories?: SakhiMemory[];
  appPreferences: AppPreferences;
  goals: DailyGoal[];
  achievements: string[];
  sleep: SleepEntry;
  mood: MoodEntry;
  activityHistory: ActivitySession[];
  customActivities: ActivityDefinition[];
  sleepHistory: SleepEntry[];
  moodHistory: MoodEntry[];
  completedGoals: string[];
  streak: number;
  lastUpdated: string;
  plannerItems: PlannerItem[];
  cycleCareEnabled: boolean;
};

export type ActivityDefinition = {
  id: string;
  name: string;
  type: ActivityType;
  category: ActivityCategory;
  icon: string;
  typicalMinutes?: number;
  companionState: CompanionState;
};

export type WellnessResult = {
  state: CompanionState;
  score: number | null;
  message: string;
  recommendation: string;
};

export type Insight = {
  title: string;
  body: string;
  tone: 'rose' | 'sage' | 'gold' | 'lilac';
};
