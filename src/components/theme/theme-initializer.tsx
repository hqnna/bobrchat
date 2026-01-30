"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

import type { AccentColor } from "~/features/settings/types";

const ACCENT_CLASSES = ["accent-pink", "accent-cyan", "accent-orange", "accent-yellow", "accent-blue", "accent-gray"];
const CUSTOM_COLOR_VARS = ["--primary", "--ring", "--chart-1", "--sidebar-primary", "--sidebar-ring"];

export function applyAccentColor(color: AccentColor) {
  const html = document.documentElement;

  // Clear preset classes
  ACCENT_CLASSES.forEach(cls => html.classList.remove(cls));

  // Clear custom inline styles
  CUSTOM_COLOR_VARS.forEach(v => html.style.removeProperty(v));

  if (typeof color === "number") {
    // Custom hue - apply inline styles
    const primary = `oklch(0.72 0.19 ${color})`;
    CUSTOM_COLOR_VARS.forEach(v => html.style.setProperty(v, primary));
  }
  else if (color !== "green") {
    // Preset (non-default) - use class
    html.classList.add(`accent-${color}`);
  }
}

type ThemeInitializerProps = {
  theme?: string;
  accentColor?: AccentColor;
};

/**
 * Applies the user's saved theme preference on app start
 * Must be a child of ThemeProvider
 * Props are passed from SSR to avoid client-side fetch
 */
export function ThemeInitializer({ theme, accentColor }: ThemeInitializerProps) {
  const { setTheme } = useTheme();
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    if (theme) {
      setTheme(theme);
    }
    if (accentColor) {
      applyAccentColor(accentColor);
    }
    hasInitialized.current = true;
  }, [theme, accentColor, setTheme]);

  return null;
}
