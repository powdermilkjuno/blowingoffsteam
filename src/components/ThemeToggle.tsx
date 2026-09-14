"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const current = document.documentElement.classList.contains("light")
      ? "light"
      : "dark";
    setTheme(current);
  }, []);

  function toggle() {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(next);
    try {
      localStorage.setItem("bos-theme", next);
    } catch {
      // Theme just will not persist if storage is blocked.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={
        theme === "light" ? "Switch to dark mode" : "Switch to light mode"
      }
      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded border border-line text-fern transition-colors hover:border-fern hover:text-signal ${className}`}
    >
      {theme === "light" ? (
        <MoonIcon width={16} height={16} aria-hidden="true" />
      ) : (
        <SunIcon width={16} height={16} aria-hidden="true" />
      )}
    </button>
  );
}
