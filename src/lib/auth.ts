/**
 * Minimal Supabase Auth helpers for Triply.
 *
 * Uses a synthetic email derived from the Bangladesh mobile number
 * so the existing mobile+password UI can work with Supabase
 * email/password authentication without redesigning the auth flow.
 */

import type { User, AuthError } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

// ── Mobile → synthetic email ─────────────────────────────────────────────────

/**
 * Convert a clean 10-digit BD mobile (e.g. "1712345678")
 * to a deterministic synthetic email for Supabase auth.
 */
export function mobileToEmail(mobile: string): string {
  const clean = mobile.replace(/\D/g, "").slice(-10);
  return `${clean}@triply.app`;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface AuthResult {
  error: string | null;
  user: User | null;
}

// ── Sign Up ──────────────────────────────────────────────────────────────────

/**
 * Create a new Supabase auth user + profiles row.
 *
 * Mobile number is used as the auth identifier (via synthetic email).
 * Returns a user-friendly error string on failure.
 */
export async function signUp(
  name: string,
  mobile: string,
  password: string,
): Promise<AuthResult> {
  const sb = getSupabase();
  const email = mobileToEmail(mobile);

  const { data, error } = await sb.auth.signUp({
    email,
    password,
    options: {
      data: { name, mobile },
    },
  });

  if (error) {
    return { error: friendlyAuthError(error), user: null };
  }

  const user = data.user;

  // Ensure profiles row exists (id = auth user id)
  if (user) {
    const { error: profileError } = await sb
      .from("profiles")
      .upsert(
        { id: user.id, name, email: user.email ?? email },
        { onConflict: "id" },
      );

    if (profileError) {
      // Profile creation failed — but auth user exists.
      // Return a non-blocking warning; user can still sign in.
      console.error("[auth] profile upsert failed:", profileError.message);
    }
  }

  // data.session may be null if email confirmation is required.
  // The caller should handle this (e.g. show "check your email" screen).
  return { error: null, user: data.user };
}

// ── Sign In ──────────────────────────────────────────────────────────────────

/**
 * Sign in with mobile number + password.
 */
export async function signIn(
  mobile: string,
  password: string,
): Promise<AuthResult> {
  const sb = getSupabase();
  const email = mobileToEmail(mobile);

  const { data, error } = await sb.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: friendlyAuthError(error), user: null };
  }

  return { error: null, user: data.user };
}

// ── Sign Out ─────────────────────────────────────────────────────────────────

/**
 * Sign out and clear the local session.
 */
export async function signOut(): Promise<void> {
  const sb = getSupabase();
  await sb.auth.signOut();
}

// ── Current Session ──────────────────────────────────────────────────────────

/**
 * Get the current authenticated user, if any.
 * Returns null when not signed in.
 */
export async function getCurrentUser(): Promise<User | null> {
  const sb = getSupabase();
  const { data } = await sb.auth.getUser();
  return data.user;
}

// ── Error Mapping ────────────────────────────────────────────────────────────

/**
 * Map raw Supabase auth errors to user-friendly messages.
 */
function friendlyAuthError(err: AuthError): string {
  const msg = err.message.toLowerCase();

  // Log the real error in development — never visible to end users in prod.
  console.error("[auth] Supabase error:", err.message, err);

  // ── Specific credential errors ──
  if (msg.includes("invalid login credentials")) {
    return "Incorrect mobile number or password. Please try again.";
  }

  // ── Account already exists ──
  if (msg.includes("already registered") || msg.includes("already exists")) {
    return "An account with this mobile number already exists.";
  }

  // ── Email validation (happens when Supabase rejects the synthetic email) ──
  if (msg.includes("unable to validate email") || msg.includes("invalid email")) {
    return "Invalid mobile number. Please enter a valid Bangladesh number.";
  }

  // ── Password too short ──
  if (msg.includes("password should be at least") || msg.includes("password must be at least")) {
    return "Password must be at least 6 characters.";
  }

  // ── Email not confirmed (sign-in after signup with confirm email ON) ──
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Please confirm your email before signing in.";
  }

  // ── Rate limiting / security ──
  if (msg.includes("for security purposes") || msg.includes("too many requests")) {
    return "Too many attempts. Please wait a moment and try again.";
  }

  // ── Network ──
  if (msg.includes("network") || msg.includes("fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  // ── Fallback: include the actual message for development visibility ──
  return `Signup failed: ${err.message}`;
}
