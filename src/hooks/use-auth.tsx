import {
  PropsWithChildren,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';

import { deleteCurrentAccount, isSupabaseConfigured, supabase } from '@/services/supabase';

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  session: Session | null;
  user: User | null;
  signUp: (email: string, password: string) => Promise<{ needsEmailVerification: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) setSession(nextSession);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    configured: isSupabaseConfigured,
    loading,
    session,
    user: session?.user ?? null,
    signUp: async (email, password) => {
      if (!supabase) throw new Error('Supabase is not configured. Continue in local mode.');
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user && !data.session) return { needsEmailVerification: true };
      return { needsEmailVerification: false };
    },
    signIn: async (email, password) => {
      if (!supabase) throw new Error('Supabase is not configured. Continue in local mode.');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    resetPassword: async (email) => {
      if (!supabase) throw new Error('Supabase is not configured.');
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    },
    signOut: async () => {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      setSession(null);
    },
    deleteAccount: async () => {
      await deleteCurrentAccount();
      if (supabase) await supabase.auth.signOut();
      setSession(null);
    },
  }), [loading, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
