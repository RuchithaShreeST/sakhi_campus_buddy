import { calculateStreak, getLifestyleTotals, hasMoodToday, hasSleepToday, todayActivities, todayWaterMl, wellnessActionDates } from '@/services/wellnessEngine';
import { WellnessData } from '@/types/wellness';

export function unlockedAchievements(data: WellnessData) {
  const totals = getLifestyleTotals(data, 'today');
  const streak = calculateStreak(wellnessActionDates(data));
  const unlocked: string[] = [];
  if (data.activityHistory.length > 0) unlocked.push('first-step');
  if (todayWaterMl(data) >= data.profile.waterGoal) unlocked.push('hydration-hero');
  if (hasSleepToday(data) && data.sleep.duration >= data.profile.sleepGoal) unlocked.push('sleep-star');
  if (streak >= 3) unlocked.push('three-day-streak');
  if (totals.fun > 0) unlocked.push('joy-keeper');
  if (hasMoodToday(data) && hasSleepToday(data) && todayWaterMl(data) > 0 && todayActivities(data).length > 0) unlocked.push('balanced-week');
  return unlocked;
}

export const achievementCatalog = [
  { id: 'first-step', icon: '✦', title: 'First Step', copy: 'Complete your first activity' },
  { id: 'hydration-hero', icon: '◒', title: 'Hydration Hero', copy: 'Reach your water goal' },
  { id: 'sleep-star', icon: '☾', title: 'Sleep Star', copy: 'Meet your sleep goal' },
  { id: 'three-day-streak', icon: '♡', title: '3 Day Streak', copy: 'Show up three days in a row' },
  { id: 'balanced-week', icon: '○', title: 'Balanced day', copy: 'Mood, sleep, water, and an activity' },
  { id: 'joy-keeper', icon: '◇', title: 'Joy Keeper', copy: 'Spend time on something fun' },
];
