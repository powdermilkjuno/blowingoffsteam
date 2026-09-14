import type { ReactNode } from "react";

export default function TerminalWindow({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`corners scanlines overflow-hidden rounded-sm border border-line bg-surface shadow-[0_20px_50px_color-mix(in_srgb,var(--bos-ink)_35%,transparent)] ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-line bg-raised/80 px-4 py-2.5">
        <span className="h-2 w-2 rounded-full bg-clay" />
        <span className="h-2 w-2 rounded-full bg-signal" />
        <span className="h-2 w-2 rounded-full bg-fern" />
        {title ? (
          <span className="ml-2 font-pixel text-[9px] tracking-widest text-muted">
            {title}
          </span>
        ) : null}
      </div>
      <div className="relative p-5">{children}</div>
    </div>
  );
}
