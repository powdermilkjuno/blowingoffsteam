import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import {
  encodeSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/session";
import { fetchPlayerSummary } from "@/lib/steam-api";
import { verifySteamOpenId } from "@/lib/steam-openid";

export async function GET(request: Request) {
  const appUrl = getAppUrl(request);
  const { searchParams } = new URL(request.url);

  const steamId = await verifySteamOpenId(searchParams, appUrl);
  if (!steamId) {
    return NextResponse.redirect(new URL("/?error=steam", appUrl));
  }

  const user = await fetchPlayerSummary(steamId);
  const response = NextResponse.redirect(new URL("/", appUrl));
  response.cookies.set(
    SESSION_COOKIE,
    encodeSession(user),
    sessionCookieOptions(),
  );

  return response;
}
