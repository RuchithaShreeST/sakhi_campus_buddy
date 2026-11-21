import AsyncStorage from '@react-native-async-storage/async-storage';

import { initialWellnessData } from '@/data/mockData';
import { WellnessData } from '@/types/wellness';

const SAKHI_KEY = '@sakhi/wellness-data';
const LEGACY_MIRA_KEY = '@mira/wellness-data';

export async function loadWellnessData(): Promise<WellnessData> {
  try {
    let stored = await AsyncStorage.getItem(SAKHI_KEY);
    if (!stored) {
      stored = await AsyncStorage.getItem(LEGACY_MIRA_KEY);
    }
    if (!stored) return initialWellnessData;
    const saved = JSON.parse(stored) as Partial<WellnessData>;
    const memories = saved.sakhiMemories ?? saved.miraMemories ?? [];
    return {
      ...initialWellnessData,
      ...saved,
      profile: { ...initialWellnessData.profile, ...(saved.profile ?? {}) },
      activityHistory: saved.activityHistory ?? initialWellnessData.activityHistory,
      customActivities: saved.customActivities ?? [],
      waterEntries: saved.waterEntries ?? [{ id: 'legacy-water', amount: saved.water ?? initialWellnessData.water, date: new Date().toISOString() }],
      wellnessCheckIns: saved.wellnessCheckIns ?? [],
      cycleEntries: saved.cycleEntries ?? [],
      sakhiMemories: memories,
      miraMemories: memories,
      appPreferences: { ...initialWellnessData.appPreferences, ...(saved.appPreferences ?? {}) },
      goals: saved.goals ?? initialWellnessData.goals,
      achievements: saved.achievements ?? initialWellnessData.achievements,
      plannerItems: saved.plannerItems ?? [],
    };
  } catch {
    return initialWellnessData;
  }
}

export async function saveWellnessData(data: WellnessData): Promise<void> {
  await AsyncStorage.setItem(SAKHI_KEY, JSON.stringify(data));
}

export async function clearWellnessData(): Promise<void> {
  await AsyncStorage.removeItem(SAKHI_KEY);
  await AsyncStorage.removeItem(LEGACY_MIRA_KEY);
}

export async function clearAllSakhiLocalData(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const localKeys = keys.filter((key) =>
    key.startsWith('@sakhi/') ||
    key.startsWith('@mira/')
  );
  await Promise.all(localKeys.map((key) => AsyncStorage.removeItem(key)));
}
