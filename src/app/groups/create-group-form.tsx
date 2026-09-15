"use client";

import { useActionState } from "react";
import { inputClass } from "../auth/_components/auth-shell";
import { createGroupAction, type GroupFormState } from "./actions";

export function CreateGroupForm() {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    createGroupAction,
    {},
  );

  return (
    <div className="space-y-2">
      <form action={action} className="flex gap-2">
        <input
          name="name"
          placeholder="Group name"
          maxLength={48}
          required
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-sm bg-signal px-4 py-2 text-sm font-medium text-ink hover:bg-signal2 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create"}
        </button>
      </form>
      {state.error ? <p className="text-sm text-danger">{state.error}</p> : null}
    </div>
  );
}
