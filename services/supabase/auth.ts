import { supabase, isSupabaseConfigured } from "./client";

export { isSupabaseConfigured };

export type AuthError = {
  message: string;
  code?: string;
};

export type SignInCredentials = {
  email: string;
  password: string;
};

export type SignUpCredentials = {
  email: string;
  password: string;
  name: string;
};

/**
 * Sign in with email and password.
 * Returns the user on success, or an AuthError on failure.
 */
export async function signInWithEmail({
  email,
  password,
}: SignInCredentials) {
  if (!supabase) {
    return {
      error: { message: "Supabase is not configured" } as AuthError,
      user: null,
    };
  }
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return { error: { message: error.message, code: error.code } as AuthError, user: null };
  }
  return { error: null, user: data.user };
}

/**
 * Sign up with email, password, and display name.
 * Stores the name in user metadata so the profile trigger can pick it up.
 */
export async function signUpWithEmail({
  email,
  password,
  name,
}: SignUpCredentials) {
  if (!supabase) {
    return {
      error: { message: "Supabase is not configured" } as AuthError,
      user: null,
    };
  }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });
  if (error) {
    return { error: { message: error.message, code: error.code } as AuthError, user: null };
  }
  return { error: null, user: data.user };
}

/**
 * Send a password reset email (magic link).
 */
export async function sendPasswordReset(email: string) {
  if (!supabase) {
    return {
      error: { message: "Supabase is not configured" } as AuthError,
      success: false,
    };
  }
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: "folio://reset-password",
  });
  if (error) {
    return { error: { message: error.message, code: error.code } as AuthError, success: false };
  }
  return { error: null, success: true };
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  if (!supabase) return { error: null };
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { error: { message: error.message, code: error.code } as AuthError };
  }
  return { error: null };
}

/**
 * Get the current session.
 */
export async function getSession() {
  if (!supabase) return { session: null, user: null };
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error || !session) {
    return { session: null, user: null };
  }
  return { session, user: session.user };
}

/**
 * Fetch the user's public profile row.
 */
export async function fetchProfile(userId: string) {
  if (!supabase) return { profile: null, error: null };
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    return {
      profile: null,
      error: { message: error.message, code: error.code } as AuthError,
    };
  }
  return { profile: data, error: null };
}
