"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { safeAppPath } from "@/lib/app-url";
import {
  clearedTicketCookieOptions,
  STEAM_TICKET_COOKIE,
} from "@/lib/steam-ticket";

export type SignInState = { error?: string };

export async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const { error } = await auth.signIn.email({ email, password });
  if (error) {
    return { error: error.message ?? "Could not sign you in." };
  }

  const store = await cookies();
  store.set(STEAM_TICKET_COOKIE, "", clearedTicketCookieOptions());

  redirect(safeAppPath(formData.get("next")) ?? "/dashboard");
}
