import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Bookmark, CalendarDays, MapPin, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import { Button, Card, EmptyState, InlineMessage, PageHeading, Skeleton, TrustBadge } from '../components/ui';
import { formatDate } from '../lib/dates';

type CampusTab = 'announcements' | 'clubs' | 'events';

export function CampusPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<CampusTab>('announcements');
  const announcements = useQuery({ queryKey: ['campus', 'announcements'], queryFn: repositories.campus.listAnnouncements });
  const clubs = useQuery({ queryKey: ['campus', 'clubs'], queryFn: repositories.campus.listClubs });
  const memberships = useQuery({ queryKey: ['campus', 'club-memberships'], queryFn: repositories.campus.listClubMemberships });
  const events = useQuery({ queryKey: ['campus', 'events'], queryFn: repositories.campus.listEvents });
  const registrations = useQuery({ queryKey: ['campus', 'event-registrations'], queryFn: repositories.campus.listEventRegistrations });
  const savedEvents = useQuery({ queryKey: ['campus', 'saved-events'], queryFn: repositories.campus.listSavedEvents });
  const refresh = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: ['campus', 'clubs'] }),
    queryClient.invalidateQueries({ queryKey: ['campus', 'club-memberships'] }),
    queryClient.invalidateQueries({ queryKey: ['campus', 'events'] }),
    queryClient.invalidateQueries({ queryKey: ['campus', 'event-registrations'] }),
    queryClient.invalidateQueries({ queryKey: ['campus', 'saved-events'] }),
  ]);
  const clubAction = useMutation({
    mutationFn: async ({ id, joined }: { id: string; joined: boolean }) => {
      if (joined) await repositories.campus.leaveClub(id);
      else await repositories.campus.joinClub(id);
    },
    onSuccess: () => void refresh(),
  });
  const eventAction = useMutation({
    mutationFn: ({ id, saved }: { id: string; saved: boolean }) => repositories.campus.saveEvent(id, saved),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['campus', 'saved-events'] }),
  });
  const register = useMutation({
    mutationFn: (id: string) => repositories.campus.registerEvent(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['campus', 'event-registrations'] }),
  });

  const loading = announcements.isLoading || clubs.isLoading || memberships.isLoading || events.isLoading || registrations.isLoading || savedEvents.isLoading;
  const hasError = announcements.isError || clubs.isError || memberships.isError || events.isError || registrations.isError || savedEvents.isError;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="Demo campus spaces" title="Campus" description="Browse synthetic campus updates, clubs, and events. Content is clearly labelled and is not an official campus source." action={<Link to="/placements" className="inline-flex min-h-11 items-center rounded-xl border border-sakhi-border px-4 text-sm font-semibold text-sakhi-rose">Placement prep</Link>} />
      {hasError && <div className="mb-4"><InlineMessage>Some campus information could not load. Check your connection and retry.</InlineMessage><Button className="mt-2" variant="secondary" onClick={() => { void announcements.refetch(); void clubs.refetch(); void memberships.refetch(); void events.refetch(); void registrations.refetch(); void savedEvents.refetch(); }}>Retry</Button></div>}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Campus content">
        {(['announcements', 'clubs', 'events'] as const).map((value) => <Button key={value} type="button" role="tab" aria-selected={tab === value} variant={tab === value ? 'primary' : 'secondary'} onClick={() => setTab(value)}>{value[0].toUpperCase() + value.slice(1)}</Button>)}
      </div>
      {loading ? <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div> : (
        <div className="grid gap-4 md:grid-cols-2">
          {tab === 'announcements' && (announcements.data?.length ? announcements.data.map((item) => <Card key={item.id}><div className="flex items-start justify-between gap-3"><h2 className="text-lg font-bold text-sakhi-ink">{item.title}</h2><TrustBadge trust={item.trust_label} /></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-sakhi-muted">{item.body}</p><p className="mt-4 text-xs text-sakhi-muted">{item.author_name ?? 'Demo source'} · {formatDate(item.created_at)}</p></Card>) : <div className="md:col-span-2"><EmptyState title="No announcements yet" description="Demo campus updates will appear here when available." /></div>)}
          {tab === 'clubs' && (clubs.data?.length ? clubs.data.map((club) => {
            const joined = memberships.data?.some((item) => item.club_id === club.id);
            return <Card key={club.id}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sakhi-lavender/40 text-sakhi-rose"><UsersRound aria-hidden="true" size={19} /></span><div><h2 className="font-bold text-sakhi-ink">{club.name}</h2><p className="text-xs text-sakhi-muted">{club.category}</p></div></div><TrustBadge trust={club.trust_label} /></div><p className="mt-4 text-sm leading-5 text-sakhi-muted">{club.description}</p><p className="mt-3 text-xs text-sakhi-muted">{club.meeting_time} · {club.location}</p><Button className="mt-4" variant={joined ? 'secondary' : 'primary'} disabled={clubAction.isPending} onClick={() => clubAction.mutate({ id: club.id, joined: Boolean(joined) })}>{joined ? 'Leave demo club' : 'Join demo club'}</Button></Card>;
          }) : <div className="md:col-span-2"><EmptyState title="No clubs to explore" description="Demo clubs will appear here when available." /></div>)}
          {tab === 'events' && (events.data?.length ? events.data.map((event) => {
            const registration = registrations.data?.find((item) => item.event_id === event.id);
            const saved = savedEvents.data?.includes(event.id) ?? false;
            return <Card key={event.id}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sakhi-lavender/40 text-sakhi-rose"><CalendarDays aria-hidden="true" size={19} /></span><div><h2 className="font-bold text-sakhi-ink">{event.title}</h2><p className="text-xs text-sakhi-muted">{event.category ?? 'Demo event'}</p></div></div><TrustBadge trust={event.trust_label} /></div><p className="mt-4 text-sm leading-5 text-sakhi-muted">{event.description}</p><p className="mt-3 flex items-center gap-1 text-xs text-sakhi-muted"><MapPin aria-hidden="true" size={14} />{event.venue ?? 'Demo location'} · {formatDate(event.starts_at, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" type="button" aria-pressed={saved} onClick={() => eventAction.mutate({ id: event.id, saved: !saved })}><Bookmark aria-hidden="true" size={15} />{saved ? 'Saved' : 'Save event'}</Button><Button type="button" disabled={Boolean(registration && registration.status !== 'cancelled') || register.isPending} onClick={() => register.mutate(event.id)}>{registration?.status === 'registered' ? 'Registered' : registration?.status === 'waitlisted' ? 'Waitlisted' : 'Register'}</Button></div>{registration?.status && registration.status !== 'cancelled' && <p className="mt-2 text-xs text-sakhi-muted" role="status">Your demo registration is {registration.status}.</p>}</Card>;
          }) : <div className="md:col-span-2"><EmptyState title="No upcoming demo events" description="Generated event samples will appear here." /></div>)}
        </div>
      )}
      {clubAction.isError && <div className="mt-4"><InlineMessage>{clubAction.error.message}</InlineMessage></div>}
      {register.isError && <div className="mt-4"><InlineMessage>{register.error.message}</InlineMessage></div>}
      {eventAction.isError && <div className="mt-4"><InlineMessage>{eventAction.error.message}</InlineMessage></div>}
    </div>
  );
}
