"use client";

import { useActionState } from "react";
import { inputClass } from "../auth/_components/auth-shell";
import { addFriendAction, type AddFriendState } from "./actions";

export function AddFriendForm() {
  const [state, action, pending] = useActionState<AddFriendState, FormData>(
    addFriendAction,
    {},
  );

  return (
    <div className="space-y-2">
      <form action={action} className="flex gap-2">
        <input
          name="friendCode"
          placeholder="Enter a friend code"
          maxLength={8}
          required
          className={`${inputClass} uppercase tracking-widest`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-sm bg-signal px-4 py-2 text-sm font-medium text-ink hover:bg-signal2 disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
      </form>

      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.success && <p className="text-sm text-signal">{state.success}</p>}
    </div>
  );
}
