"use client";

import * as React from "react";
import { initThemePreference } from "@/lib/theme";

/** Applies saved theme before paint to avoid flash. */
export function ThemeInit() {
  React.useEffect(() => {
    initThemePreference();
  }, []);
  return null;
}
