import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import { Button, Card, EmptyState, InlineMessage, PageHeading, Skeleton } from '../components/ui';
import { formatDate } from '../lib/dates';

export function NotificationsPage() {
  const queryClient = useQueryClient();
  const notifications = useQuery({ queryKey: ['notifications'], queryFn: repositories.notifications.list });
  const markRead = useMutation({
    mutationFn: (id: string) => repositories.notifications.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['notifications'] });
      const previous = queryClient.getQueryData<Awaited<ReturnType<typeof repositories.notifications.list>>>(['notifications']);
      queryClient.setQueryData(['notifications'], (current: typeof previous) => current?.map((row) => row.id === id ? { ...row, read_at: new Date().toISOString() } : row));
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) queryClient.setQueryData(['notifications'], context.previous);
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAll = useMutation({
    mutationFn: repositories.notifications.markAllRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const unread = notifications.data?.filter((item) => !item.read_at).length ?? 0;

  return <div className="mx-auto max-w-4xl">
    <PageHeading eyebrow="Stay in the loop" title="Notifications" description="A local preview of updates related to your Sakhi spaces." action={unread ? <Button variant="secondary" disabled={markAll.isPending} onClick={() => markAll.mutate()}>Mark all read</Button> : undefined} />
    {notifications.isLoading ? <div className="space-y-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div> : notifications.isError ? <><InlineMessage>Notifications could not load.</InlineMessage><Button className="mt-3" variant="secondary" onClick={() => void notifications.refetch()}>Retry</Button></> : notifications.data?.length ? <ul className="space-y-3">{notifications.data.map((item) => <li key={item.id}><Card className={!item.read_at ? 'border-sakhi-rose/50' : ''}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span aria-hidden="true" className={`mt-1 h-2.5 w-2.5 rounded-full ${item.read_at ? 'bg-sakhi-border' : 'bg-sakhi-rose'}`} /><div><h2 className="font-bold text-sakhi-ink">{item.title}</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">{item.body}</p><p className="mt-2 text-xs text-sakhi-muted">{item.category} · {formatDate(item.created_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p></div></div>{!item.read_at && <Button variant="secondary" onClick={() => markRead.mutate(item.id)}>Mark read</Button>}</div></Card></li>)}</ul> : <EmptyState title="You’re all caught up" description="New local demo notifications will appear here." />}
    {markRead.isError && <div className="mt-4"><InlineMessage>{markRead.error.message}</InlineMessage></div>}
    {markAll.isError && <div className="mt-4"><InlineMessage>{markAll.error.message}</InlineMessage></div>}
    <Link className="mt-5 inline-flex min-h-11 items-center font-semibold text-sakhi-rose underline" to="/settings">Manage notification preferences</Link>
  </div>;
}
