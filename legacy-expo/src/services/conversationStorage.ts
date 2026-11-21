import AsyncStorage from '@react-native-async-storage/async-storage';
import { SakhiConversation } from '@/services/ai/aiTypes';

const SAKHI_KEY = '@sakhi/conversations';
const LEGACY_KEY = '@mira/conversations';

export async function loadConversations(): Promise<SakhiConversation[]> {
  try {
    let raw = await AsyncStorage.getItem(SAKHI_KEY);
    if (!raw) raw = await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as SakhiConversation[]) : [];
  } catch {
    return [];
  }
}

export async function saveConversations(value: SakhiConversation[]) {
  await AsyncStorage.setItem(SAKHI_KEY, JSON.stringify(value.slice(0, 30)));
}

export async function clearConversations() {
  await AsyncStorage.removeItem(SAKHI_KEY);
  await AsyncStorage.removeItem(LEGACY_KEY);
}

