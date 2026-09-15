"use client";

import { useActionState } from "react";
import { inputClass } from "../auth/_components/auth-shell";
import { openJoinAction, type GroupFormState } from "./actions";

export function JoinGroupForm() {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    openJoinAction,
    {},
  );

  return (
    <div className="space-y-2">
      <form action={action} className="flex gap-2">
        <input
          name="invite"
          placeholder="Invite code"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
          required
          className={`${inputClass} uppercase tracking-widest`}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-sm bg-signal px-4 py-2 text-sm font-medium text-ink hover:bg-signal2 disabled:opacity-60"
        >
          {pending ? "Joining…" : "Join"}
        </button>
      </form>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </div>
  );
}
