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
          className="shrink-0 rounded bg-[#66c0f4] px-4 py-2 text-sm font-medium text-[#1b2838] hover:bg-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send request"}
        </button>
      </form>

      {state.error && <p className="text-sm text-[#ff8f8f]">{state.error}</p>}
      {state.success && (
        <p className="text-sm text-[#8fdc8f]">{state.success}</p>
      )}
    </div>
  );
}
