"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  createProfile,
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from "@/lib/db/profiles";

export type SignUpState = {
  error?: string;
  values?: { username: string; displayName: string; email: string };
};

export async function signUpAction(
  _prev: SignUpState,
  formData: FormData,
): Promise<SignUpState> {
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const values = { username, displayName, email };

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError, values };
  if (!displayName) return { error: "Enter a display name.", values };
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }
  if (await isUsernameTaken(username)) {
    return { error: "That username is taken.", values };
  }

  const { error } = await auth.signUp.email({ email, password, name: displayName });
  if (error) {
    return { error: error.message ?? "Could not create your account.", values };
  }

  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return { error: "Account created, but the session did not start. Sign in.", values };
  }

  await createProfile({
    authUserId: session.user.id,
    username: normalizeUsername(username),
    displayName,
    avatarUrl: "",
  });

  redirect("/onboarding");
}
