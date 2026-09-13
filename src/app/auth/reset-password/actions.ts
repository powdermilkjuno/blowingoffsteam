"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";

export type ResetPasswordState = { error?: string };

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "This reset link is missing its token. Request a new one." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "The passwords do not match." };
  }

  const { error } = await auth.resetPassword({ newPassword, token });
  if (error) {
    return {
      error:
        error.message ?? "That reset link is invalid or has expired.",
    };
  }

  redirect("/auth/sign-in?reset=1");
}
