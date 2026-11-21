import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import type { WellnessLogRow } from '@/types/database';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextArea, TextInput } from '../components/ui';
import { formatDate, localDateKey } from '../lib/dates';

export function WellbeingPage() {
  const queryClient = useQueryClient();
  const [days, setDays] = useState(7);
  const [mood, setMood] = useState('');
  const [sleep, setSleep] = useState('');
  const [water, setWater] = useState('');
  const [steps, setSteps] = useState('');
  const [activity, setActivity] = useState('');
  const [cycleDate, setCycleDate] = useState(localDateKey());
  const [cycleNotes, setCycleNotes] = useState('');
  const [success, setSuccess] = useState('');

  const logs = useQuery({ queryKey: ['wellness', 'logs', days], queryFn: () => repositories.wellness.listLogs(days) });
  const summary = useQuery({ queryKey: ['wellness', 'summary', days], queryFn: () => repositories.wellness.getSummary(days) });
  const consent = useQuery({ queryKey: ['consents'], queryFn: repositories.consents.get });
  const cycleEntries = useQuery({
    queryKey: ['wellness', 'cycle'],
    queryFn: repositories.wellness.listCycleEntries,
    enabled: consent.data?.cycle_tracking_opt_in === true,
  });
  const saveLog = useMutation({
    mutationFn: (row: Partial<WellnessLogRow> & Pick<WellnessLogRow, 'logged_on'>) => repositories.wellness.saveLog(row),
    onSuccess: async () => {
      setSuccess('Your check-in was saved.');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['wellness', 'logs'] }),
        queryClient.invalidateQueries({ queryKey: ['wellness', 'summary'] }),
      ]);
    },
  });
  const saveCycle = useMutation({
    mutationFn: () => repositories.wellness.saveCycleEntry({ start_date: cycleDate, notes: cycleNotes.trim() || null }),
    onSuccess: async () => {
      setCycleNotes('');
      await queryClient.invalidateQueries({ queryKey: ['wellness', 'cycle'] });
    },
  });
  const deleteCycle = useMutation({
    mutationFn: (id: string) => repositories.wellness.deleteCycleEntry(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['wellness', 'cycle'] }),
  });

  function submitLog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess('');
    saveLog.mutate({
      logged_on: localDateKey(),
      mood: mood || undefined,
      sleep_hours: sleep ? Number(sleep) : undefined,
      water_ml: water ? Number(water) : undefined,
      steps: steps ? Number(steps) : undefined,
      activity_minutes: activity ? Number(activity) : undefined,
    });
  }

  function submitCycle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveCycle.mutate();
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="Your wellbeing is yours" title="Wellbeing" description="Notice patterns gently. These tools support reflection and do not diagnose, prescribe, or replace professional care." />
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Select trend range">
        {[7, 30].map((range) => <Button key={range} type="button" variant={days === range ? 'primary' : 'secondary'} aria-pressed={days === range} onClick={() => setDays(range)}>{range} days</Button>)}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <h2 className="text-lg font-bold text-sakhi-ink">Check in with yourself</h2>
          <p className="mt-1 text-sm text-sakhi-muted">All entries are stored in your local demo profile.</p>
          <form className="mt-5 space-y-4" onSubmit={submitLog}>
            <fieldset><legend className="mb-2 text-sm font-semibold text-sakhi-ink">Mood (optional)</legend><div className="flex flex-wrap gap-2">{['low', 'stressed', 'okay', 'good', 'great'].map((value) => <Button key={value} type="button" variant={mood === value ? 'primary' : 'secondary'} aria-pressed={mood === value} onClick={() => setMood(mood === value ? '' : value)}>{value[0].toUpperCase() + value.slice(1)}</Button>)}</div></fieldset>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><FieldLabel htmlFor="log-sleep">Sleep hours</FieldLabel><TextInput id="log-sleep" type="number" min="0" max="24" step="0.5" inputMode="decimal" value={sleep} onChange={(event) => setSleep(event.target.value)} /></div>
              <div><FieldLabel htmlFor="log-water">Water (ml)</FieldLabel><TextInput id="log-water" type="number" min="0" max="10000" step="50" inputMode="numeric" value={water} onChange={(event) => setWater(event.target.value)} /></div>
              <div><FieldLabel htmlFor="log-steps">Steps</FieldLabel><TextInput id="log-steps" type="number" min="0" max="100000" step="100" inputMode="numeric" value={steps} onChange={(event) => setSteps(event.target.value)} /></div>
              <div><FieldLabel htmlFor="log-activity">Activity minutes</FieldLabel><TextInput id="log-activity" type="number" min="0" max="1440" step="5" inputMode="numeric" value={activity} onChange={(event) => setActivity(event.target.value)} /></div>
            </div>
            <Button disabled={saveLog.isPending}>{saveLog.isPending ? 'Saving…' : 'Save today’s check-in'}</Button>
          </form>
          {success && <div className="mt-3"><InlineMessage tone="success">{success}</InlineMessage></div>}
          {saveLog.isError && <div className="mt-3"><InlineMessage>{saveLog.error.message}</InlineMessage></div>}
        </Card>

        <Card>
          <h2 className="text-lg font-bold text-sakhi-ink">Your balance snapshot</h2>
          {summary.isLoading ? <Skeleton className="mt-4 h-40 w-full" /> : summary.isError || !summary.data ? <InlineMessage>We could not calculate your summary. Try again.</InlineMessage> : <>
            <p className="mt-3 text-5xl font-bold text-sakhi-rose" aria-label={`Supportive balance score ${summary.data.score ?? 'not available'}`}>{summary.data.score ?? '—'}<span className="ml-1 text-base font-semibold text-sakhi-muted">/100</span></p>
            <p className="mt-2 text-xs leading-5 text-sakhi-muted">{summary.data.medicalDisclaimer}</p>
            <dl className="mt-5 space-y-3">{Object.entries(summary.data.breakdown).map(([name, value]) => <div key={name}><div className="flex justify-between gap-3 text-sm"><dt className="capitalize text-sakhi-ink">{name.replace(/([A-Z])/g, ' $1')}</dt><dd className="text-sakhi-muted">{Math.round(value)} points</dd></div><div className="mt-1 h-2 rounded-full bg-sakhi-lavender/40" role="img" aria-label={`${name} contributes ${Math.round(value)} points`}><div className="h-full rounded-full bg-sakhi-rose" style={{ width: `${Math.min(100, Math.max(0, value * 4))}%` }} /></div></div>)}</dl>
            {summary.data.burnoutSignal && <InlineMessage tone="info">You may benefit from easing your workload and taking a real break. This is a supportive signal, not a diagnosis.</InlineMessage>}
            <p className="mt-4 text-sm leading-5 text-sakhi-muted">{summary.data.suggestion}</p>
          </>}
        </Card>
      </div>

      <Card className="mt-5">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-sakhi-ink">Recent trends</h2><p className="mt-1 text-sm text-sakhi-muted">Each bar is one private daily check-in.</p></div><span className="text-xs text-sakhi-muted">Last {days} days</span></div>
        {logs.isLoading ? <Skeleton className="mt-5 h-44 w-full" /> : logs.isError ? <InlineMessage>Trend data could not load.</InlineMessage> : logs.data?.length ? <div className="mt-5 flex min-h-44 items-end gap-1 overflow-x-auto pb-2" role="img" aria-label={`Daily check-in trend across ${logs.data.length} days; values are not a diagnosis.`}>{logs.data.map((log) => <div key={log.id} className="flex min-w-8 flex-col items-center gap-2"><div title={`${formatDate(log.logged_on)}: mood ${log.mood ?? 'not recorded'}, sleep ${log.sleep_hours ?? 'not recorded'} hours`} className="w-5 rounded-t-md bg-sakhi-rose/80" style={{ height: `${Math.max(12, Math.min(120, (log.sleep_hours ?? 2) * 10))}px` }} /><span className="text-[10px] text-sakhi-muted">{formatDate(log.logged_on, { day: 'numeric' })}</span></div>)}</div> : <p className="mt-5 text-sm text-sakhi-muted">No entries in this range. A check-in is always optional.</p>}
      </Card>

      <Card className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-sakhi-ink">Optional cycle tracking</h2><p className="mt-1 max-w-2xl text-sm leading-5 text-sakhi-muted">Cycle tracking is off unless you give consent. Entries stay private to your local profile; Sakhi does not use them to diagnose or prescribe.</p></div></div>
        {consent.isLoading ? <Skeleton className="mt-4 h-12 w-full" /> : !consent.data?.cycle_tracking_opt_in ? <div className="mt-4"><InlineMessage tone="info">Cycle tracking is currently off. Review the consent explanation in <Link className="font-semibold underline" to="/settings">Privacy settings</Link> before enabling it.</InlineMessage></div> : <>
          <p className="mt-4 text-sm leading-5 text-sakhi-muted">If you choose, you can note patterns that feel useful to you. Any suggestions are gentle reflections, not medical guidance.</p>
          <form className="mt-4 grid gap-3 sm:grid-cols-[1fr_2fr_auto]" onSubmit={submitCycle}>
            <div><FieldLabel htmlFor="cycle-date">Start date</FieldLabel><TextInput id="cycle-date" type="date" required value={cycleDate} onChange={(event) => setCycleDate(event.target.value)} /></div>
            <div><FieldLabel htmlFor="cycle-notes">Optional note</FieldLabel><TextArea id="cycle-notes" rows={1} maxLength={300} value={cycleNotes} onChange={(event) => setCycleNotes(event.target.value)} placeholder="A note for yourself" /></div>
            <div className="self-end"><Button disabled={saveCycle.isPending}>{saveCycle.isPending ? 'Saving…' : 'Add entry'}</Button></div>
          </form>
          {saveCycle.isError && <div className="mt-3"><InlineMessage>{saveCycle.error.message}</InlineMessage></div>}
          {cycleEntries.isLoading ? <Skeleton className="mt-4 h-12 w-full" /> : cycleEntries.isError ? <div className="mt-4"><InlineMessage>Cycle entries could not load.</InlineMessage><Button className="mt-2" type="button" variant="secondary" onClick={() => void cycleEntries.refetch()}>Retry</Button></div> : cycleEntries.data?.length ? <ul className="mt-4 divide-y divide-sakhi-border">{cycleEntries.data.map((entry) => <li key={entry.id} className="flex min-h-12 items-center justify-between gap-3 py-2"><span className="text-sm text-sakhi-ink">{formatDate(entry.start_date)}{entry.notes ? ` · ${entry.notes}` : ''}</span><Button variant="ghost" type="button" onClick={() => { if (window.confirm('Delete this cycle entry?')) deleteCycle.mutate(entry.id); }}>Delete entry</Button></li>)}</ul> : <p className="mt-4 text-sm text-sakhi-muted">No cycle entries.</p>}
          {deleteCycle.isError && <div className="mt-3"><InlineMessage>{deleteCycle.error.message}</InlineMessage></div>}
        </>}
      </Card>
      <p className="mt-4 text-center text-xs leading-5 text-sakhi-muted">Wellbeing information is educational and supportive, not medical advice. For personal health concerns, contact a qualified professional.</p>
    </div>
  );
}
