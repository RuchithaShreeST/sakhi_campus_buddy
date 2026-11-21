import { getCompanionStateForActivity } from '@/services/activityEngine';
import { ActivityType, CompanionState, Mood, WellnessData, WellnessResult } from '@/types/wellness';
import { getLocalDateKey, isToday, parseFlexibleDate } from '@/utils/dates';

export function sessionDateKey(date: string) {
  return getLocalDateKey(date);
}

export function isSessionToday(date: string) {
  return isToday(date);
}

export function todayActivities(data: WellnessData) {
  return data.activityHistory.filter((activity) => isSessionToday(activity.date));
}

export function getLifestyleTotals(data: WellnessData, scope: 'today' | 'all' = 'today') {
  const sessions = scope === 'today' ? todayActivities(data) : data.activityHistory;
  return sessions.reduce((totals, activity) => {
    const minutes = activity.minutes;
    const category = activity.category;
    return {
      total: totals.total + minutes,
      movement: totals.movement + (category === 'Fitness' ? minutes : 0),
      productivity: totals.productivity + (category === 'Productivity' ? minutes : 0),
      study: totals.study + (isStudyType(activity.type) ? minutes : 0),
      work: totals.work + (isWorkType(activity.type) ? minutes : 0),
      fun: totals.fun + (category === 'Fun' ? minutes : 0),
      social: totals.social + (category === 'Social' ? minutes : 0),
      selfCare: totals.selfCare + (category === 'Self Care' ? minutes : 0),
      rest: totals.rest + (activity.type === 'resting' || activity.type === 'break' ? minutes : 0),
    };
  }, { total: 0, movement: 0, productivity: 0, study: 0, work: 0, fun: 0, social: 0, selfCare: 0, rest: 0 });
}

export function todayWaterMl(data: WellnessData) {
  return data.waterEntries.filter((entry) => isToday(entry.date)).reduce((sum, entry) => sum + entry.amount, 0);
}

export function hasMoodToday(data: WellnessData) {
  return Boolean(data.mood?.id && data.mood.id !== 'none' && isToday(data.mood.date));
}

export function hasSleepToday(data: WellnessData) {
  return Boolean(data.sleep?.id && data.sleep.id !== 'none' && data.sleep.duration > 0 && isToday(data.sleep.date));
}

export function hasEnoughRhythmData(data: WellnessData) {
  return hasMoodToday(data) || hasSleepToday(data) || todayWaterMl(data) > 0 || todayActivities(data).length > 0;
}

export function getBalanceScore(data: WellnessData): number | null {
  if (!hasEnoughRhythmData(data)) return null;
  const totals = getLifestyleTotals(data, 'today');
  const sleepHours = hasSleepToday(data) ? data.sleep.duration : 0;
  const sleep = hasSleepToday(data) ? Math.min(sleepHours / Math.max(data.profile.sleepGoal, 1), 1) : 0.45;
  const movement = Math.min((totals.movement) / Math.max(data.profile.exerciseGoal, 20), 1);
  const hydration = Math.min(todayWaterMl(data) / Math.max(data.profile.waterGoal, 1), 1);
  const mood = hasMoodToday(data) ? moodScore(data.mood.mood) : 0.55;
  const activity = Math.min(totals.total / 180, 1);
  const selfCare = Math.min((totals.selfCare + totals.rest) / 20, 1);
  const socialJoy = Math.min((totals.fun + totals.social) / 40, 1);
  return Math.round(sleep * 24 + movement * 18 + hydration * 14 + mood * 16 + activity * 12 + selfCare * 10 + socialJoy * 6);
}

const positiveMoods: Mood[] = ['happy', 'good'];
const lowMoods: Mood[] = ['low', 'stressed', 'tired'];

function moodScore(mood: Mood) {
  if (positiveMoods.includes(mood)) return 1;
  if (lowMoods.includes(mood)) return 0.4;
  return 0.7;
}

