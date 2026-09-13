"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getAuthUserIdByEmail } from "@/lib/db/auth-users";
import {
  createProfile,
  getProfileByAuthUserId,
  getProfileBySteamId,
  isUsernameTaken,
  normalizeUsername,
  validateUsername,
} from "@/lib/db/profiles";
import { syncLinkedPlaytime } from "@/lib/playtime-sync";
import {
  clearedTicketCookieOptions,
  getSteamTicket,
  STEAM_TICKET_COOKIE,
} from "@/lib/steam-ticket";

export type OnboardingState = {
  error?: string;
  values?: { username: string; displayName: string; email: string };
};

function userIdFromAuthData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { user?: { id?: unknown }; userId?: unknown };
  if (typeof record.user?.id === "string") return record.user.id;
  if (typeof record.userId === "string") return record.userId;
  return null;
}

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const values = { username, displayName, email };

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError, values };
  if (!displayName) return { error: "Enter a display name.", values };
  if (await isUsernameTaken(username)) {
    return { error: "That username is taken.", values };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }

  const ticket = await getSteamTicket();
  if (!ticket) {
    redirect("/auth/steam/login");
  }

  const { data: existingSession } = await auth.getSession();

  // Already signed in (stale Google session, etc.) — attach the Steam-first
  // profile instead of creating a second Neon Auth user.
  if (existingSession?.user) {
    const existingProfile = await getProfileByAuthUserId(existingSession.user.id);
    if (existingProfile) redirect("/dashboard");

    await createProfile({
      authUserId: existingSession.user.id,
      username: normalizeUsername(username),
      displayName,
      avatarUrl: ticket.avatarUrl,
    });

    await linkSteamAndSync(
      existingSession.user.id,
      ticket.steamId,
      ticket.profileUrl,
    );
    await clearTicket();
    redirect("/dashboard");
  }

  if (await getProfileBySteamId(ticket.steamId)) {
    return {
      error: "That Steam account was just linked elsewhere. Sign in instead.",
      values,
    };
  }

  // Drop leftover cookies from a wiped test user so they cannot shadow the
  // session that sign-up is about to set.
  await auth.signOut();

  const { data: signUpData, error: signUpError } = await auth.signUp.email({
    email,
    password,
    name: displayName,
  });

  // signUp.email sets the session on the outgoing response. getSession() in
  // this same action still reads the incoming request, so it looks logged out
  // even when the account was created. Use the signup payload, then sign-in.
  let authUserId = userIdFromAuthData(signUpData);

  if (!authUserId) {
    const { data: signInData, error: signInError } = await auth.signIn.email({
      email,
      password,
    });
    authUserId = userIdFromAuthData(signInData);

    if (!authUserId) {
      authUserId = await getAuthUserIdByEmail(email);
    }

    if (!authUserId) {
      return {
        error:
          signUpError?.message ??
          signInError?.message ??
          "Could not create your account.",
        values,
      };
    }
  }

  const existingProfile = await getProfileByAuthUserId(authUserId);
  if (!existingProfile) {
    await createProfile({
      authUserId,
      username: normalizeUsername(username),
      displayName,
      avatarUrl: ticket.avatarUrl,
    });
  }

  await linkSteamAndSync(authUserId, ticket.steamId, ticket.profileUrl);
  await clearTicket();

  redirect("/dashboard");
}

async function linkSteamAndSync(
  authUserId: string,
  steamId: string,
  profileUrl: string,
) {
  const profile = await getProfileByAuthUserId(authUserId);
  if (!profile) return;

  await syncLinkedPlaytime({
    profileId: profile.id,
    steamId,
    profileUrl,
  });
}

async function clearTicket() {
  const store = await cookies();
  store.set(STEAM_TICKET_COOKIE, "", clearedTicketCookieOptions());
}
