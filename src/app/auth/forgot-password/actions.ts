"use server";

import { resolveAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth/server";

export type ForgotPasswordState = { error?: string; success?: string };

export async function requestPasswordResetAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email address." };

  const { error } = await auth.requestPasswordReset({
    email,
    redirectTo: `${await resolveAppUrl()}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message ?? "Could not send the email." };
  }

  // Deliberately the same message whether or not the address exists.
  return {
    success: "If that email has an account, a reset link is on its way.",
  };
}
