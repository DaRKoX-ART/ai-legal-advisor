import type { User, Session } from "@supabase/supabase-js";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchProfile,
  getSession,
  signInWithEmail,
  signOut as signOutSupabase,
  signUpWithEmail,
  sendPasswordReset,
  isSupabaseConfigured,
} from "@/services/supabase/auth";
import { supabase } from "@/services/supabase/client";
import { insertEvent, queueEvent } from "@/services/supabase/analytics";
import type { Database } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export type AuthError = {
  message: string;
  code?: string;
};

type AuthContextValue = {
  /** Whether Supabase is configured (env vars present). */
  configured: boolean;
  /** Whether the auth state is still loading (session restoration). */
  isLoading: boolean;
  /** Current Supabase session, or null. */
  session: Session | null;
  /** Current Supabase user, or null. */
  user: User | null;
  /** Public profile row for the current user, or null. */
  profile: Profile | null;
  /** Is there an authenticated Supabase session? */
  isAuthenticated: boolean;

  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null; success: boolean }>;
};

const AuthCtx = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const configured = isSupabaseConfigured();
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Restore session on mount
  useEffect(() => {
    let mounted = true;
    let subscription: { unsubscribe: () => void } | null = null;

    async function init() {
      if (!configured || !supabase) {
        if (mounted) setIsLoading(false);
        return;
      }
      const { session: restoredSession, user: restoredUser } = await getSession();
      if (!mounted) return;
      setSession(restoredSession);
      setUser(restoredUser);
      if (restoredUser) {
        const { profile: p } = await fetchProfile(restoredUser.id);
        if (mounted) setProfile(p);
      }
      setIsLoading(false);
    }

    init();

    // Listen for auth state changes only when Supabase is available
    if (supabase) {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          const { profile: p } = await fetchProfile(newSession.user.id);
          if (mounted) setProfile(p);
        } else {
          setProfile(null);
        }
      });
      subscription = sub;
    }

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [configured]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: AuthError | null }> => {
      if (!configured) return { error: { message: "Supabase is not configured" } };
      const { error, user: u } = await signInWithEmail({ email, password });
      if (error) return { error };
      if (u) {
        setUser(u);
        const { profile: p } = await fetchProfile(u.id);
        setProfile(p);
      }
      // Analytics
      const event = { event_type: "auth_sign_in", metadata: { provider: "email" }, client_timestamp: new Date().toISOString() };
      const ok = await insertEvent(event, u?.id ?? null);
      if (!ok) await queueEvent(event);
      return { error: null };
    },
    [configured],
  );

  const signUp = useCallback(
    async (email: string, password: string, name: string): Promise<{ error: AuthError | null }> => {
      if (!configured) return { error: { message: "Supabase is not configured" } };
      const { error, user: u } = await signUpWithEmail({ email, password, name });
      if (error) return { error };
      if (u) {
        setUser(u);
        const { profile: p } = await fetchProfile(u.id);
        setProfile(p);
      }
      // Analytics
      const event = { event_type: "auth_sign_up", metadata: { provider: "email" }, client_timestamp: new Date().toISOString() };
      const ok = await insertEvent(event, u?.id ?? null);
      if (!ok) await queueEvent(event);
      return { error: null };
    },
    [configured],
  );

  const signOut = useCallback(async (): Promise<{ error: AuthError | null }> => {
    if (!configured) return { error: null };
    const { error } = await signOutSupabase();
    // Always clear local state — best-effort logout must never leave the
    // app thinking the user is still signed in.
    setSession(null);
    setUser(null);
    setProfile(null);
    return { error };
  }, [configured]);

  const resetPassword = useCallback(
    async (email: string): Promise<{ error: AuthError | null; success: boolean }> => {
      if (!configured) return { error: { message: "Supabase is not configured" }, success: false };
      return sendPasswordReset(email);
    },
    [configured],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      isLoading,
      session,
      user,
      profile,
      isAuthenticated: !!session,
      signIn,
      signUp,
      signOut,
      resetPassword,
    }),
    [configured, isLoading, session, user, profile, signIn, signUp, signOut, resetPassword],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
