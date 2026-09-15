"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { computeArchetypeBreakdown } from "@/lib/archetypes";
import { auth } from "@/lib/auth/server";
import { getAuthUserIdByEmail } from "@/lib/db/auth-users";
import {
  createProfile,
  getProfileByAuthUserId,
  getProfileBySteamId,
  isUsernameTaken,
  normalizeUsername,
  updateProfileArchetype,
  updateProfileCaps,
  validateUsername,
} from "@/lib/db/profiles";
import { hoursInputToMinutes } from "@/lib/hours";
import { isValidTimeZone } from "@/lib/playtime-windows";
import { syncLinkedPlaytime } from "@/lib/playtime-sync";
import {
  clearedTicketCookieOptions,
  getSteamTicket,
  STEAM_TICKET_COOKIE,
} from "@/lib/steam-ticket";

export type OnboardingState = {
  error?: string;
  values?: {
    username: string;
    displayName: string;
    email: string;
    timeZone: string;
    capDayHours: string;
    capWeekHours: string;
    capMonthHours: string;
  };
};

function userIdFromAuthData(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as { user?: { id?: unknown }; userId?: unknown };
  if (typeof record.user?.id === "string") return record.user.id;
  if (typeof record.userId === "string") return record.userId;
  return null;
}

function parseCaps(formData: FormData): {
  error?: string;
  caps?: {
    capDayMinutes: number;
    capWeekMinutes: number;
    capMonthMinutes: number;
  };
} {
  const capDayMinutes = hoursInputToMinutes(
    String(formData.get("capDayHours") ?? ""),
  );
  const capWeekMinutes = hoursInputToMinutes(
    String(formData.get("capWeekHours") ?? ""),
  );
  const capMonthMinutes = hoursInputToMinutes(
    String(formData.get("capMonthHours") ?? ""),
  );

  if (
    capDayMinutes == null ||
    capWeekMinutes == null ||
    capMonthMinutes == null
  ) {
    return { error: "Enter hoped max hours for day, week, and month." };
  }
  if (capDayMinutes > 24 * 60) {
    return { error: "Day cap cannot exceed 24 hours." };
  }
  if (capWeekMinutes > 168 * 60) {
    return { error: "Week cap cannot exceed 168 hours." };
  }
  if (capMonthMinutes > 744 * 60) {
    return { error: "Month cap cannot exceed 744 hours." };
  }
  return { caps: { capDayMinutes, capWeekMinutes, capMonthMinutes } };
}

export async function completeOnboardingAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const username = String(formData.get("username") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const timeZone = String(formData.get("timeZone") ?? "UTC");

  const values = {
    username,
    displayName,
    email,
    timeZone,
    capDayHours: String(formData.get("capDayHours") ?? ""),
    capWeekHours: String(formData.get("capWeekHours") ?? ""),
    capMonthHours: String(formData.get("capMonthHours") ?? ""),
  };

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError, values };
  if (!displayName) return { error: "Enter a display name.", values };
  if (await isUsernameTaken(username)) {
    return { error: "That username is taken.", values };
  }
  if (!isValidTimeZone(timeZone)) {
    return { error: "Choose a valid time zone.", values };
  }

  const parsed = parseCaps(formData);
  if (parsed.error || !parsed.caps) return { error: parsed.error, values };

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", values };
  }

  const ticket = await getSteamTicket();
  if (!ticket) {
    redirect("/auth/steam/login");
  }

  const { data: existingSession } = await auth.getSession();

  if (existingSession?.user) {
    const existingProfile = await getProfileByAuthUserId(existingSession.user.id);
    if (existingProfile) redirect("/onboarding");

    await createProfile({
      authUserId: existingSession.user.id,
      username: normalizeUsername(username),
      displayName,
      avatarUrl: ticket.avatarUrl,
      timeZone,
      ...parsed.caps,
    });

    await linkSteamAndSync(
      existingSession.user.id,
      ticket.steamId,
      ticket.profileUrl,
    );
    await clearTicket();
    redirect("/onboarding");
  }

  if (await getProfileBySteamId(ticket.steamId)) {
    return {
      error: "That Steam account was just linked elsewhere. Sign in instead.",
      values,
    };
  }

  await auth.signOut();

  const { data: signUpData, error: signUpError } = await auth.signUp.email({
    email,
    password,
    name: displayName,
  });

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
      timeZone,
      ...parsed.caps,
    });
  }

  await linkSteamAndSync(authUserId, ticket.steamId, ticket.profileUrl);
  await clearTicket();

  redirect("/onboarding");
}

export async function confirmArchetypeAction(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  if (
    profile.capDayMinutes == null ||
    profile.capWeekMinutes == null ||
    profile.capMonthMinutes == null
  ) {
    const parsed = parseCaps(formData);
    if (parsed.error || !parsed.caps) return { error: parsed.error };
    await updateProfileCaps(profile.id, parsed.caps);
  }

  const breakdown = await computeArchetypeBreakdown(profile);
  await updateProfileArchetype(profile.id, breakdown.winner);
  redirect("/dashboard");
}

export async function skipArchetypeAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  if (
    profile.capDayMinutes == null ||
    profile.capWeekMinutes == null ||
    profile.capMonthMinutes == null
  ) {
    const parsed = parseCaps(formData);
    if (parsed.error || !parsed.caps) redirect("/onboarding");
    await updateProfileCaps(profile.id, parsed.caps);
  }

  redirect("/dashboard");
}

export async function startDiagnosticAction(formData: FormData) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  if (
    profile.capDayMinutes == null ||
    profile.capWeekMinutes == null ||
    profile.capMonthMinutes == null
  ) {
    const parsed = parseCaps(formData);
    if (parsed.error || !parsed.caps) redirect("/onboarding");
    await updateProfileCaps(profile.id, parsed.caps);
  }

  redirect("/onboarding?diagnostic=1");
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
