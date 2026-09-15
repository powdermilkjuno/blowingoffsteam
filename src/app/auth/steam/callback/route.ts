import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth/server";
import {
  getProfileByAuthUserId,
  getProfileBySteamId,
  isProfileComplete,
} from "@/lib/db/profiles";
import { syncLinkedPlaytime } from "@/lib/playtime-sync";
import { fetchPlayerSummary } from "@/lib/steam-api";
import {
  encodeTicket,
  STEAM_TICKET_COOKIE,
  ticketCookieOptions,
} from "@/lib/steam-ticket";
import { verifySteamOpenId } from "@/lib/steam-openid";

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);
  const { searchParams } = new URL(request.url);

  const steamId = await verifySteamOpenId(searchParams, appUrl);
  if (!steamId) {
    return NextResponse.redirect(new URL("/login?error=steam", appUrl));
  }

  const { data: session } = await auth.getSession();
  const linkedProfile = await getProfileBySteamId(steamId);

  const summary = await fetchPlayerSummary(steamId);

  const ticketCookie = encodeTicket({
    steamId,
    displayName: summary.displayName,
    avatarUrl: summary.avatarUrl,
    profileUrl: summary.profileUrl,
    issuedAt: Date.now(),
  });

  // Signed in: this is a link (or a re-sync of an already linked account).
  if (session?.user) {
    const profile = await getProfileByAuthUserId(session.user.id);

    // Session but no profile yet — keep the Steam ticket and finish setup.
    if (!profile) {
      const response = NextResponse.redirect(new URL("/onboarding", appUrl));
      response.cookies.set(STEAM_TICKET_COOKIE, ticketCookie, ticketCookieOptions());
      return response;
    }

    if (linkedProfile && linkedProfile.id !== profile.id) {
      return NextResponse.redirect(
        new URL("/dashboard?error=steam_taken", appUrl),
      );
    }

    await syncLinkedPlaytime({
      profileId: profile.id,
      steamId,
      profileUrl: summary.profileUrl,
    });

    return NextResponse.redirect(
      new URL(isProfileComplete(profile) ? "/dashboard" : "/onboarding", appUrl),
    );
  }

  // Steam cannot mint a session, so an existing account still has to enter its
  // password. Carry the verified identity over so the sign-in page can greet
  // them by name and prefill the email instead of showing an error.
  const destination = linkedProfile ? "/login" : "/onboarding";
  const response = NextResponse.redirect(new URL(destination, appUrl));
  response.cookies.set(STEAM_TICKET_COOKIE, ticketCookie, ticketCookieOptions());
  return response;
}
