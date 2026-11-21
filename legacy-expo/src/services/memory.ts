import AsyncStorage from '@react-native-async-storage/async-storage';
import { SakhiMemory } from '@/types/wellness';

const SAKHI_KEY = '@sakhi/memories';
const LEGACY_KEY = '@mira/memories';

export async function loadMemories(): Promise<SakhiMemory[]> {
  try {
    let raw = await AsyncStorage.getItem(SAKHI_KEY);
    if (!raw) raw = await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as SakhiMemory[]) : [];
  } catch {
    return [];
  }
}

export async function saveMemories(memories: SakhiMemory[]) {
  await AsyncStorage.setItem(SAKHI_KEY, JSON.stringify(memories));
}

