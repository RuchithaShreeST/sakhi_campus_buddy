import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Heart, MessageCircle, Send, ShieldAlert, UserRoundPlus, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import type { PostRow, ProfileRow } from '@/types/database';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, EmptyState, FieldLabel, InlineMessage, PageHeading, Skeleton, TextArea, TextInput, TrustBadge } from '../components/ui';
import { formatDate } from '../lib/dates';

type CircleTab = 'feed' | 'buddies' | 'messages';

export function CirclePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [tab, setTab] = useState<CircleTab>('feed');
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('Study');
  const [anonymous, setAnonymous] = useState(false);
  const posts = useQuery({ queryKey: ['circle', 'posts'], queryFn: repositories.circle.listPosts });
  const reactions = useQuery({ queryKey: ['circle', 'reactions'], queryFn: repositories.circle.listReactions });
  const comments = useQuery({ queryKey: ['circle', 'comments', selectedPost], queryFn: () => repositories.circle.listComments(selectedPost!), enabled: Boolean(selectedPost) });
  const consent = useQuery({ queryKey: ['consents'], queryFn: repositories.consents.get });
  const profiles = useQuery({ queryKey: ['circle', 'discoverable-profiles'], queryFn: repositories.circle.listDiscoverableProfiles, enabled: consent.data?.discovery_visible === true });
  const connections = useQuery({ queryKey: ['circle', 'connections'], queryFn: repositories.circle.listConnections });
  const blocked = useQuery({ queryKey: ['circle', 'blocked'], queryFn: repositories.circle.listBlockedUsers });
  const messages = useQuery({ queryKey: ['circle', 'messages'], queryFn: repositories.circle.listMessages });
  const [recipientId, setRecipientId] = useState('');
  const [messageText, setMessageText] = useState('');
  const [commentText, setCommentText] = useState('');
  const [reportTarget, setReportTarget] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('Harassment');
  const [reportDetails, setReportDetails] = useState('');

  const unreadMessages = (messages.data ?? []).filter((item) => item.recipient_id === user?.id && !item.read_at).length;
  const markMessagesRead = useMutation({
    mutationFn: repositories.circle.markMessagesRead,
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['circle', 'messages'] }),
  });

  const createPost = useMutation({
    mutationFn: () => repositories.circle.createPost({ title: title.trim(), body: body.trim(), category, anonymous }),
    onSuccess: async () => {
      setTitle('');
      setBody('');
      setAnonymous(false);
      await queryClient.invalidateQueries({ queryKey: ['circle', 'posts'] });
    },
  });
  const addComment = useMutation({
    mutationFn: () => repositories.circle.createComment(selectedPost!, commentText.trim()),
    onSuccess: async () => {
      setCommentText('');
      await queryClient.invalidateQueries({ queryKey: ['circle', 'comments', selectedPost] });
    },
  });
  const react = useMutation({
    mutationFn: (postId: string) => repositories.circle.toggleReaction({ postId }, 'heart'),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['circle', 'reactions'] });
    },
  });
  const requestConnection = useMutation({
    mutationFn: (id: string) => repositories.circle.requestConnection(id, 'Opt-in demo buddy request'),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['circle', 'connections'] }),
  });
  const block = useMutation({
    mutationFn: (id: string) => repositories.circle.block(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['circle', 'blocked'] }),
        queryClient.invalidateQueries({ queryKey: ['circle', 'discoverable-profiles'] }),
        queryClient.invalidateQueries({ queryKey: ['circle', 'messages'] }),
      ]);
    },
  });
  const sendMessage = useMutation({
    mutationFn: () => repositories.circle.sendMessage(recipientId, messageText.trim()),
    onSuccess: async () => {
      setMessageText('');
      await queryClient.invalidateQueries({ queryKey: ['circle', 'messages'] });
    },
  });
  const report = useMutation({
    mutationFn: () => repositories.circle.report({ target_type: 'post', target_id: reportTarget, reason: reportReason, details: reportDetails.trim() || null }),
    onSuccess: () => { setReportTarget(null); setReportDetails(''); },
  });

  function submitPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createPost.mutate();
  }

  function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addComment.mutate();
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage.mutate();
  }

  const loading = posts.isLoading || reactions.isLoading || connections.isLoading || blocked.isLoading;
  const relationshipError = reactions.isError || connections.isError || blocked.isError || consent.isError;
  const visibleProfiles = (profiles.data ?? []).filter((profile) => !blocked.data?.includes(profile.id));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="Community, at your pace" title="Circle" description="Share support and find opt-in demo buddies. Respect, privacy, and safety come first." />
      {relationshipError && <div className="mb-4"><InlineMessage>Some Circle details could not load.</InlineMessage><Button className="mt-2" variant="secondary" onClick={() => { void reactions.refetch(); void connections.refetch(); void blocked.refetch(); void consent.refetch(); }}>Retry</Button></div>}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Circle sections">{([
        ['feed', 'Community feed'],
        ['buddies', 'Buddy discovery'],
        ['messages', unreadMessages ? `Messages (${unreadMessages} unread)` : 'Messages'],
      ] as const).map(([value, label]) => <Button key={value} type="button" variant={tab === value ? 'primary' : 'secondary'} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</Button>)}</div>
      {loading && <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-52 w-full" /><Skeleton className="h-52 w-full" /></div>}

      {!loading && tab === 'feed' && <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Share with Circle</h2><p className="mt-1 text-sm text-sakhi-muted">Community posts are visible to other users. Do not include private or health details.</p><form className="mt-4 space-y-3" onSubmit={submitPost}><div><FieldLabel htmlFor="post-title">Title</FieldLabel><TextInput id="post-title" required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} /></div><div><FieldLabel htmlFor="post-body">Your post</FieldLabel><TextArea id="post-body" required maxLength={2000} value={body} onChange={(event) => setBody(event.target.value)} /></div><div><FieldLabel htmlFor="post-category">Category</FieldLabel><select id="post-category" className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink" value={category} onChange={(event) => setCategory(event.target.value)}>{['Study', 'Wellbeing', 'Campus', 'Career', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></div><label className="flex min-h-11 items-center gap-3 text-sm text-sakhi-ink"><input type="checkbox" className="h-5 w-5 accent-sakhi-rose" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} />Post anonymously</label><Button disabled={createPost.isPending}>{createPost.isPending ? 'Posting…' : 'Share post'}</Button></form>{createPost.isError && <div className="mt-3"><InlineMessage>{createPost.error.message}</InlineMessage></div>}</Card>
        <div className="space-y-4">{posts.isError ? <><InlineMessage>Circle posts could not load.</InlineMessage><Button variant="secondary" onClick={() => void posts.refetch()}>Retry</Button></> : posts.data?.length ? posts.data.map((post) => <PostCard key={post.id} post={post} reacted={Boolean(reactions.data?.some((reaction) => reaction.post_id === post.id && reaction.reaction_type === 'heart'))} selected={selectedPost === post.id} comments={selectedPost === post.id ? comments.data ?? [] : []} commentsLoading={selectedPost === post.id && comments.isLoading} commentsError={selectedPost === post.id && comments.isError} onRetryComments={() => void comments.refetch()} commentText={commentText} setCommentText={setCommentText} onReact={() => react.mutate(post.id)} onOpenComments={() => setSelectedPost(selectedPost === post.id ? null : post.id)} onComment={submitComment} commentPending={addComment.isPending} reportTarget={reportTarget} setReportTarget={setReportTarget} reportReason={reportReason} setReportReason={setReportReason} reportDetails={reportDetails} setReportDetails={setReportDetails} onReport={(event) => { event.preventDefault(); report.mutate(); }} reportPending={report.isPending} />) : <EmptyState title="No Circle posts yet" description="Be kind to yourself and others. Share when you are ready." />}{report.isError && <InlineMessage>{report.error.message}</InlineMessage>}</div>
      </div>}

      {!loading && tab === 'buddies' && <Card>
        <div className="flex items-start gap-3"><UsersRound aria-hidden="true" className="mt-1 text-sakhi-rose" /><div><h2 className="text-lg font-bold text-sakhi-ink">Opt-in buddy discovery</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">You and potential buddies must choose to be discoverable. These profiles are synthetic demos only.</p></div></div>
        {!consent.data?.discovery_visible ? <div className="mt-4"><InlineMessage tone="info">Discovery is off. Review the privacy choice in <Link className="font-semibold underline" to="/settings">Privacy settings</Link> before enabling it.</InlineMessage></div> : profiles.isLoading ? <Skeleton className="mt-4 h-24 w-full" /> : profiles.isError ? <InlineMessage>Opted-in demo profiles could not load.</InlineMessage> : visibleProfiles.length ? <div className="mt-4 grid gap-4 md:grid-cols-2">{visibleProfiles.map((profile) => <BuddyCard key={profile.id} profile={profile} requested={connections.data?.some((item) => item.recipient_id === profile.id)} onConnect={() => requestConnection.mutate(profile.id)} onBlock={() => { if (window.confirm('Block this demo profile? This hides it from discovery and prevents messages.')) block.mutate(profile.id); }} pending={requestConnection.isPending || block.isPending} />)}</div> : <div className="mt-4"><EmptyState title="No opted-in demo profiles available" description="Buddy discovery only shows profiles that have opted in." /></div>}
        {requestConnection.isError && <div className="mt-3"><InlineMessage>{requestConnection.error.message}</InlineMessage></div>}
        {block.isError && <div className="mt-3"><InlineMessage>{block.error.message}</InlineMessage></div>}
      </Card>}

      {!loading && tab === 'messages' && <div className="grid gap-5 lg:grid-cols-[0.7fr_1.3fr]">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Your connections</h2>{connections.data?.length ? <ul className="mt-3 space-y-2">{connections.data.map((connection) => <li key={`${connection.requester_id}-${connection.recipient_id}`} className="rounded-xl border border-sakhi-border p-3 text-sm"><p className="font-semibold text-sakhi-ink">Demo peer · {connection.status}</p><p className="mt-1 text-xs text-sakhi-muted">Connection request</p></li>)}</ul> : <p className="mt-3 text-sm text-sakhi-muted">No connection requests yet.</p>}<label className="mt-5 block"><FieldLabel htmlFor="message-recipient">Choose a demo recipient</FieldLabel><select id="message-recipient" className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink" value={recipientId} onChange={(event) => setRecipientId(event.target.value)}><option value="">Select a demo profile</option>{visibleProfiles.map((profile) => <option key={profile.id} value={profile.id}>Demo peer</option>)}</select></label></Card>
        <Card><div className="flex flex-wrap items-start justify-between gap-2"><div><h2 className="text-lg font-bold text-sakhi-ink">Private demo messages</h2><p className="mt-1 text-xs text-sakhi-muted">Messages are stored in this browser in local mode. Blocking prevents new messages.</p></div>{unreadMessages > 0 && <Button type="button" variant="secondary" disabled={markMessagesRead.isPending} onClick={() => markMessagesRead.mutate()}>Mark {unreadMessages} as read</Button>}</div>{markMessagesRead.isError && <div className="mt-3"><InlineMessage>{markMessagesRead.error.message}</InlineMessage></div>}<div className="mt-4 max-h-80 space-y-2 overflow-y-auto" aria-live="polite">{messages.isLoading ? <Skeleton className="h-16 w-full" /> : messages.isError ? <InlineMessage>Messages could not load.</InlineMessage> : messages.data?.filter((item) => !recipientId || item.sender_id === recipientId || item.recipient_id === recipientId).length ? messages.data.filter((item) => !recipientId || item.sender_id === recipientId || item.recipient_id === recipientId).map((item) => <div key={item.id} className={`max-w-[85%] rounded-xl p-3 text-sm ${item.sender_id === recipientId ? 'bg-sakhi-lavender/30 text-sakhi-ink' : 'ml-auto bg-sakhi-rose text-white'}`}><span className="sr-only">{item.sender_id === recipientId ? 'Demo peer: ' : 'You: '}</span>{item.text}{item.recipient_id === user?.id && !item.read_at && <span className="sr-only">Unread message</span>}<p className="mt-1 text-[10px] opacity-70">{formatDate(item.created_at, { hour: 'numeric', minute: '2-digit' })}</p></div>) : <p className="text-sm text-sakhi-muted">No messages in this conversation yet.</p>}</div><form className="mt-4 flex items-end gap-2" onSubmit={submitMessage}><div className="min-w-0 flex-1"><FieldLabel htmlFor="dm-message">Message</FieldLabel><TextArea id="dm-message" rows={2} maxLength={1000} value={messageText} onChange={(event) => setMessageText(event.target.value)} /></div><Button size="icon" aria-label="Send message" disabled={!recipientId || !messageText.trim() || sendMessage.isPending}><Send aria-hidden="true" size={17} /></Button></form>{sendMessage.isError && <div className="mt-3"><InlineMessage>{sendMessage.error.message}</InlineMessage></div>}</Card>
      </div>}
    </div>
  );
}

