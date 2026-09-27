/**
 * Theme: light | dark | auto (follows system).
 * Persisted in localStorage; applied via <html data-theme="…">.
 * "auto" removes the attribute so prefers-color-scheme applies.
 */

export type ThemePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "cardcue.theme";

export function readThemePreference(): ThemePreference {
  if (typeof window === "undefined") return "auto";
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  } catch {
    // ignore
  }
  return "auto";
}

export function applyThemePreference(pref: ThemePreference) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (pref === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, pref);
  } catch {
    // ignore
  }
}

export function initThemePreference() {
  applyThemePreference(readThemePreference());
}
