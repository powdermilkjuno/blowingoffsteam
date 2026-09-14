"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { resolveAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth/server";
import {
  getProfileByAuthUserId,
  isUsernameTaken,
  updateProfile,
  validateUsername,
} from "@/lib/db/profiles";
import { isValidTimeZone } from "@/lib/playtime-windows";

export type ProfileState = { error?: string; success?: string };
export type PasswordState = { error?: string; success?: string };

async function requireProfile() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  return { session, profile };
}

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const timeZone = String(formData.get("timeZone") ?? "UTC");

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (!displayName) return { error: "Enter a display name." };
  if (!isValidTimeZone(timeZone)) return { error: "Choose a valid time zone." };

  const { profile } = await requireProfile();

  if (await isUsernameTaken(username, profile.id)) {
    return { error: "That username is taken." };
  }

  await updateProfile(profile.id, { username, displayName, timeZone });

  // Keep the Neon Auth user's name in step with the profile.
  await auth.updateUser({ name: displayName });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/u/${profile.username}`);

  return { success: "Profile updated." };
}

export async function changePasswordAction(
  _prev: PasswordState,
  formData: FormData,
): Promise<PasswordState> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "The new passwords do not match." };
  }

  await requireProfile();

  const { error } = await auth.changePassword({
    currentPassword,
    newPassword,
    revokeOtherSessions: true,
  });

  if (error) {
    return { error: error.message ?? "Could not change your password." };
  }

  return { success: "Password changed. Other sessions were signed out." };
}

// A Google-only account has no password to verify against, so setting the first
// one goes through an emailed link rather than the session alone.
export async function sendPasswordSetupEmailAction(): Promise<PasswordState> {
  const { session } = await requireProfile();

  const email = session.user.email;
  if (!email) return { error: "Your account has no email address." };

  const { error } = await auth.requestPasswordReset({
    email,
    redirectTo: `${await resolveAppUrl()}/auth/reset-password`,
  });

  if (error) {
    return { error: error.message ?? "Could not send the email." };
  }

  return { success: `Check ${email} for a link to set your password.` };
}
