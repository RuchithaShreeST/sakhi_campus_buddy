import { WellnessData } from '@/types/wellness';

export type HealthSnapshot = Pick<WellnessData, 'steps' | 'sleep' | 'exerciseMinutes'>;

export interface HealthService {
  getSnapshot(): Promise<HealthSnapshot>;
  requestPermissions(): Promise<boolean>;
}

export const mockHealthService: HealthService = {
  async getSnapshot() {
    return { steps: 5240, sleep: { duration: 7.4, bedtime: '10:45 PM', wakeTime: '6:10 AM', quality: 'good', id: 'mock-sleep', date: new Date().toISOString() }, exerciseMinutes: 18 };
  },
  async requestPermissions() {
    return false;
  },
};
