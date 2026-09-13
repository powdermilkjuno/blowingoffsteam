import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import {
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { upsertUser } from "@/lib/db/users";
import { fetchPlayerSummary, fetchPlaytime } from "@/lib/steam-api";
import { verifySteamOpenId } from "@/lib/steam-openid";

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);
  const { searchParams } = new URL(request.url);

  const steamId = await verifySteamOpenId(searchParams, appUrl);
  if (!steamId) {
    return NextResponse.redirect(new URL("/?error=steam", appUrl));
  }

  const [user, playtime] = await Promise.all([
    fetchPlayerSummary(steamId),
    fetchPlaytime(steamId),
  ]);

  await upsertUser({
    id: user.steamId,
    name: user.displayName,
    avatarUrl: user.avatarUrl,
    playtimeMinutes: playtime.minutes,
    playtimePublic: playtime.isPublic,
  });

  const response = NextResponse.redirect(new URL("/", appUrl));
  response.cookies.set(
    SESSION_COOKIE,
    encodeSession(user),
    sessionCookieOptions(),
  );

  return response;
}
