import { useQuery } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { repositories } from '@/data/repositories';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextInput } from '../components/ui';

export function OnboardingPage() {
  const { saveOnboarding, profile } = useAuth();
  const navigate = useNavigate();
  const campuses = useQuery({ queryKey: ['profile', 'campuses'], queryFn: repositories.profile.listCampuses });
  const interests = useQuery({ queryKey: ['profile', 'interest-options'], queryFn: repositories.profile.listInterestOptions });
  const [step, setStep] = useState<'profile' | 'consent'>('profile');
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [pronouns, setPronouns] = useState(profile?.pronouns ?? '');
  const [campusName, setCampusName] = useState(profile?.campus_name ?? '');
  const [course, setCourse] = useState(profile?.course ?? '');
  const [year, setYear] = useState(profile?.year ?? '');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(profile?.interests ?? []);
  const [goals, setGoals] = useState<string[]>(profile?.looking_for ?? []);
  const [consent, setConsent] = useState({ ai_memory_opt_in: false, cycle_tracking_opt_in: false, discovery_visible: false });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggle(value: string, current: string[], update: (next: string[]) => void) {
    update(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step === 'profile') {
      if (!campusName) {
        setError('Choose a campus to continue.');
        return;
      }
      setError(null);
      setStep('consent');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveOnboarding({
        display_name: displayName.trim(),
        pronouns: pronouns.trim() || null,
        campus_name: campusName,
        course: course.trim() || null,
        year: year || null,
        interests: selectedInterests,
        looking_for: goals,
      }, consent);
      navigate('/', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Your profile could not be saved.');
    } finally {
      setBusy(false);
    }
  }

  if (campuses.isLoading || interests.isLoading) return <main className="mx-auto max-w-2xl px-4 py-12"><Skeleton className="h-9 w-64" /><Skeleton className="mt-5 h-80 w-full" /></main>;
  if (campuses.isError || interests.isError) return <main className="mx-auto max-w-2xl px-4 py-12"><InlineMessage>Onboarding options could not load. Please retry.</InlineMessage><Button className="mt-4" variant="secondary" onClick={() => { void campuses.refetch(); void interests.refetch(); }}>Retry</Button></main>;

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-7 sm:py-16">
      <div className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sakhi-rose text-xl font-black text-white">S</span><span className="text-xl font-extrabold text-sakhi-ink">Sakhi</span></div>
      <PageHeading eyebrow={step === 'profile' ? 'Make this space yours' : 'Your choices, your control'} title={step === 'profile' ? 'A little about you' : 'Privacy and consent'} description={step === 'profile' ? 'Your name is yours to choose. You can update your profile later.' : 'These optional features stay off unless you choose to turn them on.'} />
      <Card>
        <form className="space-y-5" onSubmit={submit}>
          {step === 'profile' ? (
            <>
              <div><FieldLabel htmlFor="onboarding-name">Name</FieldLabel><TextInput id="onboarding-name" autoComplete="given-name" required maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} /></div>
              <div><FieldLabel htmlFor="onboarding-pronouns">Pronouns <span className="font-normal text-sakhi-muted">(optional)</span></FieldLabel><TextInput id="onboarding-pronouns" maxLength={40} value={pronouns} onChange={(event) => setPronouns(event.target.value)} /></div>
              <div><FieldLabel htmlFor="onboarding-campus">Campus</FieldLabel><select id="onboarding-campus" required value={campusName} onChange={(event) => setCampusName(event.target.value)} className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose"><option value="">Choose a campus</option>{campuses.data?.map((campus) => <option key={campus.id} value={campus.name}>{campus.name}</option>)}</select></div>
              <div><FieldLabel htmlFor="onboarding-course">Course or program</FieldLabel><TextInput id="onboarding-course" required maxLength={100} value={course} onChange={(event) => setCourse(event.target.value)} /></div>
              <div><FieldLabel htmlFor="onboarding-year">Year of study</FieldLabel><select id="onboarding-year" required value={year} onChange={(event) => setYear(event.target.value)} className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose"><option value="">Choose a year</option>{['1', '2', '3', '4', '5', 'Graduate', 'Other'].map((value) => <option key={value} value={value}>{value === 'Other' || value === 'Graduate' ? value : `Year ${value}`}</option>)}</select></div>
              <fieldset><legend className="mb-2 text-sm font-semibold text-sakhi-ink">Interests</legend><div className="flex flex-wrap gap-2">{interests.data?.map((interest) => <Choice key={interest} label={interest} selected={selectedInterests.includes(interest)} onClick={() => toggle(interest, selectedInterests, setSelectedInterests)} />)}</div></fieldset>
              <fieldset><legend className="mb-2 text-sm font-semibold text-sakhi-ink">What would you like help with?</legend><div className="flex flex-wrap gap-2">{['Study buddy', 'Wellbeing', 'Career growth', 'Campus connection'].map((goal) => <Choice key={goal} label={goal} selected={goals.includes(goal)} onClick={() => toggle(goal, goals, setGoals)} />)}</div></fieldset>
            </>
          ) : (
            <div className="space-y-4">
              <ConsentChoice title="AI memory" description="Allow Sakhi to save details you choose to remember for future chats. You can review or delete memories later." checked={consent.ai_memory_opt_in} onChange={(value) => setConsent((current) => ({ ...current, ai_memory_opt_in: value }))} />
              <ConsentChoice title="Cycle tracking" description="Store cycle entries in your private local profile. This is optional and is never used to diagnose or prescribe." checked={consent.cycle_tracking_opt_in} onChange={(value) => setConsent((current) => ({ ...current, cycle_tracking_opt_in: value }))} />
              <ConsentChoice title="Buddy discovery" description="Let other opted-in demo profiles discover your profile. This is off by default and can be changed later." checked={consent.discovery_visible} onChange={(value) => setConsent((current) => ({ ...current, discovery_visible: value }))} />
              <p className="text-xs leading-5 text-sakhi-muted">You can continue with every option off. You may withdraw consent later; cycle and memory data will be removed when their consent is withdrawn.</p>
            </div>
          )}
          {error && <InlineMessage>{error}</InlineMessage>}
          <div className="flex flex-wrap justify-between gap-3">
            {step === 'consent' && <Button type="button" variant="secondary" onClick={() => setStep('profile')}>Back</Button>}
            <Button className="ml-auto" disabled={busy}>{busy ? 'Saving…' : step === 'profile' ? 'Continue to privacy choices' : 'Finish setup'}</Button>
          </div>
        </form>
      </Card>
    </main>
  );
}

function Choice({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} className={`min-h-11 rounded-full border px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakhi-rose ${selected ? 'border-sakhi-rose bg-sakhi-lavender/40 text-sakhi-rose' : 'border-sakhi-border bg-sakhi-surface text-sakhi-muted'}`}>{label}</button>;
}

function ConsentChoice({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label className="flex cursor-pointer gap-3 rounded-xl border border-sakhi-border p-4">
    <input className="mt-1 h-5 w-5 accent-sakhi-rose" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span><span className="block font-semibold text-sakhi-ink">{title}</span><span className="mt-1 block text-sm leading-5 text-sakhi-muted">{description}</span></span>
  </label>;
}
