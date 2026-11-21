import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { ProfileRow } from '@/types/database';
import type { AuthUser, PasswordResetResult, SignUpResult } from '@/data/contracts';
import { dataMode, repositories } from '@/data/repositories';

type AuthContextValue = {
  user: AuthUser | null;
  profile: ProfileRow | null;
  loading: boolean;
  error: string | null;
  pendingEmail: string | null;
  demoVerificationCode: string | null;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<SignUpResult>;
  verifyEmail(code: string): Promise<void>;
  resetPassword(email: string, newPassword?: string): Promise<PasswordResetResult>;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  saveOnboarding(profile: Partial<ProfileRow>, consent: { ai_memory_opt_in: boolean; cycle_tracking_opt_in: boolean; discovery_visible: boolean }): Promise<void>;
  reloadSession(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_QUERY_KEY = ['auth', 'session'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const session = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const user = await repositories.auth.currentUser();
      const profile = user && dataMode === 'local' ? await repositories.profile.get() : null;
      return { user, profile };
    },
  });
  const user = session.data?.user ?? null;
  const profile = session.data?.profile ?? null;
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [demoVerificationCode, setDemoVerificationCode] = useState<string | null>(null);
  const error = session.error instanceof Error ? session.error.message : session.error ? 'Could not load your session.' : null;

  const reloadSession = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
  }, [queryClient]);

  const signUp = useCallback(async (email: string, password: string) => {
    const result = await repositories.auth.signUp(email, password);
    setPendingEmail(result.user.email);
    setDemoVerificationCode(result.demoVerificationCode ?? null);
    return result;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const current = await repositories.auth.signIn(email, password);
    const updatedProfile = dataMode === 'local' ? await repositories.profile.get() : null;
    queryClient.setQueryData(SESSION_QUERY_KEY, { user: current, profile: updatedProfile });
    setPendingEmail(null);
    setDemoVerificationCode(null);
  }, [queryClient]);

  const verifyEmail = useCallback(async (code: string) => {
    const current = await repositories.auth.verifyEmail(code);
    const updatedProfile = dataMode === 'local' ? await repositories.profile.get() : null;
    queryClient.setQueryData(SESSION_QUERY_KEY, { user: current, profile: updatedProfile });
    setPendingEmail(null);
    setDemoVerificationCode(null);
  }, [queryClient]);

  const resetPassword = useCallback(async (email: string, newPassword?: string): Promise<PasswordResetResult> => {
    return repositories.auth.resetPassword(email, newPassword);
  }, []);

  const signOut = useCallback(async () => {
    await repositories.auth.signOut();
    setPendingEmail(null);
    setDemoVerificationCode(null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    queryClient.setQueryData(SESSION_QUERY_KEY, { user: null, profile: null });
  }, [queryClient]);

  const deleteAccount = useCallback(async () => {
    await repositories.account.deleteAccount();
    setPendingEmail(null);
    setDemoVerificationCode(null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
    queryClient.setQueryData(SESSION_QUERY_KEY, { user: null, profile: null });
  }, [queryClient]);

  const saveOnboarding = useCallback(async (
    profileChanges: Partial<ProfileRow>,
    consent: { ai_memory_opt_in: boolean; cycle_tracking_opt_in: boolean; discovery_visible: boolean }
  ) => {
    if (!user) throw new Error('Sign in before saving onboarding information.');
    const updatedProfile = await repositories.profile.save(profileChanges);
    await repositories.consents.update(consent);
    queryClient.setQueryData(SESSION_QUERY_KEY, { user, profile: updatedProfile });
  }, [queryClient, user]);

  const value = useMemo(() => ({
    user,
    profile,
    loading: session.isLoading,
    error,
    pendingEmail,
    demoVerificationCode,
    signIn,
    signUp,
    verifyEmail,
    resetPassword,
    signOut,
    deleteAccount,
    saveOnboarding,
    reloadSession,
  }), [user, profile, session.isLoading, error, pendingEmail, demoVerificationCode, signIn, signUp, verifyEmail, resetPassword, signOut, deleteAccount, saveOnboarding, reloadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
