import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { demoMode } from '@/data/repositories';
import { useAuth } from './auth-provider';
import { Card, Button, Skeleton } from '../components/ui';
import type { ProfileRow } from '@/types/database';

function hasCompletedOnboarding(profile: ProfileRow | null): boolean {
  return Boolean(profile?.display_name.trim() && profile.campus_name && profile.course && profile.year);
}

function SessionLoading() {
  return <main className="mx-auto max-w-xl px-5 py-20"><Card><Skeleton className="h-7 w-48" /><Skeleton className="mt-4 h-20 w-full" /></Card></main>;
}

function SessionError({ message, retry }: { message: string; retry: () => void }) {
  return <main className="mx-auto max-w-xl px-5 py-20"><Card><p role="alert" className="text-sm text-sakhi-ink">{message}</p><Button className="mt-4" onClick={retry}>Try again</Button></Card></main>;
}

export function RequireSession() {
  const { user, loading, error, reloadSession } = useAuth();
  const location = useLocation();
  if (demoMode) return <Navigate to="/" replace />;
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  return user ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
}

export function RequireProfile() {
  const { user, profile, loading, error, reloadSession } = useAuth();
  if (demoMode) return <Outlet />;
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  if (!user) return <Navigate to="/auth" replace />;
  return hasCompletedOnboarding(profile) ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, profile, loading, error, reloadSession } = useAuth();
  if (demoMode) return <Navigate to="/" replace />;
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  if (user) return <Navigate to={hasCompletedOnboarding(profile) ? '/' : '/onboarding'} replace />;
  return children;
}
