import AsyncStorage from '@react-native-async-storage/async-storage';
import { SakhiNotification } from '@/types/notifications';

const SAKHI_KEY = '@sakhi/notifications';
const LEGACY_KEY = '@mira/notifications';

export async function loadNotifications(): Promise<SakhiNotification[]> {
  try {
    let raw = await AsyncStorage.getItem(SAKHI_KEY);
    if (!raw) raw = await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? (JSON.parse(raw) as SakhiNotification[]) : [];
  } catch {
    return [];
  }
}

export async function saveNotifications(value: SakhiNotification[]) {
  await AsyncStorage.setItem(SAKHI_KEY, JSON.stringify(value.slice(0, 100)));
}

