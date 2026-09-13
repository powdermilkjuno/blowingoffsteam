"use client";

import { useActionState } from "react";
import {
  FieldError,
  inputClass,
  labelClass,
  submitClass,
} from "../_components/auth-shell";
import { signUpAction, type SignUpState } from "./actions";

export function SignUpForm() {
  const [state, action, pending] = useActionState<SignUpState, FormData>(
    signUpAction,
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
          defaultValue={state.values?.username}
          placeholder="3-20 chars, a-z 0-9 _"
          required
          className={inputClass}
        />
      </div>

      <div className="space-y-1">
        <label className={labelClass} htmlFor="displayName">
          Display name
        </label>
        <input
          id="displayName"
          name="displayName"
          defaultValue={state.values?.displayName}
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
      </div>

      <button type="submit" disabled={pending} className={submitClass}>
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
