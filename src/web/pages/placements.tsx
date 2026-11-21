import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { ArrowDownToLine, BriefcaseBusiness, CheckCircle2 } from 'lucide-react';

import { repositories } from '@/data/repositories';
import type { Json } from '@/types/database';
import { useAuth } from '../auth/auth-provider';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, Skeleton, TextArea, TextInput, TrustBadge } from '../components/ui';
import { daysFromToday, formatDate } from '../lib/dates';

type ResumeModel = {
  summary: string;
  education: string;
  experience: string;
  projects: string;
  skills: string;
};

const EMPTY_RESUME: ResumeModel = { summary: '', education: '', experience: '', projects: '', skills: '' };
const INTERVIEW_QUESTIONS = [
  'Tell me about a project or task you learned from.',
  'Describe how you work through a challenge with limited information.',
  'What strengths would you bring to a role like this?',
];

export function PlacementPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'opportunities' | 'progress' | 'resume' | 'interview'>('opportunities');
  const placements = useQuery({ queryKey: ['campus', 'placements'], queryFn: repositories.campus.listPlacements });
  const registrations = useQuery({ queryKey: ['campus', 'placement-registrations'], queryFn: repositories.campus.listPlacementRegistrations });
  const dsa = useQuery({ queryKey: ['placement-prep', 'dsa'], queryFn: repositories.placementPrep.listDsaProgress });
  const aptitude = useQuery({ queryKey: ['placement-prep', 'aptitude'], queryFn: repositories.placementPrep.listAptitudeProgress });
  const resumeQuery = useQuery({ queryKey: ['placement-prep', 'resume'], queryFn: repositories.placementPrep.getResumeData });
  const interviews = useQuery({ queryKey: ['placement-prep', 'interviews'], queryFn: repositories.placementPrep.listMockInterviews });
  const [resumeEdits, setResumeEdits] = useState<Partial<ResumeModel>>({});
  const resume = { ...resumeFromData(resumeQuery.data), ...resumeEdits };
  const [topic, setTopic] = useState('');
  const [completed, setCompleted] = useState('0');
  const [target, setTarget] = useState('10');
  const [section, setSection] = useState('Problem solving');
  const [score, setScore] = useState('');
  const [answers, setAnswers] = useState(['', '', '']);
  const [feedback, setFeedback] = useState('');
  const [interviewError, setInterviewError] = useState('');

  const register = useMutation({
    mutationFn: (id: string) => repositories.campus.registerPlacement(id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['campus', 'placement-registrations'] }),
  });
  const saveDsa = useMutation({
    mutationFn: () => repositories.placementPrep.saveDsaProgress(topic.trim(), Number(completed), Number(target)),
    onSuccess: async () => {
      setTopic('');
      await queryClient.invalidateQueries({ queryKey: ['placement-prep', 'dsa'] });
    },
  });
  const saveAptitude = useMutation({
    mutationFn: () => repositories.placementPrep.saveAptitudeProgress(section, score ? Number(score) : null),
    onSuccess: async () => {
      setScore('');
      await queryClient.invalidateQueries({ queryKey: ['placement-prep', 'aptitude'] });
    },
  });
  const saveResume = useMutation({
    mutationFn: () => repositories.placementPrep.saveResumeData(resumeToJson(resume)),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['placement-prep', 'resume'] }),
  });

  async function submitDsa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveDsa.mutate();
  }

  async function submitAptitude(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveAptitude.mutate();
  }

  async function submitResume(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    saveResume.mutate();
  }

  async function submitInterview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInterviewError('');
    setFeedback('');
    const responseText = answers.map((answer, index) => `${INTERVIEW_QUESTIONS[index]}\n${answer.trim()}`).join('\n\n');
    const controller = new AbortController();
    try {
      let response = '';
      for await (const chunk of repositories.chat.streamReply(`Mock interview reflection: ${responseText}`, controller.signal)) {
        response += chunk.text;
        if (chunk.done) break;
      }
      setFeedback(response.trim());
      await repositories.placementPrep.saveMockInterview({
        role: 'General practice',
        questions: INTERVIEW_QUESTIONS,
        responses: answers,
        score: null,
        completed_at: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({ queryKey: ['placement-prep', 'interviews'] });
    } catch (reason) {
      setInterviewError(reason instanceof Error ? reason.message : 'The practice session could not be saved.');
    }
  }

  function updateResume(changes: Partial<ResumeModel>) {
    setResumeEdits((current) => ({ ...current, ...changes }));
  }

  const showError = placements.isError || registrations.isError || dsa.isError || aptitude.isError || resumeQuery.isError || interviews.isError;

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeading eyebrow="Build skills at your pace" title="Growth & placements" description="Practice and track what matters to you. Demo listings are synthetic and are not real employer or placement facts." />
      {showError && <div className="mb-4"><InlineMessage>Some growth information could not load.</InlineMessage><Button className="mt-2" variant="secondary" onClick={() => { void placements.refetch(); void registrations.refetch(); void dsa.refetch(); void aptitude.refetch(); void resumeQuery.refetch(); void interviews.refetch(); }}>Retry</Button></div>}
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Growth sections">{([
        ['opportunities', 'Opportunities'],
        ['progress', 'Progress'],
        ['resume', 'Resume'],
        ['interview', 'Mock interview'],
      ] as const).map(([value, label]) => <Button key={value} type="button" variant={tab === value ? 'primary' : 'secondary'} aria-pressed={tab === value} onClick={() => setTab(value)}>{label}</Button>)}</div>

      {tab === 'opportunities' && <section aria-label="Demo opportunities" className="grid gap-4 md:grid-cols-2">{placements.isLoading ? <Skeleton className="h-52 w-full" /> : placements.data?.length ? placements.data.map((item) => {
        const registered = registrations.data?.some((entry) => entry.placement_id === item.id);
        const remaining = daysFromToday(item.deadline);
        return <Card key={item.id}><div className="flex items-start justify-between gap-3"><div className="flex gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-sakhi-lavender/40 text-sakhi-rose"><BriefcaseBusiness aria-hidden="true" size={19} /></span><div><h2 className="font-bold text-sakhi-ink">{item.role}</h2><p className="text-sm text-sakhi-muted">{item.company} · {item.type ?? 'Demo listing'}</p></div></div><TrustBadge trust={item.trust_label} /></div><p className="mt-4 text-sm leading-5 text-sakhi-muted">{item.description}</p><p className="mt-3 text-xs text-sakhi-muted">Eligibility: {item.eligibility ?? 'Not specified'} · Deadline: {formatDate(item.deadline)}</p>{remaining !== null && <p className="mt-1 text-xs text-sakhi-muted">{remaining === 0 ? 'Demo deadline is today' : `${remaining} days remaining`}</p>}<Button className="mt-4" disabled={Boolean(registered) || register.isPending} onClick={() => register.mutate(item.id)}>{registered ? 'Registered' : 'Register interest'}</Button></Card>;
      }) : <div className="md:col-span-2"><EmptyStateCard /></div>}</section>}

      {tab === 'progress' && <div className="grid gap-5 lg:grid-cols-2">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">DSA progress</h2><p className="mt-1 text-sm text-sakhi-muted">Track practice by topic; there is no required pace.</p><form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={submitDsa}><div className="sm:col-span-3"><FieldLabel htmlFor="dsa-topic">Topic</FieldLabel><TextInput id="dsa-topic" required maxLength={80} value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="e.g. Arrays" /></div><div><FieldLabel htmlFor="dsa-completed">Completed</FieldLabel><TextInput id="dsa-completed" type="number" min="0" required value={completed} onChange={(event) => setCompleted(event.target.value)} /></div><div><FieldLabel htmlFor="dsa-target">Target</FieldLabel><TextInput id="dsa-target" type="number" min="1" required value={target} onChange={(event) => setTarget(event.target.value)} /></div><div className="self-end"><Button disabled={saveDsa.isPending}>Save progress</Button></div></form>{saveDsa.isError && <div className="mt-3"><InlineMessage>{saveDsa.error.message}</InlineMessage></div>}<ul className="mt-4 space-y-3">{dsa.data?.map((row) => <li key={row.id}><div className="flex justify-between gap-3 text-sm text-sakhi-ink"><span>{row.topic}</span><span>{row.completed_count}/{row.target_count}</span></div><div className="mt-1 h-2 rounded-full bg-sakhi-lavender/40" role="img" aria-label={`${row.topic}: ${row.completed_count} of ${row.target_count} completed`}><div className="h-2 rounded-full bg-sakhi-rose" style={{ width: `${Math.min(100, row.completed_count / row.target_count * 100)}%` }} /></div></li>)}</ul>{!dsa.isLoading && !dsa.data?.length && <p className="mt-4 text-sm text-sakhi-muted">No topics tracked yet.</p>}</Card>
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Aptitude practice</h2><p className="mt-1 text-sm text-sakhi-muted">Record a practice score if you want to track progress.</p><form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitAptitude}><div><FieldLabel htmlFor="aptitude-section">Section</FieldLabel><select id="aptitude-section" className="min-h-11 w-full rounded-xl border border-sakhi-border bg-sakhi-background px-3 text-sm text-sakhi-ink" value={section} onChange={(event) => setSection(event.target.value)}>{['Problem solving', 'Numerical reasoning', 'Verbal reasoning', 'Logical reasoning'].map((value) => <option key={value}>{value}</option>)}</select></div><div><FieldLabel htmlFor="aptitude-score">Score (0-100, optional)</FieldLabel><TextInput id="aptitude-score" type="number" min="0" max="100" value={score} onChange={(event) => setScore(event.target.value)} /></div><div className="sm:col-span-2"><Button disabled={saveAptitude.isPending}>Save attempt</Button></div></form>{saveAptitude.isError && <div className="mt-3"><InlineMessage>{saveAptitude.error.message}</InlineMessage></div>}<ul className="mt-4 space-y-2">{aptitude.data?.map((row) => <li key={row.id} className="flex justify-between text-sm text-sakhi-ink"><span>{row.section} · {row.attempts} attempts</span><span>{row.score === null ? 'Score not set' : `${row.score}%`}</span></li>)}</ul></Card>
      </div>}

      {tab === 'resume' && <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Resume builder</h2><p className="mt-1 text-sm text-sakhi-muted">This information stays in your local profile. Add only details you are comfortable storing.</p><form className="mt-4 space-y-3" onSubmit={submitResume}><div><FieldLabel htmlFor="resume-summary">Summary</FieldLabel><TextArea id="resume-summary" maxLength={1500} value={resume.summary} onChange={(event) => updateResume({ summary: event.target.value })} /></div><div><FieldLabel htmlFor="resume-education">Education</FieldLabel><TextArea id="resume-education" maxLength={1500} value={resume.education} onChange={(event) => updateResume({ education: event.target.value })} /></div><div><FieldLabel htmlFor="resume-experience">Experience</FieldLabel><TextArea id="resume-experience" maxLength={2000} value={resume.experience} onChange={(event) => updateResume({ experience: event.target.value })} /></div><div><FieldLabel htmlFor="resume-projects">Projects</FieldLabel><TextArea id="resume-projects" maxLength={2000} value={resume.projects} onChange={(event) => updateResume({ projects: event.target.value })} /></div><div><FieldLabel htmlFor="resume-skills">Skills</FieldLabel><TextArea id="resume-skills" maxLength={1000} value={resume.skills} onChange={(event) => updateResume({ skills: event.target.value })} /></div><Button disabled={saveResume.isPending}>{saveResume.isPending ? 'Saving…' : 'Save resume'}</Button>{saveResume.isSuccess && <span role="status" className="ml-3 text-sm text-emerald-700">Saved</span>}{saveResume.isError && <InlineMessage>{saveResume.error.message}</InlineMessage>}</form></Card>
        <Card className="resume-print"><div className="flex items-center justify-between gap-2"><h2 className="text-lg font-bold text-sakhi-ink">Resume preview</h2><Button type="button" variant="secondary" onClick={() => window.print()}><ArrowDownToLine aria-hidden="true" size={16} /> Print / Save PDF</Button></div><article className="mt-5 space-y-5"><header className="border-b border-sakhi-border pb-4"><h1 className="text-2xl font-bold text-sakhi-ink">{profile?.display_name || 'Your name'}</h1><p className="mt-1 text-sm text-sakhi-muted">{profile?.course ?? 'Course or program'}{profile?.campus_name ? ` · ${profile.campus_name}` : ''}</p></header>{(['summary', 'education', 'experience', 'projects', 'skills'] as const).map((field) => <section key={field}><h3 className="text-xs font-bold uppercase tracking-wider text-sakhi-rose">{field}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-sakhi-ink">{resume[field] || 'Add this section in the builder.'}</p></section>)}</article></Card>
      </div>}

      {tab === 'interview' && <div className="grid gap-5 lg:grid-cols-[1fr_0.75fr]">
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Practice with Sakhi</h2><p className="mt-1 text-sm leading-5 text-sakhi-muted">Try general, fictional practice questions. Sakhi offers gentle reflection, not a hiring assessment or a promise of results.</p><form className="mt-4 space-y-4" onSubmit={submitInterview}>{INTERVIEW_QUESTIONS.map((question, index) => <div key={question}><FieldLabel htmlFor={`interview-answer-${index}`}>{question}</FieldLabel><TextArea id={`interview-answer-${index}`} required maxLength={2000} value={answers[index]} onChange={(event) => setAnswers((current) => current.map((answer, itemIndex) => itemIndex === index ? event.target.value : answer))} /></div>)}<Button disabled={answers.some((answer) => !answer.trim())}>Finish practice</Button></form>{interviewError && <div className="mt-3"><InlineMessage>{interviewError}</InlineMessage></div>}{feedback && <InlineMessage tone="info">{feedback}</InlineMessage>}</Card>
        <Card><h2 className="text-lg font-bold text-sakhi-ink">Past practice</h2>{interviews.isLoading ? <Skeleton className="mt-4 h-20 w-full" /> : interviews.data?.length ? <ul className="mt-3 space-y-3">{interviews.data.map((item) => <li key={item.id} className="rounded-xl border border-sakhi-border p-3"><p className="flex items-center gap-2 text-sm font-semibold text-sakhi-ink"><CheckCircle2 aria-hidden="true" className="text-sakhi-rose" size={16} />General practice</p><p className="mt-1 text-xs text-sakhi-muted">{formatDate(item.completed_at ?? item.created_at, { month: 'short', day: 'numeric', year: 'numeric' })}</p></li>)}</ul> : <p className="mt-3 text-sm text-sakhi-muted">No practice sessions yet.</p>}</Card>
      </div>}
    </div>
  );
}

function isRecord(value: Json | null | undefined): value is { [key: string]: Json | undefined } {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

function stringField(value: Json | undefined) {
  return typeof value === 'string' ? value : '';
}

function resumeFromData(value: Json | null | undefined): ResumeModel {
  if (!isRecord(value)) return EMPTY_RESUME;
  return {
    summary: stringField(value.summary),
    education: stringField(value.education),
    experience: stringField(value.experience),
    projects: stringField(value.projects),
    skills: stringField(value.skills),
  };
}

function resumeToJson(resume: ResumeModel): Json {
  return {
    summary: resume.summary,
    education: resume.education,
    experience: resume.experience,
    projects: resume.projects,
    skills: resume.skills,
  };
}

function EmptyStateCard() {
  return <Card><p className="font-semibold text-sakhi-ink">No demo opportunities listed</p><p className="mt-2 text-sm text-sakhi-muted">This space does not invent real companies or placement facts.</p></Card>;
}
