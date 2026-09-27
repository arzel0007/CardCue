/**
 * Legacy Supabase seam — CardCue now targets Firebase (Auth + Firestore + Hosting).
 * See docs/FIREBASE.md and src/lib/firebase.ts.
 *
 * Kept so older imports don't break; this module is a no-op stub.
 */

export interface LegacySupabaseConfig {
  isConfigured: false;
}

export function getSupabaseConfig(): LegacySupabaseConfig {
  return { isConfigured: false };
}

export function getSupabaseClient(): null {
  return null;
}
