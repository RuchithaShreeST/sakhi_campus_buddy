import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';

import { initialWellnessData } from '@/data/mockData';
import { getWellnessState } from '@/services/wellnessEngine';
import { loadWellnessData, saveWellnessData } from '@/services/storage';
import { getCompanionStateForActivity } from '@/services/activityEngine';
import { ActivityDefinition, ActivitySession, ActivityType, CompanionState, CycleEntry, Feeling, Mood, Profile, SleepEntry, WellnessData, WellnessResult } from '@/types/wellness';

type WellnessContextValue = {
  data: WellnessData;
  wellness: WellnessResult;
  loading: boolean;
  activeState?: CompanionState;
  setCompanionState: (state?: CompanionState) => void;
  updateProfile: (profile: Profile) => void;
  addWater: (amount: number) => void;
  addSteps: (amount: number) => void;
  addExercise: (minutes: number, type?: ActivitySession['type']) => void;
  logSleep: (entry: Omit<SleepEntry, 'id' | 'date'>) => void;
  logMood: (mood: Mood, note?: string) => void;
  addActivity: (activity: Omit<ActivitySession, 'id' | 'date' | 'completed'>) => void;
  addCustomActivity: (activity: Omit<ActivityDefinition, 'id'>) => void;
  toggleFavorite: (activity: ActivityType) => void;
  addFeeling: (feeling: Feeling, note?: string, severity?: string) => void;
  addCycleEntry: (entry: Omit<CycleEntry, 'id' | 'date'>) => void;
  startActivity: (activity: ActivityDefinition) => void;
  pauseActivity: () => void;
  resumeActivity: () => void;
  finishActiveActivity: () => ActivitySession | undefined;
  addMemory: (label: string, value: string) => void;
  removeMemory: (id: string) => void;
  setNotifications: (enabled: boolean) => void;
};

const WellnessContext = createContext<WellnessContextValue | null>(null);

