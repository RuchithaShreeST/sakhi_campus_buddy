import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from './auth-provider';
import { Card, Button, Skeleton } from '../components/ui';

function SessionLoading() {
  return <main className="mx-auto max-w-xl px-5 py-20"><Card><Skeleton className="h-7 w-48" /><Skeleton className="mt-4 h-20 w-full" /></Card></main>;
}

function SessionError({ message, retry }: { message: string; retry: () => void }) {
  return <main className="mx-auto max-w-xl px-5 py-20"><Card><p role="alert" className="text-sm text-sakhi-ink">{message}</p><Button className="mt-4" onClick={retry}>Try again</Button></Card></main>;
}

export function RequireSession() {
  const { user, loading, error, reloadSession } = useAuth();
  const location = useLocation();
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  return user ? <Outlet /> : <Navigate to="/auth" replace state={{ from: location.pathname }} />;
}

export function RequireProfile() {
  const { user, profile, loading, error, reloadSession } = useAuth();
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  if (!user) return <Navigate to="/auth" replace />;
  return profile ? <Outlet /> : <Navigate to="/onboarding" replace />;
}

export function PublicOnly({ children }: { children: ReactNode }) {
  const { user, profile, loading, error, reloadSession } = useAuth();
  if (loading) return <SessionLoading />;
  if (error) return <SessionError message={error} retry={() => void reloadSession()} />;
  if (user) return <Navigate to={profile ? '/' : '/onboarding'} replace />;
  return children;
}
