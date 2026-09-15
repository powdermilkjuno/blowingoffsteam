"use client";

import { useActionState } from "react";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../auth/_components/auth-shell";
import { completeOnboardingAction, type OnboardingState } from "./actions";

export function CapFields({
  disabled = false,
  defaults,
}: {
  disabled?: boolean;
  defaults?: { day?: string; week?: string; month?: string };
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[
        { id: "capDayHours", label: "Day hours", value: defaults?.day },
        { id: "capWeekHours", label: "Week hours", value: defaults?.week },
        { id: "capMonthHours", label: "Month hours", value: defaults?.month },
      ].map((field) => (
        <div key={field.id} className="space-y-1">
          <label className={labelClass} htmlFor={field.id}>
            {field.label}
          </label>
          <input
            id={field.id}
            name={field.id}
            type="number"
            min="0"
            step="0.5"
            defaultValue={field.value}
            required={!disabled}
            disabled={disabled}
            className={`${inputClass} ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
          />
        </div>
      ))}
    </div>
  );
}

export function OnboardingForm({
  defaultUsername,
  defaultDisplayName,
  timeZones,
  defaultTimeZone = "America/New_York",
}: {
  defaultUsername: string;
  defaultDisplayName: string;
  timeZones: string[];
  defaultTimeZone?: string;
}) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    completeOnboardingAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <FieldError message={state.error} />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={state.values?.username ?? defaultUsername}
          placeholder="3-20 chars, a-z 0-9 _"
          required
          className={inputClass}
        />
        <p className="text-xs text-muted">
          This is your public handle at /u/username.
        </p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={state.values?.displayName ?? defaultDisplayName}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={state.values?.email}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
        <p className="text-xs text-muted">
          Use this with your email next time. Steam is only for linking your
          library.
        </p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="timeZone">
          Time zone
        </label>
        <select
          id="timeZone"
          name="timeZone"
          defaultValue={state.values?.timeZone ?? defaultTimeZone}
          required
          className={inputClass}
        >
          {timeZones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <p className={labelClass}>Hoped maximum hours</p>
        <p className="text-xs text-muted">
          Stay under these to keep day, week, and month streaks.
        </p>
        <CapFields
          defaults={{
            day: state.values?.capDayHours,
            week: state.values?.capWeekHours,
            month: state.values?.capMonthHours,
          }}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Setting up…" : "Continue"}
      </button>
    </form>
  );
}
