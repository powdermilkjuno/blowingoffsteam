"use client";

import { useActionState } from "react";
import { ARCHETYPE_META, type ArchetypeBreakdown } from "@/lib/archetypes";
import { minutesToHoursInput } from "@/lib/hours";
import { ArchetypeBars } from "@/components/ArchetypeBadge";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../auth/_components/auth-shell";
import { confirmArchetypeAction, skipArchetypeAction, type OnboardingState } from "./actions";
import { CapFields } from "./onboarding-form";

export function ArchetypeReveal({
  breakdown,
  locked,
  needsCaps,
  caps,
}: {
  breakdown: ArchetypeBreakdown;
  locked: {
    username: string;
    displayName: string;
    email: string;
    timeZone: string;
  };
  needsCaps: boolean;
  caps: {
    capDayMinutes: number | null;
    capWeekMinutes: number | null;
    capMonthMinutes: number | null;
  };
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    confirmArchetypeAction,
    {},
  );
  const meta = ARCHETYPE_META[breakdown.winner];

  return (
    <form action={action} className="space-y-4">
      <FieldError message={state.error} />

      <div className="space-y-2">
        <label className={labelClass} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          value={locked.username}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-70`}
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          value={locked.displayName}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-70`}
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          value={locked.email}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-70`}
        />
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="timeZone">
          Time zone
        </label>
        <input
          id="timeZone"
          value={locked.timeZone.replaceAll("_", " ")}
          disabled
          className={`${inputClass} cursor-not-allowed opacity-70`}
        />
      </div>

      {needsCaps ? (
        <div className="space-y-1">
          <p className={labelClass}>Hoped maximum hours</p>
          <CapFields
            defaults={{
              day: minutesToHoursInput(caps.capDayMinutes),
              week: minutesToHoursInput(caps.capWeekMinutes),
              month: minutesToHoursInput(caps.capMonthMinutes),
            }}
          />
        </div>
      ) : null}

      <div className="space-y-3 rounded border border-line bg-raised p-4">
        <p className="text-xs text-fern">Your archetype</p>
        <p className="text-lg text-paper">{meta.label}</p>
        <p className="text-sm text-muted">
          You are {meta.article} {meta.label}, meaning that {meta.meaning}.
        </p>
        <ArchetypeBars breakdown={breakdown} />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Saving…" : "Take this badge"}
      </button>
      <button
        type="submit"
        formAction={skipArchetypeAction}
        className="w-full text-center text-xs text-muted hover:text-signal"
      >
        Skip for now
      </button>
    </form>
  );
}
