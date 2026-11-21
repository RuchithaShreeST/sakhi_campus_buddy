import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Check, ChevronLeft, ChevronRight, Clock3, Trash2 } from 'lucide-react';

import { repositories } from '@/data/repositories';
import type { PlannerItemRow } from '@/types/database';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextInput } from '../components/ui';
import { formatDate, localDateKey } from '../lib/dates';

const DAY_MS = 86_400_000;

export function PlannerPage() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(localDateKey());
  const [view, setView] = useState<'day' | 'week'>('day');
  const items = useQuery({ queryKey: ['planner'], queryFn: repositories.planner.list });
  const priorities = useQuery({ queryKey: ['planner', 'top-three', selectedDate], queryFn: () => repositories.planner.getDailyTopThree(selectedDate) });
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [time, setTime] = useState('');
  const [minutes, setMinutes] = useState('25');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const secondsRef = useRef(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const timer = window.setInterval(() => {
      const remaining = Math.max(0, secondsRef.current - 1);
      secondsRef.current = remaining;
      setSecondsLeft(remaining);
      if (remaining === 0) setTimerRunning(false);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [timerRunning]);

  const weekDays = useMemo(() => {
    const start = new Date(`${selectedDate}T12:00:00`);
    const weekday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - weekday);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return localDateKey(date);
    });
  }, [selectedDate]);

  const create = useMutation({
    mutationFn: () => repositories.planner.create({
      title: title.trim(),
      category,
      date_key: selectedDate,
      start_time: time || null,
      duration_minutes: Number(minutes) || null,
    }),
    onSuccess: async () => {
      setTitle('');
      setTime('');
      await queryClient.invalidateQueries({ queryKey: ['planner'] });
    },
  });
  const update = useMutation({
    mutationFn: ({ id, changes }: { id: string; changes: Partial<PlannerItemRow> }) => repositories.planner.update(id, changes),
    onMutate: async ({ id, changes }) => {
      await queryClient.cancelQueries({ queryKey: ['planner'] });
      const previous = queryClient.getQueryData<PlannerItemRow[]>(['planner']);
      queryClient.setQueryData<PlannerItemRow[]>(['planner'], (current) => current?.map((item) => item.id === id ? { ...item, ...changes } : item));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(['planner'], context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
      void queryClient.invalidateQueries({ queryKey: ['planner', 'top-three', selectedDate] });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => repositories.planner.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['planner'] });
      void queryClient.invalidateQueries({ queryKey: ['planner', 'top-three', selectedDate] });
    },
  });
  const saveTopThree = useMutation({
    mutationFn: (ids: string[]) => repositories.planner.setDailyTopThree(selectedDate, ids),
    onMutate: async (ids) => {
      const key = ['planner', 'top-three', selectedDate] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData(key, ids);
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) queryClient.setQueryData(['planner', 'top-three', selectedDate], context.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['planner', 'top-three', selectedDate] }),
  });

  const dateItems = (items.data ?? []).filter((item) => item.date_key === selectedDate && !item.deleted_at).sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  const weekItems = (items.data ?? []).filter((item) => item.date_key && weekDays.includes(item.date_key) && !item.deleted_at);
  const candidates = dateItems.filter((item) => !item.completed);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    create.mutate();
  }

  function shiftDate(direction: number) {
    const next = new Date(`${selectedDate}T12:00:00`);
    next.setTime(next.getTime() + direction * (view === 'day' ? DAY_MS : 7 * DAY_MS));
    setSelectedDate(localDateKey(next));
  }

  function toggleTopThree(id: string) {
    const current = priorities.data ?? [];
    const updated = current.includes(id)
      ? current.filter((item) => item !== id)
      : current.length < 3 ? [...current, id] : current;
    saveTopThree.mutate(updated);
  }

  const topThree = priorities.data ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="Plan with room to breathe" title="Planner" description="Make a realistic plan with classes, tasks, deadlines, and breaks. Your plan can change when you do." />
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2"><Button variant="secondary" size="icon" aria-label="Previous date range" onClick={() => shiftDate(-1)}><ChevronLeft aria-hidden="true" /></Button><p className="min-w-36 text-center text-sm font-bold text-sakhi-ink">{formatDate(selectedDate, { month: 'long', day: 'numeric', year: 'numeric' })}</p><Button variant="secondary" size="icon" aria-label="Next date range" onClick={() => shiftDate(1)}><ChevronRight aria-hidden="true" /></Button></div>
        <div className="flex gap-2" role="group" aria-label="Planner view">{(['day', 'week'] as const).map((value) => <Button key={value} type="button" variant={view === value ? 'primary' : 'secondary'} aria-pressed={view === value} onClick={() => setView(value)}>{value === 'day' ? 'Day' : 'Week'}</Button>)}</div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <h2 className="text-lg font-bold text-sakhi-ink">{view === 'day' ? 'Your day' : 'This week'}</h2>
          {items.isLoading ? <Skeleton className="mt-4 h-48 w-full" /> : items.isError ? <><InlineMessage>Your planner could not load.</InlineMessage><Button className="mt-3" variant="secondary" onClick={() => void items.refetch()}>Retry</Button></> : view === 'day' ? (
            dateItems.length ? <ul className="mt-4 divide-y divide-sakhi-border">{dateItems.map((item) => <PlannerRow key={item.id} item={item} onComplete={() => update.mutate({ id: item.id, changes: { completed: !item.completed } })} onDelete={() => { if (window.confirm(`Delete “${item.title}”?`)) remove.mutate(item.id); }} />)}</ul> : <p className="mt-4 text-sm text-sakhi-muted">Nothing on this day yet. Add a task, class, deadline, or break.</p>
          ) : (
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">{weekDays.map((date) => <div key={date} className="min-h-28 rounded-xl border border-sakhi-border p-3"><h3 className="text-xs font-bold text-sakhi-rose">{formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' })}</h3>{weekItems.filter((item) => item.date_key === date).map((item) => <p key={item.id} className={`mt-2 truncate text-xs ${item.completed ? 'text-sakhi-muted line-through' : 'text-sakhi-ink'}`}>{item.start_time ? `${item.start_time} · ` : ''}{item.title}</p>)}</div>)}</div>
          )}
          {update.isError && <p role="alert" className="mt-3 text-sm text-rose-700">That update did not save. Your previous plan has been restored.</p>}
          {remove.isError && <div className="mt-3"><InlineMessage>{remove.error.message}</InlineMessage></div>}
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="text-lg font-bold text-sakhi-ink">Add to your plan</h2>
            <form className="mt-4 space-y-3" onSubmit={submit}>
              <div><FieldLabel htmlFor="planner-title">What would you like to plan?</FieldLabel><TextInput id="planner-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Review one topic" /></div>
              <div className="grid grid-cols-2 gap-3"><div><FieldLabel htmlFor="planner-category">Type</FieldLabel><select id="planner-category" className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink" value={category} onChange={(event) => setCategory(event.target.value)}>{['Class', 'Study', 'Assignment', 'Exam', 'Break', 'Personal'].map((value) => <option key={value}>{value}</option>)}</select></div><div><FieldLabel htmlFor="planner-time">Time</FieldLabel><TextInput id="planner-time" type="time" value={time} onChange={(event) => setTime(event.target.value)} /></div></div>
              <div><FieldLabel htmlFor="planner-duration">Duration in minutes</FieldLabel><TextInput id="planner-duration" type="number" min="5" max="720" step="5" value={minutes} onChange={(event) => setMinutes(event.target.value)} /></div>
              <Button disabled={create.isPending}>{create.isPending ? 'Adding…' : 'Add plan item'}</Button>
            </form>
            {create.isError && <div className="mt-3"><InlineMessage>{create.error.message}</InlineMessage></div>}
          </Card>

          <Card>
            <h2 className="text-lg font-bold text-sakhi-ink">Top three for {formatDate(selectedDate)}</h2>
            <p className="mt-1 text-sm text-sakhi-muted">Choose up to three priorities from this day’s plan.</p>
            {priorities.isError && <div className="mt-3"><InlineMessage>Priorities could not load.</InlineMessage><Button className="mt-2" type="button" variant="secondary" onClick={() => void priorities.refetch()}>Retry</Button></div>}
            <div className="mt-3 space-y-2">{candidates.length ? candidates.map((item) => <label key={item.id} className="flex min-h-11 items-center gap-3 rounded-lg px-2 text-sm text-sakhi-ink hover:bg-sakhi-lavender/20"><input type="checkbox" className="h-5 w-5 accent-sakhi-rose" checked={topThree.includes(item.id)} disabled={!topThree.includes(item.id) && topThree.length >= 3} onChange={() => toggleTopThree(item.id)} />{item.title}</label>) : <p className="text-sm text-sakhi-muted">Add a plan item to set priorities.</p>}</div>
            {saveTopThree.isError && <p role="alert" className="mt-3 text-sm text-rose-700">{saveTopThree.error.message}</p>}
          </Card>

          <Card>
            <div className="flex items-center gap-2"><Clock3 aria-hidden="true" className="text-sakhi-rose" size={18} /><h2 className="text-lg font-bold text-sakhi-ink">Focus timer</h2></div>
            <p className="mt-4 font-mono text-4xl font-bold text-sakhi-ink" role="timer" aria-label={`${Math.floor(secondsLeft / 60)} minutes ${secondsLeft % 60} seconds remaining`}>{String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:{String(secondsLeft % 60).padStart(2, '0')}</p>
            <p className="mt-2 text-xs text-sakhi-muted">A flexible focus block. Take a break whenever you need one.</p>
            <div className="mt-4 flex gap-2"><Button type="button" onClick={() => { if (secondsLeft === 0) { secondsRef.current = 25 * 60; setSecondsLeft(25 * 60); setTimerRunning(true); } else setTimerRunning((running) => !running); }}>{timerRunning ? 'Pause' : secondsLeft === 0 ? 'Start again' : 'Start focus'}</Button><Button type="button" variant="secondary" onClick={() => { setTimerRunning(false); secondsRef.current = 25 * 60; setSecondsLeft(25 * 60); }}>Reset</Button></div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PlannerRow({ item, onComplete, onDelete }: { item: PlannerItemRow; onComplete: () => void; onDelete: () => void }) {
  return <li className="flex min-h-16 items-center gap-3 py-2">
    <button type="button" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border ${item.completed ? 'border-sakhi-rose bg-sakhi-rose text-white' : 'border-sakhi-border text-sakhi-muted'}`} aria-label={item.completed ? `Mark ${item.title} incomplete` : `Mark ${item.title} complete`} onClick={onComplete}><Check aria-hidden="true" size={17} /></button>
    <div className="min-w-0 flex-1"><p className={`truncate text-sm font-semibold text-sakhi-ink ${item.completed ? 'line-through opacity-60' : ''}`}>{item.title}</p><p className="mt-1 text-xs text-sakhi-muted">{item.start_time ? `${item.start_time} · ` : ''}{item.category}{item.duration_minutes ? ` · ${item.duration_minutes} min` : ''}</p></div>
    <Button type="button" variant="ghost" size="icon" aria-label={`Delete ${item.title}`} onClick={onDelete}><Trash2 aria-hidden="true" size={17} /></Button>
  </li>;
}
