import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CalendarDays, HeartHandshake, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import type { WellnessLogRow } from '@/types/database';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, InlineMessage, PageHeading, Skeleton, TrustBadge } from '../components/ui';
import { daysFromToday, formatDate, localDateKey } from '../lib/dates';

export function HomePage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const announcements = useQuery({
    queryKey: ['campus', 'announcements'],
    queryFn: repositories.campus.listAnnouncements,
  });
  const planner = useQuery({ queryKey: ['planner'], queryFn: repositories.planner.list });
  const placements = useQuery({ queryKey: ['campus', 'placements'], queryFn: repositories.campus.listPlacements });
  const summary = useQuery({ queryKey: ['wellness', 'summary', 7], queryFn: () => repositories.wellness.getSummary(7) });
  const logs = useQuery({ queryKey: ['wellness', 'logs', 7], queryFn: () => repositories.wellness.listLogs(7) });
  const consents = useQuery({ queryKey: ['consents'], queryFn: repositories.consents.get });

  const logMutation = useMutation({
    mutationFn: (changes: Partial<WellnessLogRow> & Pick<WellnessLogRow, 'logged_on'>) => repositories.wellness.saveLog(changes),
    onMutate: async (changes) => {
      const key = ['wellness', 'logs', 7] as const;
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<WellnessLogRow[]>(key);
      const current = previous ?? [];
      const old = current.find((item) => item.logged_on === changes.logged_on);
      const optimistic: WellnessLogRow = {
        id: old?.id ?? 'optimistic-today',
        user_id: profile?.id ?? '',
        logged_on: changes.logged_on,
        mood: changes.mood ?? old?.mood ?? null,
        mood_note: changes.mood_note ?? old?.mood_note ?? null,
        sleep_hours: changes.sleep_hours ?? old?.sleep_hours ?? null,
        water_ml: changes.water_ml ?? old?.water_ml ?? null,
        steps: changes.steps ?? old?.steps ?? null,
        exercise_minutes: changes.exercise_minutes ?? old?.exercise_minutes ?? null,
        activity_minutes: changes.activity_minutes ?? old?.activity_minutes ?? null,
        created_at: old?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };
      queryClient.setQueryData(key, [...current.filter((item) => item.logged_on !== changes.logged_on), optimistic]);
      return { previous };
    },
    onError: (_error, _changes, context) => {
      if (context?.previous) queryClient.setQueryData(['wellness', 'logs', 7], context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['wellness'] });
    },
  });

  const today = localDateKey();
  const todayItems = (planner.data ?? []).filter((item) => item.date_key === today && !item.completed).sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
  const nextPlacement = (placements.data ?? []).filter((item) => item.deadline && daysFromToday(item.deadline) !== null && (daysFromToday(item.deadline) ?? -1) >= 0).sort((a, b) => (a.deadline ?? '').localeCompare(b.deadline ?? ''))[0];
  const currentLog = (logs.data ?? []).find((item) => item.logged_on === today);
  const weekStreak = calculateStreak(logs.data ?? []);
  const queryError = announcements.isError || planner.isError || placements.isError || summary.isError || logs.isError || consents.isError;

  function log(changes: Partial<WellnessLogRow>) {
    logMutation.mutate({ ...changes, logged_on: today });
  }

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow={formatDate(today, { weekday: 'long', month: 'long', day: 'numeric' })} title={`A gentle hello${profile?.display_name ? `, ${profile.display_name}` : ''}`} description="A friend for the everyday, a mentor for your next step, and a well-wisher for your wellbeing." />
      {queryError && <InlineMessage>Some of today’s details could not load. The rest of your Sakhi space is still available.</InlineMessage>}

      <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
        <Card className="overflow-hidden border-0 bg-gradient-to-br from-pink-100 via-rose-50 to-violet-100 p-6 dark:from-pink-950/60 dark:via-rose-950/40 dark:to-violet-950/60 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="max-w-xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-bold text-sakhi-rose dark:bg-black/20">
                <Sparkles aria-hidden="true" size={14} /> YOUR COMPANION
              </span>
              <h2 className="mt-4 text-2xl font-bold text-sakhi-ink sm:text-3xl">You don’t have to figure it all out at once.</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-sakhi-muted">Start with one small thing: check in with yourself, plan a task, or explore a demo campus space.</p>
              <Link to="/help" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-sakhi-rose px-4 font-semibold text-white hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose focus-visible:ring-offset-2">
                Talk to Sakhi <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </div>
            <div aria-hidden="true" className="grid h-28 w-28 shrink-0 place-items-center rounded-full bg-white/75 text-5xl shadow-card dark:bg-black/20 sm:h-36 sm:w-36">🌷</div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-sakhi-lavender/40 text-sakhi-rose"><HeartHandshake aria-hidden="true" size={20} /></span>
            <div>
              <h2 className="font-bold text-sakhi-ink">A gentle reminder</h2>
              <p className="text-xs text-sakhi-muted">Your day is more than a checklist.</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-sakhi-muted">Take a breath, drink some water, or ask for help when you need it. You get to choose what feels supportive.</p>
          <p className="mt-4 text-xs leading-5 text-sakhi-muted">Sakhi wellbeing insights are supportive and are not medical advice.</p>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="sm:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Quick check-in</p><h2 className="mt-1 text-lg font-bold text-sakhi-ink">How are you feeling?</h2></div>
            <span className="text-xs text-sakhi-muted">Only you can see this</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Log your mood">
            {['low', 'okay', 'good', 'great'].map((mood) => <Button key={mood} type="button" variant={currentLog?.mood === mood ? 'primary' : 'secondary'} disabled={logMutation.isPending} aria-pressed={currentLog?.mood === mood} onClick={() => log({ mood })}>{mood[0].toUpperCase() + mood.slice(1)}</Button>)}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div><p className="text-sm font-semibold text-sakhi-ink">Water today: {Math.round((currentLog?.water_ml ?? 0) / 250)} glasses</p><p className="mt-1 text-xs text-sakhi-muted">A gentle reminder, not a goal.</p><Button className="mt-2" type="button" variant="secondary" disabled={logMutation.isPending} onClick={() => log({ water_ml: (currentLog?.water_ml ?? 0) + 250 })}>Add a glass</Button></div>
            <div><label htmlFor="sleep-select" className="text-sm font-semibold text-sakhi-ink">Sleep hours last night</label><select id="sleep-select" value={currentLog?.sleep_hours ?? ''} onChange={(event) => log({ sleep_hours: Number(event.target.value) })} className="mt-2 block min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink"><option value="">Not logged</option>{Array.from({ length: 25 }, (_, index) => index / 2).map((value) => <option key={value} value={value}>{value} hours</option>)}</select></div>
          </div>
          {logMutation.isError && <p role="alert" className="mt-3 text-sm text-rose-700">Your check-in did not save. Please try again.</p>}
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Today’s balance</p>
          {summary.isLoading ? <Skeleton className="mt-4 h-14 w-full" /> : <div className="mt-3 flex items-center gap-4"><ScoreRing score={summary.data?.score ?? null} /><p className="text-sm text-sakhi-muted">A gentle snapshot, never a diagnosis.</p></div>}
          <Link to="/wellbeing" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-sakhi-rose">Wellbeing <ArrowRight aria-hidden="true" size={16} /></Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Your streak</p>
          <p className="mt-3 text-3xl font-bold text-sakhi-ink" aria-label={`${weekStreak} day check-in streak`}>{weekStreak} <span className="text-base font-semibold">days</span></p>
          <p className="mt-2 text-sm text-sakhi-muted">Every check-in is optional. Showing up for yourself counts.</p>
        </Card>

        <Card className="sm:col-span-2">
          <div className="flex items-center gap-2"><CalendarDays aria-hidden="true" className="text-sakhi-rose" size={18} /><h2 className="font-bold text-sakhi-ink">Today’s plan</h2></div>
          {planner.isLoading ? <Skeleton className="mt-4 h-16 w-full" /> : todayItems.length ? <ul className="mt-3 space-y-3">{todayItems.slice(0, 3).map((item) => <li key={item.id} className="flex items-center justify-between gap-3 text-sm"><span className="font-medium text-sakhi-ink">{item.title}</span><span className="shrink-0 text-sakhi-muted">{item.start_time ?? item.category}</span></li>)}</ul> : <p className="mt-3 text-sm text-sakhi-muted">No items planned for today yet. You can make room for a class, a task, or a break.</p>}
          <Link to="/planner" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-sakhi-rose">Open planner <ArrowRight aria-hidden="true" size={16} /></Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">One gentle nudge</p>
          <p className="mt-3 text-sm leading-6 text-sakhi-muted">{summary.data?.burnoutSignal ? summary.data.suggestion : 'A small pause between tasks can be productive too.'}</p>
          <p className="mt-3 text-xs text-sakhi-muted">{summary.data?.medicalDisclaimer ?? 'Supportive information only; not medical advice.'}</p>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">One growth nudge</p>
          <p className="mt-3 text-sm leading-6 text-sakhi-muted">Pick one next step you can finish in a short session. It does not need to be perfect.</p>
          <Link to="/grow" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-sakhi-rose">Explore growth <ArrowRight aria-hidden="true" size={16} /></Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Upcoming opportunity</p>
          {placements.isLoading ? <Skeleton className="mt-4 h-16 w-full" /> : nextPlacement ? <><h2 className="mt-2 font-bold text-sakhi-ink">{nextPlacement.role}</h2><p className="mt-1 text-sm text-sakhi-muted">{nextPlacement.company} · deadline {formatDate(nextPlacement.deadline)}</p><div className="mt-3"><TrustBadge trust={nextPlacement.trust_label} /></div></> : <p className="mt-3 text-sm text-sakhi-muted">No upcoming demo deadlines.</p>}
          <Link to="/grow" className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-sakhi-rose">Placement prep <ArrowRight aria-hidden="true" size={16} /></Link>
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Campus preview</p>
          <h2 className="mt-2 text-lg font-bold text-sakhi-ink">Demo campus update</h2>
          {announcements.isLoading ? <Skeleton className="mt-4 h-16 w-full" /> : announcements.isError ? (
            <p role="alert" className="mt-4 text-sm text-sakhi-muted">The demo update couldn’t load. Please try again.</p>
          ) : announcements.data?.[0] ? (
            <>
              <p className="mt-3 text-sm leading-6 text-sakhi-muted">{announcements.data[0].body}</p>
              <div className="mt-4"><TrustBadge trust={announcements.data[0].trust_label} /></div>
            </>
          ) : <p className="mt-3 text-sm text-sakhi-muted">No campus updates yet.</p>}
        </Card>

        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Plan gently</p>
          <h2 className="mt-2 text-lg font-bold text-sakhi-ink">Make room for one next step</h2>
          <p className="mt-3 text-sm leading-6 text-sakhi-muted">A study block, class, break, or something fun can all belong in your day.</p>
          <Link to="/planner" className="mt-4 inline-flex min-h-11 items-center gap-2 font-semibold text-sakhi-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose">Open planner <ArrowRight aria-hidden="true" size={16} /></Link>
        </Card>

        <Card className="md:col-span-2 xl:col-span-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-sakhi-rose">Local demo mode</p>
          <h2 className="mt-2 text-lg font-bold text-sakhi-ink">Private preview workspace</h2>
          <p className="mt-3 text-sm leading-6 text-sakhi-muted">Sample content is synthetic and clearly labelled. No live Supabase project is connected yet.</p>
        </Card>
      </div>
    </div>
  );
}

function ScoreRing({ score }: { score: number | null }) {
  const safeScore = score === null ? 0 : Math.max(0, Math.min(100, score));
  return <div role="img" aria-label={score === null ? 'Wellbeing score not available yet' : `Supportive balance score ${score} out of 100`} className="grid h-16 w-16 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--rose)) ${safeScore * 3.6}deg, hsl(var(--lavender)) 0deg)` }}><span className="grid h-12 w-12 place-items-center rounded-full bg-sakhi-surface text-lg font-bold text-sakhi-ink">{score ?? '—'}</span></div>;
}

function calculateStreak(logs: WellnessLogRow[]) {
  const days = new Set(logs.filter((log) => log.mood !== null || log.sleep_hours !== null || (log.water_ml ?? 0) > 0 || (log.steps ?? 0) > 0 || (log.activity_minutes ?? 0) > 0 || (log.exercise_minutes ?? 0) > 0).map((log) => log.logged_on));
  const cursor = new Date();
  let count = 0;
  for (let index = 0; index < 30; index += 1) {
    const key = localDateKey(cursor);
    if (!days.has(key)) break;
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}
