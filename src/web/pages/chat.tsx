import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowUp, Heart, Square, Trash2 } from 'lucide-react';

import { repositories } from '@/data/repositories';
import type { SakhiChatChunk } from '@/data/contracts';
import type { SakhiConversationRow, SakhiMemoryRow } from '@/types/database';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextArea, TextInput, TrustBadge } from '../components/ui';

export function ChatPage() {
  const queryClient = useQueryClient();
  const conversation = useQuery({ queryKey: ['chat'], queryFn: repositories.chat.list });
  const consent = useQuery({ queryKey: ['consents'], queryFn: repositories.consents.get });
  const memories = useQuery({
    queryKey: ['chat', 'memories'],
    queryFn: repositories.chat.listMemories,
    enabled: consent.data?.ai_memory_opt_in === true,
  });
  const [message, setMessage] = useState('');
  const [streamText, setStreamText] = useState('');
  const [crisisSupport, setCrisisSupport] = useState<SakhiChatChunk['crisisSupport']>();
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const lastMessage = useRef('');

  useEffect(() => () => controller.current?.abort(), []);

  async function send(text: string) {
    const clean = text.trim();
    if (!clean || streaming) return;
    lastMessage.current = clean;
    setMessage('');
    setStreamText('');
    setCrisisSupport(undefined);
    setError(null);
    const nextController = new AbortController();
    controller.current = nextController;
    setStreaming(true);
    try {
      for await (const chunk of repositories.chat.streamReply(clean, nextController.signal)) {
        if (nextController.signal.aborted) break;
        if (chunk.text) setStreamText((current) => current + chunk.text);
        if (chunk.crisisSupport) setCrisisSupport(chunk.crisisSupport);
        if (chunk.done) break;
      }
      if (!nextController.signal.aborted) {
        await queryClient.invalidateQueries({ queryKey: ['chat'] });
        setStreamText('');
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Sakhi could not reply. Try again when you are ready.');
    } finally {
      setStreaming(false);
      controller.current = null;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(message);
  }

  const renderError = conversation.isError ? 'Your conversation could not load.' : error;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading eyebrow="A supportive companion" title="Talk to Sakhi" description="Share what is on your mind, or choose a quick prompt. Sakhi is a digital companion, not a person or a medical professional." />
      <Card className="flex min-h-[65vh] flex-col">
        <div className="flex-1 space-y-4" aria-live="polite" aria-label="Conversation">
          {conversation.isLoading && <><Skeleton className="h-16 w-3/4" /><Skeleton className="ml-auto h-16 w-2/3" /></>}
          {conversation.data?.length === 0 && !streamText && (
            <div className="py-8 text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-sakhi-lavender/40 text-2xl" aria-hidden="true">🌷</span>
              <h2 className="mt-4 text-lg font-bold text-sakhi-ink">What would feel helpful today?</h2>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {['Help me make a study plan', 'I feel a little lonely', 'I need a gentle reset'].map((prompt) => <Button key={prompt} variant="secondary" type="button" onClick={() => void send(prompt)}>{prompt}</Button>)}
              </div>
            </div>
          )}
          {conversation.data?.map((row) => <ChatBubble key={row.id} row={row} />)}
          {streamText && <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-sakhi-lavender/30 p-4 text-sm leading-6 text-sakhi-ink"><div>{streamText}<span className="sr-only">Sakhi is responding</span></div><div className="mt-2"><TrustBadge trust="ai_assisted" /></div></div>}
          {renderError && <InlineMessage>{renderError}</InlineMessage>}
          {crisisSupport && <CrisisCard phone={crisisSupport.phone} prompt={crisisSupport.prompt} />}
          {conversation.isError && <Button className="mt-2" variant="secondary" onClick={() => void conversation.refetch()}>Retry loading conversation</Button>}
        </div>

        <div className="mt-5 border-t border-sakhi-border pt-4">
          {streaming && <Button type="button" variant="secondary" className="mb-3" onClick={() => controller.current?.abort()}><Square aria-hidden="true" size={15} /> Stop response</Button>}
          {conversation.data?.length ? <div className="mb-3 flex flex-wrap gap-2">{['Can you help me break this down?', 'Let’s make a small plan', 'I just need encouragement'].map((prompt) => <Button key={prompt} variant="ghost" type="button" disabled={streaming} onClick={() => void send(prompt)}>{prompt}</Button>)}</div> : null}
          <form className="flex items-end gap-2" onSubmit={submit}>
            <label htmlFor="chat-message" className="sr-only">Message Sakhi</label>
            <TextArea id="chat-message" rows={2} maxLength={2000} placeholder="Write what’s on your mind…" value={message} onChange={(event) => setMessage(event.target.value)} disabled={streaming} />
            <Button className="shrink-0" size="icon" aria-label="Send message" disabled={streaming || !message.trim()}><ArrowUp aria-hidden="true" /></Button>
          </form>
          <p className="mt-2 text-xs leading-5 text-sakhi-muted">Sakhi does not diagnose or prescribe. If you may be in immediate danger, contact local emergency services or a trusted person.</p>
        </div>
      </Card>

      <Card className="mt-5">
        <div className="flex items-center gap-2"><Heart aria-hidden="true" className="text-sakhi-rose" size={18} /><h2 className="font-bold text-sakhi-ink">AI memory</h2></div>
        {consent.isLoading ? <Skeleton className="mt-4 h-10 w-full" /> : consent.data?.ai_memory_opt_in ? <MemoryManager memories={memories.data ?? []} loading={memories.isLoading} /> : <p className="mt-2 text-sm text-sakhi-muted">Memory is off. You can turn it on and manage saved details in <a className="font-semibold text-sakhi-rose underline" href="/settings">Privacy settings</a>.</p>}
      </Card>
    </div>
  );
}

function ChatBubble({ row }: { row: SakhiConversationRow }) {
  const isUser = row.role === 'user';
  return <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-6 ${isUser ? 'ml-auto rounded-br-sm bg-sakhi-rose text-white' : 'rounded-bl-sm bg-sakhi-lavender/30 text-sakhi-ink'}`}><span className="sr-only">{isUser ? 'You: ' : 'Sakhi: '}</span>{row.message}{!isUser && <div className="mt-2"><TrustBadge trust="ai_assisted" /></div>}</div>;
}

function CrisisCard({ phone, prompt }: { phone: string; prompt: string }) {
  return <Card role="alert" className="border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
    <div className="flex items-start gap-3"><AlertTriangle aria-hidden="true" className="mt-0.5 shrink-0 text-rose-700 dark:text-rose-300" /><div><h2 className="font-bold text-sakhi-ink">You deserve support from a real person</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">{prompt}</p><div className="mt-3 flex flex-wrap items-center gap-2"><a className="inline-flex min-h-11 items-center rounded-xl bg-sakhi-rose px-4 font-bold text-white" href={`tel:${phone}`}>Call Tele-MANAS {phone}</a><TrustBadge trust="official" /></div></div></div>
  </Card>;
}

function MemoryManager({ memories, loading }: { memories: SakhiMemoryRow[]; loading: boolean }) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const save = useMutation({
    mutationFn: async () => editing
      ? repositories.chat.updateMemory(editing, { label: label.trim(), value: value.trim() })
      : repositories.chat.saveMemory({ label: label.trim(), value: value.trim() }),
    onSuccess: () => {
      setLabel('');
      setValue('');
      setEditing(null);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['chat', 'memories'] });
    },
    onError: (reason) => setError(reason.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => repositories.chat.deleteMemory(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['chat', 'memories'] }),
    onError: (reason) => setError(reason.message),
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save.mutate();
  }

  return <div className="mt-3">
    <p className="text-sm leading-5 text-sakhi-muted">Saved details are private to your local profile. Review, edit, or remove them anytime.</p>
    {loading ? <Skeleton className="mt-4 h-16 w-full" /> : memories.length ? <ul className="mt-3 space-y-2">{memories.map((memory) => <li key={memory.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sakhi-border p-3"><span><strong className="block text-sm text-sakhi-ink">{memory.label}</strong><span className="text-sm text-sakhi-muted">{memory.value}</span></span><span className="flex gap-2"><Button variant="secondary" type="button" onClick={() => { setEditing(memory.id); setLabel(memory.label); setValue(memory.value); }}>Edit</Button><Button variant="ghost" size="icon" type="button" aria-label={`Delete memory ${memory.label}`} onClick={() => { if (window.confirm('Delete this saved detail?')) remove.mutate(memory.id); }}><Trash2 aria-hidden="true" size={17} /></Button></span></li>)}</ul> : <p className="mt-3 text-sm text-sakhi-muted">No saved memories.</p>}
    <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submit}>
      <div><FieldLabel htmlFor="memory-label">Label</FieldLabel><TextInput id="memory-label" required maxLength={80} value={label} onChange={(event) => setLabel(event.target.value)} /></div>
      <div><FieldLabel htmlFor="memory-value">Detail</FieldLabel><TextInput id="memory-value" required maxLength={300} value={value} onChange={(event) => setValue(event.target.value)} /></div>
      {error && <div className="sm:col-span-2"><InlineMessage>{error}</InlineMessage></div>}
      <div className="sm:col-span-2"><Button disabled={save.isPending}>{save.isPending ? 'Saving…' : editing ? 'Update memory' : 'Save memory'}</Button>{editing && <Button className="ml-2" type="button" variant="secondary" onClick={() => { setEditing(null); setLabel(''); setValue(''); }}>Cancel edit</Button>}</div>
    </form>
  </div>;
}
