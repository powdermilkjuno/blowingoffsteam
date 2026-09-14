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
        className="rounded border border-line px-3 py-1 text-xs text-fern hover:border-signal hover:text-signal disabled:opacity-60"
      >
        {pending ? "Refreshing…" : "Refresh times"}
      </button>
      <p className="text-[11px] text-muted">
        Last pulled {formatClockAt(lastSyncedAt, timeZone)}
      </p>
      {state.error && <p className="text-[11px] text-danger">{state.error}</p>}
      {state.success && (
        <p className="text-[11px] text-signal">{state.success}</p>
      )}
    </form>
  );
}
