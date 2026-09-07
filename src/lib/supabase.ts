import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url  = import.meta.env.VITE_SUPABASE_URL  as string | undefined;
const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let _client: SupabaseClient | null = null;

/**
 * Returns the shared Supabase browser client.
 *
 * Safe to call from any module — the client is a singleton.
 * Throws a clear error if environment variables are missing.
 */
export function getSupabase(): SupabaseClient {
  if (_client) return _client;

  if (!url || !key) {
    const missing = !url && !key
      ? "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
      : !url
        ? "VITE_SUPABASE_URL"
        : "VITE_SUPABASE_ANON_KEY";
    throw new Error(
      `[supabase] Missing environment variable(s): ${missing}. ` +
      "Add them to your .env file (see .env.example)."
    );
  }

  _client = createClient(url, key, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  });

  return _client;
}
