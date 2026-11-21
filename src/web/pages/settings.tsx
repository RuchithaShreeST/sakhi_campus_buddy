import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import type { NotificationPreferences } from '@/data/contracts';
import { repositories } from '@/data/repositories';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextInput } from '../components/ui';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { profile, saveOnboarding, signOut, deleteAccount } = useAuth();
  const consents = useQuery({ queryKey: ['consents'], queryFn: repositories.consents.get });
  const preferences = useQuery({ queryKey: ['notification-preferences'], queryFn: repositories.notifications.getPreferences });
  const [name, setName] = useState(profile?.display_name ?? '');
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? '');
  const [course, setCourse] = useState(profile?.course ?? '');
  const [year, setYear] = useState(profile?.year ?? '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const consentMutation = useMutation({
    mutationFn: (changes: Partial<Pick<NonNullable<typeof consents.data>, 'ai_memory_opt_in' | 'cycle_tracking_opt_in' | 'discovery_visible'>>) => repositories.consents.update(changes),
    onSuccess: async () => {
      setMessage('Privacy choice updated.');
      await queryClient.invalidateQueries({ queryKey: ['consents'] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['chat', 'memories'] }),
        queryClient.invalidateQueries({ queryKey: ['wellness', 'cycle'] }),
        queryClient.invalidateQueries({ queryKey: ['circle', 'discoverable-profiles'] }),
      ]);
    },
    onError: (reason) => setError(reason.message),
  });
  const preferencesMutation = useMutation({
    mutationFn: (changes: Partial<NotificationPreferences>) => repositories.notifications.updatePreferences(changes),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    onError: (reason) => setError(reason.message),
  });
  const profileMutation = useMutation({
    mutationFn: async () => {
      if (!consents.data) throw new Error('Privacy choices are still loading.');
      await saveOnboarding({
        display_name: name.trim(),
        pronouns: pronouns.trim() || null,
        course: course.trim() || null,
        year: year || null,
      }, {
        ai_memory_opt_in: consents.data.ai_memory_opt_in,
        cycle_tracking_opt_in: consents.data.cycle_tracking_opt_in,
        discovery_visible: consents.data.discovery_visible,
      });
    },
    onSuccess: () => setMessage('Profile updated.'),
    onError: (reason) => setError(reason.message),
  });
  const exportMutation = useMutation({
    mutationFn: () => repositories.account.exportData(),
    onSuccess: (data) => {
      const file = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'sakhi-my-data.json';
      anchor.click();
      URL.revokeObjectURL(url);
    },
    onError: (reason) => setError(reason.message),
  });

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');
    setError('');
    profileMutation.mutate();
  }

  async function handleSignOut() {
    setError('');
    try {
      await signOut();
      navigate('/auth', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not sign out.');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete your Sakhi demo account and all Sakhi data saved in this browser? This cannot be undone.')) return;
    setError('');
    try {
      await deleteAccount();
      navigate('/auth', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your account could not be deleted.');
    }
  }

  const waiting = consents.isLoading || preferences.isLoading;
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading eyebrow="Your account, your choices" title="Settings" description="Review your profile, privacy choices, and local notification preferences." />
      {waiting && <Skeleton className="mb-5 h-24 w-full" />}
      {(consents.isError || preferences.isError) && <div className="mb-4"><InlineMessage>Settings could not load.</InlineMessage><Button className="mt-2" variant="secondary" onClick={() => { void consents.refetch(); void preferences.refetch(); }}>Retry</Button></div>}
      {error && <div className="mb-4"><InlineMessage>{error}</InlineMessage></div>}
      {message && <div className="mb-4"><InlineMessage tone="success">{message}</InlineMessage></div>}

      <div className="space-y-5">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Profile</h2><form className="mt-4 grid gap-4 sm:grid-cols-2" onSubmit={saveProfile}><div><FieldLabel htmlFor="settings-name">Name</FieldLabel><TextInput id="settings-name" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></div><div><FieldLabel htmlFor="settings-pronouns">Pronouns</FieldLabel><TextInput id="settings-pronouns" maxLength={40} value={pronouns} onChange={(event) => setPronouns(event.target.value)} /></div><div><FieldLabel htmlFor="settings-course">Course or program</FieldLabel><TextInput id="settings-course" maxLength={100} value={course} onChange={(event) => setCourse(event.target.value)} /></div><div><FieldLabel htmlFor="settings-year">Year of study</FieldLabel><TextInput id="settings-year" maxLength={30} value={year} onChange={(event) => setYear(event.target.value)} /></div><div className="sm:col-span-2"><Button disabled={profileMutation.isPending || waiting}>{profileMutation.isPending ? 'Saving…' : 'Save profile'}</Button></div></form></Card>

        <Card><h2 className="text-lg font-bold text-sakhi-ink">Privacy and consent</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">Optional features stay off unless you opt in. Withdrawing AI memory or cycle consent deletes the related local data.</p>{consents.data && <div className="mt-4 space-y-3">
          <ConsentSetting title="AI memory" description="Save details you choose to remember across Sakhi chats. Review, edit, and delete them on the Talk to Sakhi page." checked={consents.data.ai_memory_opt_in} onChange={(value) => {
            if (!value && !window.confirm('Turn off AI memory and delete all saved Sakhi memories?')) return;
            setError(''); setMessage(''); consentMutation.mutate({ ai_memory_opt_in: value });
          }} />
          <ConsentSetting title="Cycle tracking" description="Store optional cycle entries in your private local profile. No diagnosis or medication advice." checked={consents.data.cycle_tracking_opt_in} onChange={(value) => {
            if (!value && !window.confirm('Turn off cycle tracking and delete all saved cycle entries?')) return;
            setError(''); setMessage(''); consentMutation.mutate({ cycle_tracking_opt_in: value });
          }} />
          <ConsentSetting title="Buddy discoverability" description="Allow opted-in demo profiles to find your profile. This setting is off by default." checked={consents.data.discovery_visible} onChange={(value) => { setError(''); setMessage(''); consentMutation.mutate({ discovery_visible: value }); }} />
        </div>}</Card>

        <Card><h2 className="text-lg font-bold text-sakhi-ink">Notification preferences</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">These local settings record your choices. Browser push delivery has not been connected yet.</p>{preferences.data && <div className="mt-4 grid gap-2 sm:grid-cols-2">{(Object.entries(preferences.data) as [keyof NotificationPreferences, boolean][]).map(([category, enabled]) => <ConsentSetting key={category} title={`${category[0].toUpperCase()}${category.slice(1)} updates`} description={`Allow ${category} notifications in your local preferences.`} checked={enabled} onChange={(value) => preferencesMutation.mutate({ [category]: value })} />)}</div>}</Card>

        <Card><h2 className="text-lg font-bold text-sakhi-ink">Your data</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">Export downloads the records associated with your local profile as JSON.</p><div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" disabled={exportMutation.isPending} onClick={() => exportMutation.mutate()}>{exportMutation.isPending ? 'Preparing export…' : 'Export my data'}</Button><Link to="/privacy" className="inline-flex min-h-11 items-center rounded-xl px-3 font-semibold text-sakhi-rose underline">Read privacy information</Link></div></Card>

        <Card className="border-rose-200"><h2 className="text-lg font-bold text-sakhi-ink">Sign out or delete account</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">Deleting removes Sakhi local profile, health entries, memories, chats, plans, credentials, and app theme settings from this browser.</p><div className="mt-4 flex flex-wrap gap-3"><Button variant="secondary" onClick={() => void handleSignOut()}>Sign out</Button><Button className="bg-rose-700 hover:bg-rose-800" onClick={() => void handleDelete()}>Delete my demo account</Button></div></Card>
      </div>
    </div>
  );
}

export function ConsentSetting({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border border-sakhi-border p-4"><input className="mt-1 h-5 w-5 shrink-0 accent-sakhi-rose" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} /><span><span className="block font-semibold text-sakhi-ink">{title}</span><span className="mt-1 block text-sm leading-5 text-sakhi-muted">{description}</span></span></label>;
}
