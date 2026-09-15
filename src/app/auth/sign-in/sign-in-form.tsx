"use client";

import { useActionState } from "react";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../_components/auth-shell";
import { signInAction, type SignInState } from "./actions";

export function SignInForm({
  initialError,
  defaultEmail = "",
  lockEmail = false,
  next = "/dashboard",
}: {
  initialError?: string;
  defaultEmail?: string;
  lockEmail?: boolean;
  next?: string;
}) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signInAction,
    { error: initialError },
  );

  return (
    <form action={action} className="space-y-4">
      <FieldError message={state.error} />
      <input type="hidden" name="next" value={next} />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={defaultEmail}
          readOnly={lockEmail}
          required
          className={`${inputClass} ${lockEmail ? "cursor-not-allowed opacity-70" : ""}`}
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
          autoComplete="current-password"
          autoFocus={lockEmail}
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
