import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { buildSteamLoginUrl } from "@/lib/steam-openid";

export function GET(request: Request) {
  const appUrl = getAppUrl(request);
  return NextResponse.redirect(buildSteamLoginUrl(appUrl));
}
