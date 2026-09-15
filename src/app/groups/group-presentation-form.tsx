"use client";

import { useActionState, useState } from "react";
import { inputClass, labelClass } from "../auth/_components/auth-shell";
import { GROUP_ACCENTS, type GroupAccent } from "@/lib/group-accent";
import { updateGroupPresentationAction, type GroupFormState } from "./actions";
import Link from "next/link";

const DESCRIPTION_MAX = 120;

export function GroupPresentationForm({
  groupId,
  description,
  accent,
  ownedAccents,
}: {
  groupId: string;
  description: string;
  accent: GroupAccent;
  ownedAccents: GroupAccent[];
}) {
  const [state, action, pending] = useActionState<GroupFormState, FormData>(
    updateGroupPresentationAction,
    {},
  );
  const [descriptionValue, setDescriptionValue] = useState(description);
  const [accentValue, setAccentValue] = useState<GroupAccent>(accent);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="accent" value={accentValue} />

      {state.error ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="text-sm text-signal">{state.success}</p>
      ) : null}

      <div className="space-y-1">
        <label className={labelClass} htmlFor="group-description">
          Description
        </label>
        <textarea
          id="group-description"
          name="description"
          value={descriptionValue}
          onChange={(event) => setDescriptionValue(event.target.value)}
          maxLength={DESCRIPTION_MAX}
          rows={2}
          placeholder="A short line for the group card."
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-muted">
          {descriptionValue.length}/{DESCRIPTION_MAX}
        </p>
      </div>

      <fieldset className="space-y-2">
        <legend className={labelClass}>Accent</legend>
        <div className="flex flex-wrap gap-2">
          {ownedAccents.map((id) => {
            const selected = accentValue === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAccentValue(id)}
                className={`flex items-center gap-2 rounded-sm border px-2 py-1.5 text-xs ${
                  selected
                    ? "border-signal text-paper"
                    : "border-line text-muted hover:border-fern hover:text-paper"
                }`}
                aria-pressed={selected}
              >
                <span
                  className={`h-3 w-3 rounded-sm ${GROUP_ACCENTS[id].swatch}`}
                  aria-hidden
                />
                {GROUP_ACCENTS[id].label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted">
          More colors in the{" "}
          <Link href="/shop" className="text-fern hover:text-signal">
            Shop
          </Link>
          .
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-signal px-4 py-2 text-sm font-medium text-ink hover:bg-signal2 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
