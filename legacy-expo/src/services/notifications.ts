export type ReminderKind = 'hydration' | 'movement' | 'sleep' | 'mood';

export async function scheduleWellnessReminder(_kind: ReminderKind): Promise<boolean> {
  // Notification permissions and scheduling stay opt-in for a future Expo Notifications integration.
  return false;
}
