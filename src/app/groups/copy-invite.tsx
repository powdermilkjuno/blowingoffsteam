"use client";

import { useState } from "react";

export function CopyInviteLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <code className="min-w-0 flex-1 truncate rounded border border-line bg-raised px-3 py-2 text-xs text-paper">
        {url}
      </code>
      <button
        type="button"
        onClick={copy}
        className="shrink-0 text-xs text-fern hover:text-signal"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
