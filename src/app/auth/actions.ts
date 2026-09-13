"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  clearedTicketCookieOptions,
  STEAM_TICKET_COOKIE,
} from "@/lib/steam-ticket";

export async function signOutAction() {
  await auth.signOut();

  const store = await cookies();
  store.set(STEAM_TICKET_COOKIE, "", clearedTicketCookieOptions());

  redirect("/");
}
