import Link from "next/link";
import type { ReactNode } from "react";

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
    <div className="flex flex-1 items-center justify-center bg-[#1b2838] px-6 py-12 font-sans text-[#c7d5e0]">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <Link href="/" className="text-xs text-[#66c0f4] hover:text-white">
            Blowing Off Steam
          </Link>
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          <p className="text-sm text-[#8f98a0]">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded border border-[#5a2a2a] bg-[#2d1b1b] px-3 py-2 text-sm text-[#ff8f8f]">
      {message}
    </p>
  );
}

export const inputClass =
  "w-full rounded border border-[#2a3f5a] bg-[#16202d] px-3 py-2 text-sm text-white outline-none placeholder:text-[#5a6b7c] focus:border-[#66c0f4]";

export const labelClass = "block text-xs uppercase tracking-wide text-[#8f98a0]";

export const submitClass =
  "w-full rounded bg-[#66c0f4] px-4 py-2 text-sm font-medium text-[#1b2838] hover:bg-white disabled:opacity-60";
