"use client";

import { useActionState } from "react";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../auth/_components/auth-shell";
import { completeOnboardingAction, type OnboardingState } from "./actions";

export function OnboardingForm({
  defaultUsername,
  defaultDisplayName,
}: {
  defaultUsername: string;
  defaultDisplayName: string;
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

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Setting up…" : "Finish setup"}
      </button>
    </form>
  );
}
