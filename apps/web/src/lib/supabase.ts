/**
 * Thin Supabase client stub.
 *
 * The web companion currently runs on local mock state (see `mock-data.ts` /
 * `store.ts`). This module is the seam where a live Supabase connection will
 * plug in — keep UI code free of direct Supabase imports.
 *
 * No credentials belong in this repo. Wire via NEXT_PUBLIC_SUPABASE_URL and
 * NEXT_PUBLIC_SUPABASE_ANON_KEY at deploy time only.
 */

export interface SupabaseConfig {
  url: string | undefined;
  anonKey: string | undefined;
  isConfigured: boolean;
}

export function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return {
    url,
    anonKey,
    isConfigured: Boolean(url && anonKey),
  };
}

/**
 * Placeholder client. Returns null until real credentials are provided.
 * Replace with `createClient(url, anonKey)` from `@supabase/supabase-js`
 * when the backend is connected.
 */
export function getSupabaseClient(): null {
  const config = getSupabaseConfig();
  if (!config.isConfigured) return null;
  // Intentionally not implemented — mock state covers the companion UI.
  return null;
}
