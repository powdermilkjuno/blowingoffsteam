"use client";

import { useActionState } from "react";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../_components/auth-shell";
import {
  requestPasswordResetAction,
  type ForgotPasswordState,
} from "./actions";

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState<ForgotPasswordState, FormData>(
    requestPasswordResetAction,
    {},
  );

  if (state.success) {
    return (
      <p className="rounded border border-signal/30 bg-signal/10 px-3 py-2 text-sm text-signal">
        {state.success}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <FieldError message={state.error} />

      <div className="space-y-1">
        <label className={labelClass} htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={inputClass}
        />
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