function PostCard({ post, reacted, selected, comments, commentsLoading, commentsError, onRetryComments, commentText, setCommentText, onReact, onOpenComments, onComment, commentPending, reportTarget, setReportTarget, reportReason, setReportReason, reportDetails, setReportDetails, onReport, reportPending }: {
  post: PostRow;
  reacted: boolean;
  selected: boolean;
  comments: { id: string; body: string; trust_label: PostRow['trust_label']; author_id: string | null }[];
  commentsLoading: boolean;
  commentsError: boolean;
  onRetryComments: () => void;
  commentText: string;
  setCommentText: (value: string) => void;
  onReact: () => void;
  onOpenComments: () => void;
  onComment: (event: FormEvent<HTMLFormElement>) => void;
  commentPending: boolean;
  reportTarget: string | null;
  setReportTarget: (value: string | null) => void;
  reportReason: string;
  setReportReason: (value: string) => void;
  reportDetails: string;
  setReportDetails: (value: string) => void;
  onReport: (event: FormEvent<HTMLFormElement>) => void;
  reportPending: boolean;
}) {
  const anonymous = post.author_id === null;
  return <Card><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-sakhi-muted">{anonymous ? 'Anonymous community member' : 'Community member'} · {formatDate(post.created_at)}</p><h2 className="mt-1 text-lg font-bold text-sakhi-ink">{post.title}</h2></div><TrustBadge trust={post.trust_label} /></div><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-sakhi-muted">{post.body}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" variant="secondary" aria-pressed={reacted} onClick={onReact}><Heart aria-hidden="true" size={16} fill={reacted ? 'currentColor' : 'none'} />{reacted ? 'Liked' : 'Heart'}</Button><Button type="button" variant="secondary" aria-expanded={selected} onClick={onOpenComments}><MessageCircle aria-hidden="true" size={16} />Comments</Button><Button type="button" variant="ghost" onClick={() => setReportTarget(reportTarget === post.id ? null : post.id)}><ShieldAlert aria-hidden="true" size={16} />Report</Button></div>
    {selected && <div className="mt-4 border-t border-sakhi-border pt-4"><h3 className="font-semibold text-sakhi-ink">Comments</h3>{commentsLoading ? <Skeleton className="mt-3 h-12 w-full" /> : commentsError ? <div className="mt-3"><InlineMessage>Comments could not load.</InlineMessage><Button className="mt-2" type="button" variant="secondary" onClick={onRetryComments}>Retry comments</Button></div> : comments.length ? <ul className="mt-2 space-y-2">{comments.map((comment) => <li key={comment.id} className="rounded-xl bg-sakhi-lavender/15 p-3"><p className="text-sm text-sakhi-ink">{comment.body}</p><div className="mt-2"><TrustBadge trust={comment.trust_label} /></div></li>)}</ul> : <p className="mt-2 text-sm text-sakhi-muted">No comments yet.</p>}<form className="mt-3 flex gap-2" onSubmit={onComment}><label htmlFor={`comment-${post.id}`} className="sr-only">Write a comment</label><TextInput id={`comment-${post.id}`} required maxLength={1000} value={commentText} onChange={(event) => setCommentText(event.target.value)} /><Button size="icon" aria-label="Post comment" disabled={commentPending}><Send aria-hidden="true" size={16} /></Button></form></div>}
    {reportTarget === post.id && <form className="mt-4 space-y-3 rounded-xl border border-sakhi-border p-3" onSubmit={onReport}><div><FieldLabel htmlFor={`report-reason-${post.id}`}>Why are you reporting this?</FieldLabel><select id={`report-reason-${post.id}`} className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink" value={reportReason} onChange={(event) => setReportReason(event.target.value)}>{['Harassment', 'Spam', 'Unsafe content', 'Other'].map((reason) => <option key={reason}>{reason}</option>)}</select></div><div><FieldLabel htmlFor={`report-detail-${post.id}`}>Details (optional)</FieldLabel><TextArea id={`report-detail-${post.id}`} rows={2} maxLength={500} value={reportDetails} onChange={(event) => setReportDetails(event.target.value)} /></div><Button disabled={reportPending}>Submit report</Button></form>}
  </Card>;
}

function BuddyCard({ profile, requested, onConnect, onBlock, pending }: { profile: ProfileRow; requested: boolean | undefined; onConnect: () => void; onBlock: () => void; pending: boolean }) {
  return <Card><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-full bg-sakhi-lavender/40 text-sakhi-rose"><UsersRound aria-hidden="true" size={18} /></span><div><h3 className="font-bold text-sakhi-ink">Demo peer</h3><p className="text-xs text-sakhi-muted">Synthetic opt-in profile · {profile.course}</p></div></div><span className="rounded-full bg-sakhi-lavender/30 px-2 py-1 text-xs font-semibold text-sakhi-ink">Demo profile</span></div><p className="mt-3 text-sm text-sakhi-muted">{profile.bio}</p><p className="mt-2 text-xs text-sakhi-muted">Interests: {profile.interests.join(', ')}</p><div className="mt-4 flex flex-wrap gap-2"><Button type="button" disabled={pending || requested} onClick={onConnect}><UserRoundPlus aria-hidden="true" size={16} />{requested ? 'Request sent' : 'Request connection'}</Button><Button type="button" variant="secondary" disabled={pending} onClick={onBlock}>Block</Button></div></Card>;
}
