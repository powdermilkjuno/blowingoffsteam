"use client";

import { useActionState, useState } from "react";
import {
  inputClass,
  labelClass,
  submitClass,
} from "../auth/_components/auth-shell";
import {
  changePasswordAction,
  sendPasswordSetupEmailAction,
  updateProfileAction,
  type PasswordState,
  type ProfileState,
} from "./actions";

function Feedback({ state }: { state: { error?: string; success?: string } }) {
  if (state.error) {
    return (
      <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return (
      <p className="rounded border border-signal/30 bg-signal/10 px-3 py-2 text-sm text-signal">
        {state.success}
      </p>
    );
  }
  return null;
}

export function ProfileSettingsForm({
  username,
  displayName,
  bio,
  timeZone,
  timeZones,
  capDayHours,
  capWeekHours,
  capMonthHours,
}: {
  username: string;
  displayName: string;
  bio: string;
  timeZone: string;
  timeZones: string[];
  capDayHours: string;
  capWeekHours: string;
  capMonthHours: string;
}) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    {},
  );
  const [bioValue, setBioValue] = useState(bio);

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          defaultValue={username}
          placeholder="3-20 chars, a-z 0-9 _"
          required
          className={inputClass}
        />
        <p className="text-xs text-muted">
          Friends find your dashboard at /u/{username || "username"}.
        </p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={displayName}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="bio">
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          value={bioValue}
          onChange={(event) => setBioValue(event.target.value)}
          maxLength={80}
          rows={2}
          placeholder="A short line. Hovering your name shows this."
          className={`${inputClass} resize-none`}
        />
        <p className="text-xs text-muted">{bioValue.length}/80</p>
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="timeZone">
          Time zone
        </label>
        <select
          id="timeZone"
          name="timeZone"
          defaultValue={timeZone}
          required
          className={inputClass}
        >
          {timeZones.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted">
          Used for last-in-game times and when today rolls into this week.
        </p>
      </div>

      <div className="space-y-1">
        <p className={labelClass}>Hoped maximum hours</p>
        <p className="text-xs text-muted">
          Daily streak breaks if you go over the day cap. Week scores Saturday
          11:59. Month scores the last day at 11:59.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className={labelClass} htmlFor="capDayHours">
              Day
            </label>
            <input
              id="capDayHours"
              name="capDayHours"
              type="number"
              min="0"
              step="0.5"
              defaultValue={capDayHours}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass} htmlFor="capWeekHours">
              Week
            </label>
            <input
              id="capWeekHours"
              name="capWeekHours"
              type="number"
              min="0"
              step="0.5"
              defaultValue={capWeekHours}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass} htmlFor="capMonthHours">
              Month
            </label>
            <input
              id="capMonthHours"
              name="capMonthHours"
              type="number"
              min="0"
              step="0.5"
              defaultValue={capMonthHours}
              required
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(
    changePasswordAction,
    {},
  );

  return (
    <form action={action} className="space-y-4">
      <Feedback state={state} />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="currentPassword">
          Current password
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Changing…" : "Change password"}
      </button>
    </form>
  );
}

export function SetPasswordPrompt({ email }: { email: string }) {
  const [state, setState] = useState<PasswordState>({});
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-3">
      <Feedback state={state} />

      <p className="text-sm text-muted">
        You signed up with Google, so there is no password on this account yet.
        We will email {email} a link so you can set one and sign in either way.
      </p>

      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setPending(true);
          setState(await sendPasswordSetupEmailAction());
          setPending(false);
        }}
        className={submitClass}
      >
        {pending ? "Sending…" : "Email me a link to set a password"}
      </button>
    </div>
  );
}
