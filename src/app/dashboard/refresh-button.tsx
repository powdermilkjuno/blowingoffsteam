"use client";

import { useActionState } from "react";
import { formatClockAt } from "@/lib/db/profiles";
import { refreshPlaytimeAction, type RefreshState } from "./actions";

export function RefreshPlaytimeButton({
  lastSyncedAt,
  timeZone,
}: {
  lastSyncedAt: Date;
  timeZone: string;
}) {
  const [state, action, pending] = useActionState<RefreshState, FormData>(
    refreshPlaytimeAction,
    {},
  );

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-[#2a3f5a] px-3 py-1 text-xs text-[#66c0f4] hover:border-[#66c0f4] hover:text-white disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh times"}
      </button>
      <p className="text-[11px] text-[#5a6b7c]">
        Last pulled {formatClockAt(lastSyncedAt, timeZone)}
      </p>
      {state.error && <p className="text-[11px] text-[#ff8f8f]">{state.error}</p>}
      {state.success && (
        <p className="text-[11px] text-[#8fdc8f]">{state.success}</p>
      )}
    </form>
  );
}
