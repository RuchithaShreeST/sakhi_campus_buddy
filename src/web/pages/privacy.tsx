import { Link } from 'react-router-dom';
import { AlertTriangle, Heart, LockKeyhole, ShieldCheck } from 'lucide-react';

import { Button, Card, PageHeading } from '../components/ui';

export function PrivacyPage() {
  return <div className="mx-auto max-w-4xl">
    <PageHeading eyebrow="Clear, kind, and in your control" title="Privacy at Sakhi" description="This page describes the current local demo and the safety boundaries of the product." />
    <div className="space-y-4">
      <Card><div className="flex gap-3"><LockKeyhole aria-hidden="true" className="mt-1 shrink-0 text-sakhi-rose" /><div><h2 className="font-bold text-sakhi-ink">Local demo storage</h2><p className="mt-2 text-sm leading-6 text-sakhi-muted">The current frontend defaults to local mode. Your account, profile, wellness entries, cycle entries, chats, memories, plans, and social demo actions are saved in this browser’s local storage. They are not synced to a live Supabase project. Other people using a separate browser profile cannot see this data, but anyone with access to this device or browser storage may be able to. Avoid entering information you do not want stored here.</p></div></div></Card>
      <Card><div className="flex gap-3"><ShieldCheck aria-hidden="true" className="mt-1 shrink-0 text-sakhi-rose" /><div><h2 className="font-bold text-sakhi-ink">Optional sensitive features</h2><p className="mt-2 text-sm leading-6 text-sakhi-muted">AI memory, cycle tracking, and buddy discovery begin off. They work only after you opt in. Turning off AI memory or cycle tracking removes those saved local entries. You can export your local records or delete the demo account from Settings.</p><Link to="/settings" className="mt-3 inline-flex min-h-11 items-center font-semibold text-sakhi-rose underline">Review your choices</Link></div></div></Card>
      <Card><div className="flex gap-3"><Heart aria-hidden="true" className="mt-1 shrink-0 text-sakhi-rose" /><div><h2 className="font-bold text-sakhi-ink">Supportive, not clinical</h2><p className="mt-2 text-sm leading-6 text-sakhi-muted">Sakhi does not diagnose, prescribe medication, or replace a qualified professional. Wellbeing summaries are gentle reflections and are not medical advice. For urgent emotional support in India, Tele-MANAS is available at 14416; if you are in immediate danger, contact local emergency services or a trusted person.</p></div></div></Card>
      <Card><div className="flex gap-3"><AlertTriangle aria-hidden="true" className="mt-1 shrink-0 text-sakhi-rose" /><div><h2 className="font-bold text-sakhi-ink">What is not connected yet</h2><p className="mt-2 text-sm leading-6 text-sakhi-muted">The Supabase adapter is a typed placeholder. Authentication, cloud backup, realtime messages, push delivery, and server-side exports/deletion need the frontend adapter to be connected and verified against the backend before production use.</p></div></div></Card>
    </div>
    <Button className="mt-5" variant="secondary" onClick={() => window.history.back()}>Go back</Button>
  </div>;
}
