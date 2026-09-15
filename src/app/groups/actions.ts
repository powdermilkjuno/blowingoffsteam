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
  kickMember,
  leaveGroup,
  parseInviteInput,
  requestJoin,
  rotateInviteToken,
  setMemberRole,
  toggleFavoriteGroup,
  updateGroupPresentation,
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

export async function openJoinAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const profile = await requireProfile();
  const token = parseInviteInput(String(formData.get("invite") ?? ""));
  if (!token) {
    return { error: "Enter the 12-character invite code, or paste a join link." };
  }

  const result = await requestJoin(profile.id, token);
  if (!result.ok) return { error: result.error };

  revalidatePath("/groups");
  revalidatePath(`/groups/${result.value.group.id}`);
  redirect(`/groups/${result.value.group.id}`);
}

export async function requestJoinAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  if (!token) return;

  const profile = await requireProfile();
  const parsed = parseInviteInput(token) ?? token.trim().toUpperCase();
  const result = await requestJoin(profile.id, parsed);
  if (!result.ok) {
    redirect(`/groups/join/${encodeURIComponent(token)}?error=${encodeURIComponent(result.error)}`);
  }
  revalidatePath("/groups");
  revalidatePath(`/groups/${result.value.group.id}`);
  redirect(`/groups/${result.value.group.id}`);
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
  revalidatePath("/groups");
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

export async function updateGroupPresentationAction(
  _prev: GroupFormState,
  formData: FormData,
): Promise<GroupFormState> {
  const groupId = String(formData.get("groupId") ?? "");
  if (!groupId) return { error: "Missing group." };

  const profile = await requireProfile();
  const result = await updateGroupPresentation(profile.id, groupId, {
    description: String(formData.get("description") ?? ""),
    accent: String(formData.get("accent") ?? ""),
  });
  if (!result.ok) return { error: result.error };

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
  return { success: "Group updated." };
}

export async function setMemberRoleAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  const role = String(formData.get("role") ?? "");
  if (!groupId || !profileId) return;
  if (role !== "co_owner" && role !== "member") return;

  const profile = await requireProfile();
  await setMemberRole(profile.id, groupId, profileId, role);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
}

export async function kickMemberAction(formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const profileId = String(formData.get("profileId") ?? "");
  if (!groupId || !profileId) return;

  const profile = await requireProfile();
  await kickMember(profile.id, groupId, profileId);
  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath("/dashboard");
  revalidatePath("/leaderboard");
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
