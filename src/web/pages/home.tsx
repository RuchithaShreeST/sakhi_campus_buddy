import { useQuery } from '@tanstack/react-query';
import { ArrowRight, HeartHandshake, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import { Card, PageHeading, Skeleton, TrustBadge } from '../components/ui';

export function HomePage() {
  const announcements = useQuery({
    queryKey: ['campus', 'announcements'],
    queryFn: repositories.campus.listAnnouncements,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="A fresh start, at your pace" title="Your Sakhi space" description="A friend for the everyday, a mentor for your next step, and a well-wisher for your wellbeing." />

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

      <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