export function WellnessProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<WellnessData>(initialWellnessData);
  const [loading, setLoading] = useState(true);
  const [activeState, setActiveState] = useState<CompanionState>();

  useEffect(() => {
    loadWellnessData().then((saved) => {
      setData(saved);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!loading) void saveWellnessData(data);
  }, [data, loading]);

  useEffect(() => {
    const activeId = data.activeActivity?.id;
    const pausedAt = data.activeActivity?.pausedAt;
    if (!activeId || pausedAt) return;
    const timer = setInterval(() => {
      setData((current) => current.activeActivity ? { ...current, activeActivity: { ...current.activeActivity, elapsedSeconds: Math.max(current.activeActivity.elapsedSeconds, Math.round((Date.now() - new Date(current.activeActivity.startedAt).getTime()) / 1000)) } } : current);
    }, 1000);
    return () => clearInterval(timer);
  }, [data.activeActivity?.id, data.activeActivity?.pausedAt, loading]);

  const update = (change: (current: WellnessData) => WellnessData) => {
    setData((current) => {
      const next = change({ ...current, lastUpdated: new Date().toISOString() });
      const completedGoals = [
        next.steps >= next.profile.stepGoal ? 'steps' : '',
        next.water >= next.profile.waterGoal ? 'water' : '',
        next.sleep.duration >= next.profile.sleepGoal ? 'sleep' : '',
        next.exerciseMinutes >= next.profile.exerciseGoal ? 'exercise' : '',
      ].filter(Boolean);
      return { ...next, completedGoals };
    });
  };

  const value = useMemo<WellnessContextValue>(() => ({
    data,
    wellness: getWellnessState(data, activeState ?? data.activeActivity?.companionState),
    loading,
    activeState,
    setCompanionState: setActiveState,
    updateProfile: (profile) => update((current) => ({
      ...current,
      profile,
      cycleCareEnabled: profile.cycleTrackingConsent,
    })),
    addWater: (amount) => update((current) => ({ ...current, water: Math.min(current.water + amount, current.profile.waterGoal * 1.5), waterEntries: [{ id: `water-${Date.now()}`, amount, date: new Date().toISOString() }, ...current.waterEntries].slice(0, 100) })),
    addSteps: (amount) => update((current) => ({ ...current, steps: current.steps + amount })),
    addExercise: (minutes, type = 'exercise') => update((current) => ({
      ...current,
      exerciseMinutes: current.exerciseMinutes + minutes,
      activityHistory: [{ id: `${type}-${Date.now()}`, type, minutes, date: 'Today' }, ...current.activityHistory].slice(0, 10),
    })),
    addActivity: (activity) => update((current) => {
      const session = { ...activity, id: `activity-${Date.now()}`, date: new Date().toISOString(), completed: true, companionState: activity.companionState ?? getCompanionStateForActivity(activity.type) };
      const isMovement = activity.category === 'Fitness' || ['yoga', 'stretching', 'meditation', 'breathing'].includes(activity.type);
      const isStepActivity = activity.type === 'walking' || activity.type === 'running';
      return {
        ...current,
        exerciseMinutes: current.exerciseMinutes + (isMovement ? activity.minutes : 0),
        steps: current.steps + (isStepActivity ? activity.minutes * (activity.type === 'running' ? 150 : 90) : 0),
        activityHistory: [session, ...current.activityHistory].slice(0, 30),
      };
    }),
    addCustomActivity: (activity) => update((current) => ({ ...current, customActivities: [...current.customActivities, { ...activity, id: `custom-${Date.now()}` }] })),
    toggleFavorite: (activity) => update((current) => ({ ...current, profile: { ...current.profile, favoriteActivities: current.profile.favoriteActivities.includes(activity) ? current.profile.favoriteActivities.filter((item) => item !== activity) : [...current.profile.favoriteActivities, activity] } })),
    addFeeling: (feeling, note = '', severity) => update((current) => ({ ...current, wellnessCheckIns: [{ id: `checkin-${Date.now()}`, feeling, note, severity, date: new Date().toISOString() }, ...current.wellnessCheckIns].slice(0, 60) })),
    addCycleEntry: (entry) => update((current) => {
      if (!current.profile.cycleTrackingConsent) return current;
      return { ...current, cycleEntries: [{ ...entry, id: `cycle-${Date.now()}`, date: new Date().toISOString() }, ...current.cycleEntries].slice(0, 20) };
    }),
    startActivity: (activity) => update((current) => ({ ...current, activeActivity: { id: `active-${Date.now()}`, type: activity.type, name: activity.name, category: activity.category, minutes: 0, date: new Date().toISOString(), startedAt: new Date().toISOString(), elapsedSeconds: 0, icon: activity.icon, companionState: activity.companionState, completed: false } })),
    pauseActivity: () => update((current) => {
      if (!current.activeActivity || current.activeActivity.pausedAt) return current;
      const now = new Date();
      const elapsedSeconds = current.activeActivity.elapsedSeconds + Math.max(0, Math.round((now.getTime() - new Date(current.activeActivity.startedAt).getTime()) / 1000));
      return { ...current, activeActivity: { ...current.activeActivity, elapsedSeconds, pausedAt: now.toISOString() } };
    }),
    resumeActivity: () => update((current) => current.activeActivity ? ({ ...current, activeActivity: { ...current.activeActivity, startedAt: new Date().toISOString(), pausedAt: undefined } }) : current),
    finishActiveActivity: () => {
      let finished: ActivitySession | undefined;
      update((current) => {
        if (!current.activeActivity) return current;
        const active = current.activeActivity;
        const ended = new Date();
        const elapsedSeconds = active.pausedAt ? active.elapsedSeconds : active.elapsedSeconds + Math.max(0, Math.round((ended.getTime() - new Date(active.startedAt).getTime()) / 1000));
        finished = { ...active, minutes: Math.max(1, Math.round(elapsedSeconds / 60)), elapsedSeconds, endTime: ended.toISOString(), completed: true };
        return { ...current, activeActivity: undefined, activityHistory: [finished, ...current.activityHistory].slice(0, 60) };
      });
      return finished;
    },
    addMemory: (label, value) => update((current) => {
      if (!current.profile.aiMemoryConsent) return current;
      const newMemory = { id: `memory-${Date.now()}`, label, value, createdAt: new Date().toISOString() };
      const memories = [newMemory, ...(current.sakhiMemories ?? current.miraMemories ?? [])].slice(0, 30);
      return { ...current, sakhiMemories: memories, miraMemories: memories };
    }),
    removeMemory: (id) => update((current) => {
      const memories = (current.sakhiMemories ?? current.miraMemories ?? []).filter((memory) => memory.id !== id);
      return { ...current, sakhiMemories: memories, miraMemories: memories };
    }),
    setNotifications: (enabled) => update((current) => ({ ...current, appPreferences: { ...current.appPreferences, notifications: enabled } })),
    logSleep: (entry) => update((current) => {
      const sleep = { ...entry, id: `sleep-${Date.now()}`, date: new Date().toISOString() };
      return { ...current, sleep, sleepHistory: [sleep, ...current.sleepHistory].slice(0, 10) };
    }),
    logMood: (mood, note = '') => update((current) => {
      const moodEntry = { id: `mood-${Date.now()}`, mood, note, date: new Date().toISOString() };
      return { ...current, mood: moodEntry, moodHistory: [moodEntry, ...current.moodHistory].slice(0, 10) };
    }),
  }), [activeState, data, loading]);

  return <WellnessContext.Provider value={value}>{children}</WellnessContext.Provider>;
}

export function useWellness() {
  const context = useContext(WellnessContext);
  if (!context) throw new Error('useWellness must be used inside WellnessProvider');
  return context;
}
