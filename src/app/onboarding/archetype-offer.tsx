"use client";

import { minutesToHoursInput } from "@/lib/hours";
import { labelClass, submitClass } from "../auth/_components/auth-shell";
import { skipArchetypeAction, startDiagnosticAction } from "./actions";
import { CapFields } from "./onboarding-form";

export function ArchetypeOffer({
  locked,
  needsCaps,
  caps,
}: {
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
  return (
    <form className="space-y-4">
      <div className="space-y-2">
        <label className={labelClass} htmlFor="username">
          Username
        </label>
        <p className="text-sm text-paper">{locked.username}</p>
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="displayName">
          Display name
        </label>
        <p className="text-sm text-paper">{locked.displayName}</p>
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <p className="text-sm text-paper">{locked.email || "—"}</p>
      </div>
      <div className="space-y-2">
        <label className={labelClass} htmlFor="timeZone">
          Time zone
        </label>
        <p className="text-sm text-paper">
          {locked.timeZone.replaceAll("_", " ")}
        </p>
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
        <p className="text-xs text-fern">Optional</p>
        <p className="text-sm text-paper">Play-style diagnostic</p>
        <p className="text-sm text-muted">
          We can read your recent last-played times and suggest one archetype
          badge. You can skip this and take it later in Settings.
        </p>
      </div>

      <button
        type="submit"
        formAction={startDiagnosticAction}
        className={submitClass}
      >
        See my archetype
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
