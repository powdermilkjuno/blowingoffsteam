"use client";

import { useActionState } from "react";
import { addGroupFriendAction, type GroupFormState } from "./actions";

export function AddGroupFriendButton({
  otherProfileId,
  groupId,
}: {
  otherProfileId: string;
  groupId: string;
}) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    addGroupFriendAction,
    {},
  );

  return (
    <form action={action} className="shrink-0 text-right">
      <input type="hidden" name="otherProfileId" value={otherProfileId} />
      <input type="hidden" name="groupId" value={groupId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-fern hover:text-signal disabled:opacity-60"
      >
        {pending ? "Sending…" : "Add friend"}
      </button>
      {state.error ? (
        <p className="mt-1 max-w-36 text-xs text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-1 max-w-36 text-xs text-signal">{state.success}</p>
      ) : null}
    </form>
  );
}
