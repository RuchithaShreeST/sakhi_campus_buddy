import { useEffect, useState } from 'react';

import { ActivityDefinition } from '@/types/wellness';

export function useActivitySession() {
  const [activity, setActivity] = useState<ActivityDefinition>();
  const [seconds, setSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [startedAt, setStartedAt] = useState<string>();

  useEffect(() => {
    if (!activity || paused) return;
    const interval = setInterval(() => setSeconds((current) => current + 1), 1000);
    return () => clearInterval(interval);
  }, [activity, paused]);

  const start = (nextActivity: ActivityDefinition) => {
    setActivity(nextActivity);
    setSeconds(0);
    setPaused(false);
    setStartedAt(new Date().toISOString());
  };
  const pause = () => setPaused((current) => !current);
  const finish = () => {
    const result = { activity, seconds, startedAt, endedAt: new Date().toISOString() };
    setActivity(undefined);
    setSeconds(0);
    setPaused(false);
    setStartedAt(undefined);
    return result;
  };
  return { activity, seconds, paused, startedAt, start, pause, finish };
}

export function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${remainder}`;
}
