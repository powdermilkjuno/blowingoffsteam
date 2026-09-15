"use client";

import { useState } from "react";

export function CopyInviteLink({
  url,
  code,
}: {
  url: string;
  code: string;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(value: string, kind: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded border border-line bg-raised px-3 py-2 text-sm tracking-[0.2em] text-paper">
          {code}
        </code>
        <button
          type="button"
          onClick={() => copy(code, "code")}
          className="shrink-0 text-xs text-fern hover:text-signal"
        >
          {copied === "code" ? "Copied" : "Copy code"}
        </button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <code className="min-w-0 flex-1 truncate rounded border border-line bg-raised px-3 py-2 text-xs text-muted">
          {url}
        </code>
        <button
          type="button"
          onClick={() => copy(url, "link")}
          className="shrink-0 text-xs text-fern hover:text-signal"
        >
          {copied === "link" ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
