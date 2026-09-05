import { getBalanceScore } from '@/services/wellnessEngine';
import { isToday } from '@/utils/dates';
import { SakhiAiContext } from './aiTypes';
import { WellnessData } from '@/types/wellness';

export function buildSakhiContext(data: WellnessData, currentFeeling?: string): SakhiAiContext {
  const memories = data.sakhiMemories ?? data.miraMemories ?? [];
  return {
    profile: {
      name: data.profile.name,
      sleepGoal: data.profile.sleepGoal,
      waterGoal: data.profile.waterGoal,
      studyGoal: data.profile.studyGoal,
      favoriteActivities: data.profile.favoriteActivities,
      campusName: data.profile.campusName,
      interests: data.profile.interests,
    },
    currentTime: new Date().toISOString(),
    currentActivity: data.activeActivity
      ? { name: data.activeActivity.name, elapsedSeconds: data.activeActivity.elapsedSeconds, category: data.activeActivity.category }
      : undefined,
    recentActivities: data.activityHistory
      .filter((item) => item.date === 'Today' || isToday(item.date))
      .slice(0, 8)
      .map((item) => ({ name: item.name, minutes: item.minutes, category: item.category, date: item.date })),
    latestMood: data.mood.mood,
    sleepHours: data.sleep.duration,
    waterMl: data.water,
    dailyBalance: getBalanceScore(data) ?? 50,
    currentFeeling,
    periodContext: data.cycleEntries[0]?.symptoms.join(', '),
    memories: memories
      .filter((memory) => memory.label && memory.value)
      .slice(0, 8)
      .map((memory) => ({ label: memory.label, value: memory.value })),
  };
}

/** @deprecated Legacy alias */
export const buildMiraContext = buildSakhiContext;