export function getWellnessState(data: WellnessData, activeState?: CompanionState): WellnessResult {
  if (activeState) return { state: activeState, score: getBalanceScore(data), message: activeMessage(activeState), recommendation: activeRecommendation(activeState) };
  const totals = getLifestyleTotals(data, 'today');
  const score = getBalanceScore(data);
  if (score === null) return { state: 'idle' as CompanionState, score, message: 'What do you need right now?', recommendation: 'Still getting to know your rhythm. A check-in, a glass of water, or a short walk is enough to begin.' };
  if (data.completedGoals.length >= 4) return { state: 'celebrating' as CompanionState, score, message: 'You made space for your goals today.', recommendation: 'Let this be enough. The rest of the day can stay gentle.' };
  if (hasSleepToday(data) && data.sleep.duration < data.profile.sleepGoal * 0.75 && totals.movement < 15) return { state: 'needsRest' as CompanionState, score, message: 'Your energy looks a little low today.', recommendation: 'A slower pace and an earlier wind-down may feel supportive tonight.' };
  if (totals.work + totals.study >= 120 && totals.movement < 10) return { state: 'tired' as CompanionState, score, message: 'You have been focused for a long stretch.', recommendation: 'A short movement break or a screen-free pause could help you reset. Long hours are not a badge.' };
  if (hasMoodToday(data) && lowMoods.includes(data.mood.mood)) return { state: data.mood.mood === 'tired' ? ('tired' as CompanionState) : ('concerned' as CompanionState), score, message: 'It is okay to make space for how you feel.', recommendation: 'Try one small act of care, or stay with Sakhi for a minute.' };
  if (score >= 78 && totals.selfCare + totals.fun + totals.social > 20) return { state: 'balanced' as CompanionState, score, message: 'Your day has a kind rhythm.', recommendation: 'Keep choosing a mix of focus, movement, joy, and rest.' };
  if (score >= 78) return { state: 'energetic' as CompanionState, score, message: 'You have some good energy today.', recommendation: 'Use it kindly — including rest.' };
  if (score >= 55) return { state: hasMoodToday(data) && positiveMoods.includes(data.mood.mood) ? 'happy' : 'balanced', score, message: 'You are finding your rhythm today.', recommendation: 'A little movement and a little rest can keep this going.' };
  return { state: 'sleepy' as CompanionState, score, message: 'A gentle reset could feel right.', recommendation: 'Start with water, a few unhurried stretches, or a quiet break.' };
}

function activeMessage(state: CompanionState) {
  if (state === 'sleeping') return 'Sakhi is resting with you.';
  if (state === 'studying' || state === 'focused') return "You've got this.";
  if (state === 'working') return 'One step at a time.';
  if (state === 'planning') return 'Let’s keep today human-sized.';
  if (state === 'dancing') return 'Dance it out.';
  return state === 'selfCare' || state === 'periodCare' ? 'You deserve this time.' : 'Sakhi is with you in this moment.';
}

function activeRecommendation(state: CompanionState) {
  if (state === 'working' || state === 'studying' || state === 'focused') return 'Remember to take a real break. Focus is not the same as overwork.';
  if (state === 'sleeping') return 'Rest is part of your rhythm.';
  return 'Stay present and enjoy this little moment of care.';
}

export function companionStateForType(type: ActivityType): CompanionState {
  return getCompanionStateForActivity(type);
}

function isStudyType(type: ActivityType) {
  return type === 'studying' || type === 'reading' || type === 'learning' || type === 'deepWork' || type === 'studyGroup';
}

function isWorkType(type: ActivityType) {
  return type === 'working' || type === 'tasks';
}

export function calculateStreak(dates: string[], today = new Date()) {
  const keys = new Set(dates.map(getLocalDateKey).filter(Boolean));
  let streak = 0;
  const cursor = new Date(today);
  while (keys.has(getLocalDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function wellnessActionDates(data: WellnessData) {
  return [
    ...data.waterEntries.map((item) => item.date),
    ...data.moodHistory.map((item) => item.date),
    ...data.sleepHistory.map((item) => item.date),
    ...data.activityHistory.map((item) => item.date),
    ...data.wellnessCheckIns.map((item) => item.date),
  ].filter((value) => parseFlexibleDate(value));
}
