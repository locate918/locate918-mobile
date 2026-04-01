import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { supabase } from '../services/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: any }>;
  signUpWithPassword: (
    email: string,
    password: string,
  ) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error('Failed to load Supabase session:', error.message);
      }
      setSession(data?.session ?? null);
      setIsLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setIsLoading(false);
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isLoading,
      signInWithPassword: async (email: string, password: string) => {
        return supabase.auth.signInWithPassword({ email, password });
      },
      signUpWithPassword: async (email: string, password: string) => {
        return supabase.auth.signUp({ email, password });
      },
      signOut: async () => {
        await supabase.auth.signOut();
        setSession(null);
      },
    }),
    [session, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}