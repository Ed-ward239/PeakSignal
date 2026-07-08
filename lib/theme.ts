"use client";

/**
 * Theme preference (Settings → Appearance). A device-level setting, so it lives
 * in localStorage in both auth modes. The `dark` class goes on <html>
 * (tailwind `darkMode: "class"`); a pre-paint script in the root layout applies
 * it before hydration so there's no flash. Dark is the app's default.
 */
export type Theme = "dark" | "light";

export const THEME_KEY = "peaksignal.theme.v1";

export function getTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function setTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
  document.documentElement.classList.toggle("dark", theme === "dark");
}
