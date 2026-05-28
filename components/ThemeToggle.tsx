"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const storageKey = "owemygod-theme";
    try {
      const savedTheme = localStorage.getItem(storageKey);
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : (prefersDark ? "dark" : "light");
      setIsDark(theme === "dark");
    } catch {
      setIsDark(false);
    }
  }, []);

  const toggleTheme = () => {
    const storageKey = "owemygod-theme";
    const root = document.documentElement;
    const newIsDark = !isDark;

    try {
      // Remove both classes, then add the appropriate one
      root.classList.remove("light", "dark");
      
      if (newIsDark) {
        root.classList.add("dark");
        localStorage.setItem(storageKey, "dark");
      } else {
        root.classList.add("light");
        localStorage.setItem(storageKey, "light");
      }
      setIsDark(newIsDark);
      root.style.colorScheme = newIsDark ? "dark" : "light";
    } catch {
      // Fallback if localStorage is unavailable
    }
  };

  if (!mounted) {
    return <div className="h-9 w-16 rounded-full border border-border bg-muted/60" />;
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative inline-flex h-9 w-16 items-center rounded-full border border-border bg-muted/80 px-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Toggle theme"
      aria-pressed={isDark}
    >
      <span className="sr-only">Toggle theme</span>
      <span className="absolute left-2 text-[hsl(var(--muted-foreground))] dark:text-muted-foreground" aria-hidden="true">
        <Sun className="h-3.5 w-3.5" />
      </span>
      <span className="absolute right-2 text-[hsl(var(--muted-foreground))] dark:text-muted-foreground" aria-hidden="true">
        <Moon className="h-3.5 w-3.5" />
      </span>
      <span
        className={`inline-flex h-7 w-7 transform items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform duration-200 ${isDark ? "translate-x-7" : "translate-x-0"}`}
        aria-hidden="true"
      >
        {isDark ? <Moon className="h-4 w-4" fill="currentColor" /> : <Sun className="h-4 w-4" fill="currentColor" />}
      </span>
    </button>
  );
}
