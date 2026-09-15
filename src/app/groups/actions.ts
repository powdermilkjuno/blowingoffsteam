"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { sendFriendRequestToProfile } from "@/lib/db/friends";
import {
  acceptJoinRequest,
  createGroup,
  declineJoinRequest,
  deleteGroup,
  leaveGroup,
  requestJoin,
  rotateInviteToken,
  toggleFavoriteGroup,
} from "@/lib/db/groups";
import { getProfileByAuthUserId, isProfileComplete } from "@/lib/db/profiles";

export type GroupFormState = { error?: string; success?: string };

async function requireProfile() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile || !isProfileComplete(profile)) redirect("/onboarding");

  return profile;
}

export async function createGroupAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const name = String(formData.get("name") ?? "");
  const profile = await requireProfile();
  const result = await createGroup({
    ownerProfileId: profile.id,
    name,
    timeZone: profile.timeZone,
  });

  if (!result.ok) return { error: result.error };

  revalidatePath("/groups");
  redirect(`/groups/${result.value.id}`);
}

export async function requestJoinAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const profile = await requireProfile();
  const result = await requestJoin(profile.id, token);
  if (!result.ok) {
    redirect(`/groups/join/${token}?error=${encodeURIComponent(result.error)}`);
  }
  if (result.value.status === "accepted") {
    redirect(`/groups/${result.value.group.id}`);
  }
  revalidatePath("/groups");
  redirect(`/groups/join/${result.value.group.inviteToken}`);
}

export async function acceptJoinAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!groupId || !profileId) return;

  const profile = await requireProfile();
  await acceptJoinRequest(profile.id, groupId, profileId);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
}

export async function declineJoinAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!groupId || !profileId) return;

  const profile = await requireProfile();
  await declineJoinRequest(profile.id, groupId, profileId);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
}

export async function leaveGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  const profile = await requireProfile();
  await leaveGroup(profile.id, groupId);
  revalidatePath("/groups");
  redirect("/groups");
}

export async function deleteGroupAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  const profile = await requireProfile();
  await deleteGroup(profile.id, groupId);
  revalidatePath("/groups");
  redirect("/groups");
}

export async function rotateInviteAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  const profile = await requireProfile();
  await rotateInviteToken(profile.id, groupId);
  revalidatePath(`/groups/${groupId}`);
}

export async function toggleFavoriteAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return;

  const profile = await requireProfile();
  await toggleFavoriteGroup(profile.id, groupId);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
}

export async function addGroupFriendAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const otherProfileId = String(formData.get("otherProfileId") ?? "");
  const groupId = String(formData.get("groupId") ?? "");
  if (!otherProfileId) return { error: "Missing person." };

  const profile = await requireProfile();
  const result = await sendFriendRequestToProfile(profile.id, otherProfileId);
  if (!result.ok) return { error: result.error };

  revalidatePath("/friends");
  if (groupId) revalidatePath(`/groups/${groupId}`);
  return { success: `Request sent to ${result.profile.displayName}.` };
}
