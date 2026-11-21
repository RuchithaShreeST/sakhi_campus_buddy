import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from './components/app-shell';
import { ErrorBoundary } from './components/error-boundary';
import { AuthProvider } from './auth/auth-provider';
import { PublicOnly, RequireProfile, RequireSession } from './auth/route-guards';
import { Skeleton } from './components/ui';

const AuthPage = lazy(() => import('./pages/auth').then((module) => ({ default: module.AuthPage })));
const VerifyEmailPage = lazy(() => import('./pages/auth').then((module) => ({ default: module.VerifyEmailPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth').then((module) => ({ default: module.ResetPasswordPage })));
const OnboardingPage = lazy(() => import('./pages/onboarding').then((module) => ({ default: module.OnboardingPage })));
const HomePage = lazy(() => import('./pages/home').then((module) => ({ default: module.HomePage })));
const WellbeingPage = lazy(() => import('./pages/wellbeing').then((module) => ({ default: module.WellbeingPage })));
const PlannerPage = lazy(() => import('./pages/planner').then((module) => ({ default: module.PlannerPage })));
const CampusPage = lazy(() => import('./pages/campus').then((module) => ({ default: module.CampusPage })));
const CirclePage = lazy(() => import('./pages/circle').then((module) => ({ default: module.CirclePage })));
const ChatPage = lazy(() => import('./pages/chat').then((module) => ({ default: module.ChatPage })));
const PlacementPage = lazy(() => import('./pages/placements').then((module) => ({ default: module.PlacementPage })));
const SettingsPage = lazy(() => import('./pages/settings').then((module) => ({ default: module.SettingsPage })));
const NotificationsPage = lazy(() => import('./pages/notifications').then((module) => ({ default: module.NotificationsPage })));
const PrivacyPage = lazy(() => import('./pages/privacy').then((module) => ({ default: module.PrivacyPage })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<main className="mx-auto max-w-5xl px-5 py-10"><Skeleton className="h-10 w-64" /><Skeleton className="mt-6 h-72 w-full" /></main>}>
              <Routes>
                <Route path="/auth" element={<PublicOnly><AuthPage /></PublicOnly>} />
                <Route path="/verify-email" element={<PublicOnly><VerifyEmailPage /></PublicOnly>} />
                <Route path="/reset-password" element={<PublicOnly><ResetPasswordPage /></PublicOnly>} />
                <Route element={<RequireSession />}>
                  <Route path="/onboarding" element={<OnboardingPage />} />
                </Route>
                <Route element={<RequireProfile />}>
                  <Route element={<AppShell />}>
                    <Route index element={<HomePage />} />
                    <Route path="/wellbeing" element={<WellbeingPage />} />
                    <Route path="/planner" element={<PlannerPage />} />
                    <Route path="/campus" element={<CampusPage />} />
                    <Route path="/circle" element={<CirclePage />} />
                    <Route path="/grow" element={<PlacementPage />} />
                    <Route path="/placements" element={<PlacementPage />} />
                    <Route path="/help" element={<ChatPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />
                    <Route path="*" element={<HomePage />} />
                  </Route>
                </Route>
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
