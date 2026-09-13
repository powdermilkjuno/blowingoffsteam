"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  acceptFriendRequest,
  removeFriendship,
  sendFriendRequest,
} from "@/lib/db/friends";
import { getProfileByAuthUserId, rotateFriendCode } from "@/lib/db/profiles";

export type AddFriendState = { error?: string; success?: string };

async function requireProfile() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  return profile;
}

export async function addFriendAction(
  _prev: AddFriendState,
  formData: FormData,
): Promise<AddFriendState> {
  const code = String(formData.get("friendCode") ?? "").trim();
  if (!code) return { error: "Enter a friend code." };

  const profile = await requireProfile();
  const result = await sendFriendRequest(profile.id, code);

  if (!result.ok) return { error: result.error };

  revalidatePath("/friends");
  return { success: `Request sent to ${result.profile.displayName}.` };
}

export async function acceptRequestAction(formData: FormData) {
  const requesterId = String(formData.get("requesterId") ?? "");
  if (!requesterId) return;

  const profile = await requireProfile();
  await acceptFriendRequest(profile.id, requesterId);

  revalidatePath("/friends");
}

export async function removeFriendAction(formData: FormData) {
  const otherProfileId = String(formData.get("otherProfileId") ?? "");
  if (!otherProfileId) return;

  const profile = await requireProfile();
  await removeFriendship(profile.id, otherProfileId);

  revalidatePath("/friends");
}

export async function rotateFriendCodeAction() {
  const profile = await requireProfile();
  await rotateFriendCode(profile.id);

  revalidatePath("/friends");
}
