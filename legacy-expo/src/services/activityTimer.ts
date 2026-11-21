export type ActivityTimerSnapshot = {
  startedAt: string;
  pausedAt?: string;
  resumedAt?: string;
  endedAt?: string;
  elapsedSeconds: number;
  running: boolean;
};

export function createTimer(now = new Date()): ActivityTimerSnapshot {
  return { startedAt: now.toISOString(), resumedAt: now.toISOString(), elapsedSeconds: 0, running: true };
}

export function elapsedAt(timer: ActivityTimerSnapshot, now = new Date()): number {
  if (!timer.running || timer.pausedAt) return timer.elapsedSeconds;
  const anchor = new Date(timer.resumedAt ?? timer.startedAt).getTime();
  return timer.elapsedSeconds + Math.max(0, Math.round((now.getTime() - anchor) / 1000));
}

export function tickTimer(timer: ActivityTimerSnapshot, now = new Date()): ActivityTimerSnapshot {
  if (!timer.running || timer.pausedAt) return timer;
  return { ...timer, elapsedSeconds: elapsedAt(timer, now) };
}

export function pauseTimer(timer: ActivityTimerSnapshot, now = new Date()): ActivityTimerSnapshot {
  if (!timer.running || timer.pausedAt) return timer;
  return { ...timer, elapsedSeconds: elapsedAt(timer, now), pausedAt: now.toISOString(), running: false };
}

export function resumeTimer(timer: ActivityTimerSnapshot, now = new Date()): ActivityTimerSnapshot {
  if (timer.running && !timer.pausedAt) return timer;
  return { ...timer, startedAt: timer.startedAt, resumedAt: now.toISOString(), pausedAt: undefined, running: true };
}

export function finishTimer(timer: ActivityTimerSnapshot, now = new Date()): ActivityTimerSnapshot {
  const elapsedSeconds = elapsedAt(timer, now);
  return { ...timer, elapsedSeconds, endedAt: now.toISOString(), pausedAt: timer.pausedAt, running: false };
}

export function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(safe / 3600).toString().padStart(2, '0');
  const minutes = Math.floor((safe % 3600) / 60).toString().padStart(2, '0');
  const remainder = (safe % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${remainder}`;
}

export function minutesFromSeconds(seconds: number) {
  return Math.max(1, Math.round(Math.max(0, seconds) / 60));
}
