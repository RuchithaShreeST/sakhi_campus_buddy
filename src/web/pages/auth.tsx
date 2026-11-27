import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../auth/auth-provider';
import { Button, Card, FieldLabel, InlineMessage, PageHeading, TextInput } from '../components/ui';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'sign-up') {
        const result = await signUp(email, password);
        navigate('/verify-email', { state: { email: result.user.email, code: result.demoVerificationCode } });
      } else {
        await signIn(email, password);
        const destination = typeof location.state?.from === 'string' ? location.state.from : '/';
        navigate(destination, { replace: true });
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not complete that request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <PageHeading eyebrow="Welcome to Sakhi" title={mode === 'sign-in' ? 'Sign in' : 'Create your account'} description="A supportive space for your campus life, wherever you are." />
      <Card>
        <form className="space-y-4" onSubmit={submit}>
          <div>
            <FieldLabel htmlFor="auth-email">Email</FieldLabel>
            <TextInput id="auth-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div>
            <FieldLabel htmlFor="auth-password">Password</FieldLabel>
            <TextInput id="auth-password" type="password" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} />
            <p className="mt-1 text-xs text-sakhi-muted">Use at least 8 characters.</p>
          </div>
          {error && <InlineMessage>{error}</InlineMessage>}
          <Button className="w-full" disabled={busy}>{busy ? 'Please wait…' : mode === 'sign-in' ? 'Sign in' : 'Create account'}</Button>
        </form>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <button type="button" className="min-h-11 font-semibold text-sakhi-rose underline-offset-4 hover:underline" onClick={() => { setError(null); setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in'); }}>
            {mode === 'sign-in' ? 'Create account' : 'Already have an account? Sign in'}
          </button>
          {mode === 'sign-in' && <Link className="min-h-11 py-3 font-semibold text-sakhi-rose underline-offset-4 hover:underline" to="/reset-password">Reset password</Link>}
        </div>
        <p className="mt-2 text-xs leading-5 text-sakhi-muted">Sakhi is a supportive digital companion, not an official campus representative or a real person.</p>
      </Card>
    </AuthLayout>
  );
}

export function VerifyEmailPage() {
  const { verifyEmail, pendingEmail, demoVerificationCode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState((location.state?.code as string | undefined) ?? demoVerificationCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await verifyEmail(code);
      navigate('/onboarding', { replace: true });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not verify this code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <PageHeading eyebrow="One more step" title="Verify your email" description={`Enter the verification code for ${pendingEmail ?? location.state?.email ?? 'your email address'}.`} />
      <Card>
        {demoVerificationCode && <InlineMessage tone="info">Local demo code: <strong className="ml-1 tracking-widest">{demoVerificationCode}</strong>. No email was sent.</InlineMessage>}
        <form className="mt-4 space-y-4" onSubmit={submit}>
          <div><FieldLabel htmlFor="verification-code">Verification code</FieldLabel><TextInput id="verification-code" autoComplete="one-time-code" inputMode="text" required value={code} onChange={(event) => setCode(event.target.value)} /></div>
          {error && <InlineMessage>{error}</InlineMessage>}
          <Button className="w-full" disabled={busy}>{busy ? 'Verifying…' : 'Verify and continue'}</Button>
        </form>
      </Card>
    </AuthLayout>
  );
}

export function ResetPasswordPage() {
  const { requestPasswordReset, verifyPasswordReset, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [demoVerificationCode, setDemoVerificationCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [codeRequested, setCodeRequested] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (!codeRequested) {
        const result = await requestPasswordReset(email);
        setDemoVerificationCode(result.demoVerificationCode ?? null);
        setCodeRequested(true);
        setMessage('If that address is registered, a reset code is on its way. Enter the code and choose a new password.');
      } else {
        await verifyPasswordReset(email, code);
        await updatePassword(password);
        setMessage('Your password has been updated. You can now sign in with it.');
        setCodeRequested(false);
        setCode('');
        setPassword('');
        setDemoVerificationCode(null);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'We could not reset that password.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthLayout>
      <PageHeading eyebrow="Account access" title="Reset password" description="Request a one-time code, then use it to choose a new password. Codes expire and can only be used once." />
      <Card>
        <form className="space-y-4" onSubmit={submit}>
          <div><FieldLabel htmlFor="reset-email">Email</FieldLabel><TextInput id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
          {codeRequested && (
            <>
              <div><FieldLabel htmlFor="reset-code">Reset code</FieldLabel><TextInput id="reset-code" autoComplete="one-time-code" inputMode="numeric" minLength={6} maxLength={6} required value={code} onChange={(event) => setCode(event.target.value)} /></div>
              <div><FieldLabel htmlFor="reset-new-password">New password</FieldLabel><TextInput id="reset-new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
            </>
          )}
          {error && <InlineMessage>{error}</InlineMessage>}
          {message && <InlineMessage tone="success">{message}</InlineMessage>}
          {demoVerificationCode && <InlineMessage tone="info">Local demo code: <strong className="ml-1 tracking-widest">{demoVerificationCode}</strong>. No email was sent.</InlineMessage>}
          <Button className="w-full" disabled={busy}>{busy ? 'Please wait…' : codeRequested ? 'Verify code and update password' : 'Send reset code'}</Button>
        </form>
        <button type="button" className="mt-3 min-h-11 font-semibold text-sakhi-rose" onClick={() => navigate('/auth')}>Back to sign in</button>
      </Card>
    </AuthLayout>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="mx-auto min-h-screen max-w-2xl px-4 py-10 sm:px-7 sm:py-16"><div className="mb-8 flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-sakhi-rose text-xl font-black text-white">S</span><span className="text-xl font-extrabold text-sakhi-ink">Sakhi</span></div>{children}</main>;
}
