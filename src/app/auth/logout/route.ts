import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/app-url";
import { SESSION_COOKIE } from "@/lib/session";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", getAppUrl(request)));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
