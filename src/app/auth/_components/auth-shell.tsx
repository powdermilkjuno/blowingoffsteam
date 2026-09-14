import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import Card from "@/components/Card";
import ThemeToggle from "@/components/ThemeToggle";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-105" />
      <div className="steam-field -z-10" />

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <Card className="corners w-full max-w-sm animate-rise space-y-6 p-7">
        <div>
          <h1 className="text-xl text-paper">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
        </div>
        {children}
      </Card>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {message}
    </p>
  );
}

export const inputClass =
  "w-full rounded border border-line bg-surface px-3.5 py-3 text-sm text-paper outline-none placeholder:text-muted/60 focus:border-signal";

export const labelClass = "block text-xs text-fern";

export const submitClass =
  "w-full rounded-sm bg-signal px-4 py-3 text-sm font-medium text-ink shadow-[inset_0_-2px_0_color-mix(in_srgb,var(--bos-ink)_22%,transparent)] hover:bg-signal2 disabled:opacity-60";
