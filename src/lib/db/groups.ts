import { randomInt } from "crypto";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { sumDailyMinutes } from "./daily";
import { getDb } from "./index";
import { toProfile, type Profile } from "./profiles";
import {
  isGroupAccent,
  resolveGroupAccent,
  type GroupAccent,
} from "../group-accent";
import { ownsItem } from "./shop";
import { accentItemId, getShopItem } from "../shop-catalog";
import {
  groupDailyScores,
  groupMembers,
  groups,
  profiles,
} from "./schema";

const INVITE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const INVITE_TOKEN_LENGTH = 12;
const MAX_GROUP_NAME = 48;
export const GROUP_DESCRIPTION_MAX = 120;

export type GroupRole = "owner" | "co_owner" | "member";

export type Group = {
  id: string;
  name: string;
  inviteToken: string;
  ownerProfileId: string;
  timeZone: string;
  description: string;
  accent: GroupAccent;
  createdAt: Date;
};

export type GroupListItem = Group & {
  memberCount: number;
  myPoints: number;
  role: GroupRole;
  favorited: boolean;
};

export type GroupMembership = {
  groupId: string;
  profileId: string;
  role: GroupRole;
  status: "pending" | "accepted";
  favorited: boolean;
};

export type GroupMemberRow = {
  profile: Profile;
  role: GroupRole;
  status: "pending" | "accepted";
};

export type GroupJoinRequest = {
  group: Group;
  profile: Profile;
  createdAt: Date;
};

export type GroupResult<T> = { ok: true; value: T } | { ok: false; error: string };

export type RankedMember = {
  profile: Profile;
  minutes: number;
  place: number;
  points: number;
};

function generateInviteToken(): string {
  let token = "";
  for (let i = 0; i < INVITE_TOKEN_LENGTH; i += 1) {
    token += INVITE_ALPHABET[randomInt(INVITE_ALPHABET.length)];
  }
  return token;
}

function asRole(raw: string): GroupRole {
  if (raw === "owner" || raw === "co_owner") return raw;
  return "member";
}

export function isOwner(role: GroupRole): boolean {
  return role === "owner";
}

export function canManageGroup(role: GroupRole): boolean {
  return role === "owner" || role === "co_owner";
}

function toGroup(row: typeof groups.$inferSelect): Group {
  return {
    id: row.id,
    name: row.name,
    inviteToken: row.inviteToken,
    ownerProfileId: row.ownerProfileId,
    timeZone: row.timeZone,
    description: row.description ?? "",
    accent: resolveGroupAccent(row.accent),
    createdAt: row.createdAt,
  };
}

export function validateGroupName(raw: string): string | null {
  const name = raw.trim();
  if (name.length < 2) return "Name must be at least 2 characters.";
  if (name.length > MAX_GROUP_NAME) {
    return `Name must be ${MAX_GROUP_NAME} characters or fewer.`;
  }
  return null;
}

export function normalizeGroupDescription(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function validateGroupDescription(raw: string): string | null {
  const description = normalizeGroupDescription(raw);
  if (description.length > GROUP_DESCRIPTION_MAX) {
    return `Description must be ${GROUP_DESCRIPTION_MAX} characters or fewer.`;
  }
  return null;
}

export async function createGroup(input: {
  ownerProfileId: string;
  name: string;
  timeZone: string;
}): Promise<GroupResult<Group>> {
  const nameError = validateGroupName(input.name);
  if (nameError) return { ok: false, error: nameError };

  const db = getDb();
  const name = input.name.trim();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteToken = generateInviteToken();
    try {
      const [created] = await db
        .insert(groups)
        .values({
          name,
          inviteToken,
          ownerProfileId: input.ownerProfileId,
          timeZone: input.timeZone,
        })
        .returning();

      await db.insert(groupMembers).values({
        groupId: created.id,
        profileId: input.ownerProfileId,
        role: "owner",
        status: "accepted",
        respondedAt: new Date(),
      });

      return { ok: true, value: toGroup(created) };
    } catch {
      // Unique invite token collision — retry.
    }
  }

  return { ok: false, error: "Could not create a group. Try again." };
}

export async function getGroupById(groupId: string): Promise<Group | null> {
  const [row] = await getDb()
    .select()
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return row ? toGroup(row) : null;
}

export async function getGroupByToken(token: string): Promise<Group | null> {
  const [row] = await getDb()
    .select()
    .from(groups)
    .where(eq(groups.inviteToken, token.trim().toUpperCase()))
    .limit(1);
  return row ? toGroup(row) : null;
}

export async function getMembership(
  groupId: string,
  profileId: string,
): Promise<GroupMembership | null> {
  const [row] = await getDb()
    .select()
    .from(groupMembers)
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.profileId, profileId)),
    )
    .limit(1);

  if (!row) return null;
  return {
    groupId: row.groupId,
    profileId: row.profileId,
    role: asRole(row.role),
    status: row.status as "pending" | "accepted",
    favorited: row.favorited,
  };
}

export async function listGroupsForProfile(
  profileId: string,
): Promise<GroupListItem[]> {
  const db = getDb();
  const rows = await db
    .select({
      group: groups,
      role: groupMembers.role,
      favorited: groupMembers.favorited,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(
      and(
        eq(groupMembers.profileId, profileId),
        eq(groupMembers.status, "accepted"),
      ),
    );

  if (rows.length === 0) return [];

  const groupIds = rows.map((row) => row.group.id);

  const [counts, points] = await Promise.all([
    db
      .select({
        groupId: groupMembers.groupId,
        members: count(),
      })
      .from(groupMembers)
      .where(
        and(
          inArray(groupMembers.groupId, groupIds),
          eq(groupMembers.status, "accepted"),
        ),
      )
      .groupBy(groupMembers.groupId),
    db
      .select({
        groupId: groupDailyScores.groupId,
        points: sql<number>`coalesce(sum(${groupDailyScores.points}), 0)::int`,
      })
      .from(groupDailyScores)
      .where(
        and(
          inArray(groupDailyScores.groupId, groupIds),
          eq(groupDailyScores.profileId, profileId),
        ),
      )
      .groupBy(groupDailyScores.groupId),
  ]);

  const countByGroup = new Map(counts.map((row) => [row.groupId, row.members]));
  const pointsByGroup = new Map(points.map((row) => [row.groupId, row.points]));

  return rows
    .map((row) => ({
      ...toGroup(row.group),
      memberCount: countByGroup.get(row.group.id) ?? 0,
      myPoints: pointsByGroup.get(row.group.id) ?? 0,
      role: asRole(row.role),
      favorited: row.favorited,
    }))
    .sort((a, b) => {
      if (a.favorited !== b.favorited) return a.favorited ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export async function listPendingJoinsForOwner(
  ownerProfileId: string,
): Promise<GroupJoinRequest[]> {
  const rows = await getDb()
    .select({
      group: groups,
      profile: profiles,
      createdAt: groupMembers.createdAt,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .innerJoin(profiles, eq(profiles.id, groupMembers.profileId))
    .where(
      and(
        eq(groups.ownerProfileId, ownerProfileId),
        eq(groupMembers.status, "pending"),
      ),
    );

  return rows
    .map((row) => ({
      group: toGroup(row.group),
      profile: toProfile(row.profile),
      createdAt: row.createdAt,
    }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function listAcceptedMembers(
  groupId: string,
): Promise<GroupMemberRow[]> {
  const rows = await getDb()
    .select({
      profile: profiles,
      role: groupMembers.role,
      status: groupMembers.status,
    })
    .from(groupMembers)
    .innerJoin(profiles, eq(profiles.id, groupMembers.profileId))
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "accepted")),
    );

  return rows
    .map((row) => ({
      profile: toProfile(row.profile),
      role: asRole(row.role),
      status: row.status as "pending" | "accepted",
    }))
    .sort((a, b) => a.profile.displayName.localeCompare(b.profile.displayName));
}

export async function listPendingMembers(
  groupId: string,
): Promise<GroupMemberRow[]> {
  const rows = await getDb()
    .select({
      profile: profiles,
      role: groupMembers.role,
      status: groupMembers.status,
    })
    .from(groupMembers)
    .innerJoin(profiles, eq(profiles.id, groupMembers.profileId))
    .where(
      and(eq(groupMembers.groupId, groupId), eq(groupMembers.status, "pending")),
    );

  return rows.map((row) => ({
    profile: toProfile(row.profile),
    role: asRole(row.role),
    status: row.status as "pending" | "accepted",
  }));
}

export async function requestJoin(
  profileId: string,
  token: string,
): Promise<GroupResult<{ group: Group; status: "pending" | "accepted" }>> {
  const group = await getGroupByToken(token);
  if (!group) return { ok: false, error: "That invite link is not valid." };

  const existing = await getMembership(group.id, profileId);
  if (existing?.status === "accepted") {
    return { ok: true, value: { group, status: "accepted" } };
  }
  if (existing?.status === "pending") {
    return { ok: true, value: { group, status: "pending" } };
  }

  await getDb().insert(groupMembers).values({
    groupId: group.id,
    profileId,
    role: "member",
    status: "pending",
  });

  return { ok: true, value: { group, status: "pending" } };
}

export async function acceptJoinRequest(
  ownerProfileId: string,
  groupId: string,
  profileId: string,
): Promise<GroupResult<true>> {
  const group = await getGroupById(groupId);
  if (!group || group.ownerProfileId !== ownerProfileId) {
    return { ok: false, error: "Only the group owner can accept joins." };
  }

  const updated = await getDb()
    .update(groupMembers)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
        eq(groupMembers.status, "pending"),
      ),
    )
    .returning({ profileId: groupMembers.profileId });

  if (updated.length === 0) {
    return { ok: false, error: "That join request is no longer pending." };
  }
  return { ok: true, value: true };
}

export async function declineJoinRequest(
  ownerProfileId: string,
  groupId: string,
  profileId: string,
): Promise<GroupResult<true>> {
  const group = await getGroupById(groupId);
  if (!group || group.ownerProfileId !== ownerProfileId) {
    return { ok: false, error: "Only the group owner can decline joins." };
  }

  await getDb()
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
        eq(groupMembers.status, "pending"),
      ),
    );
  return { ok: true, value: true };
}

export async function leaveGroup(
  profileId: string,
  groupId: string,
): Promise<GroupResult<true>> {
  const membership = await getMembership(groupId, profileId);
  if (!membership || membership.status !== "accepted") {
    return { ok: false, error: "You are not in that group." };
  }
  if (membership.role === "owner") {
    return { ok: false, error: "Owners cannot leave. Delete the group instead." };
  }

  await getDb()
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
      ),
    );
  return { ok: true, value: true };
}

export async function toggleFavoriteGroup(
  profileId: string,
  groupId: string,
): Promise<GroupResult<boolean>> {
  const membership = await getMembership(groupId, profileId);
  if (!membership || membership.status !== "accepted") {
    return { ok: false, error: "You are not in that group." };
  }

  const next = !membership.favorited;
  await getDb()
    .update(groupMembers)
    .set({ favorited: next })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
      ),
    );
  return { ok: true, value: next };
}

export async function deleteGroup(
  ownerProfileId: string,
  groupId: string,
): Promise<GroupResult<true>> {
  const group = await getGroupById(groupId);
  if (!group || group.ownerProfileId !== ownerProfileId) {
    return { ok: false, error: "Only the group owner can delete it." };
  }

  await getDb().delete(groups).where(eq(groups.id, groupId));
  return { ok: true, value: true };
}

export async function rotateInviteToken(
  ownerProfileId: string,
  groupId: string,
): Promise<GroupResult<Group>> {
  const group = await getGroupById(groupId);
  if (!group || group.ownerProfileId !== ownerProfileId) {
    return { ok: false, error: "Only the group owner can rotate the link." };
  }

  const db = getDb();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteToken = generateInviteToken();
    try {
      const [updated] = await db
        .update(groups)
        .set({ inviteToken })
        .where(eq(groups.id, groupId))
        .returning();
      return { ok: true, value: toGroup(updated) };
    } catch {
      // Unique collision.
    }
  }
  return { ok: false, error: "Could not rotate the link. Try again." };
}

export async function setMemberRole(
  actorId: string,
  groupId: string,
  profileId: string,
  role: "co_owner" | "member",
): Promise<GroupResult<true>> {
  const actor = await getMembership(groupId, actorId);
  if (!actor || actor.status !== "accepted" || actor.role !== "owner") {
    return { ok: false, error: "Only the group owner can change roles." };
  }
  if (profileId === actorId) {
    return { ok: false, error: "You cannot change your own role." };
  }

  const target = await getMembership(groupId, profileId);
  if (!target || target.status !== "accepted") {
    return { ok: false, error: "That person is not in the group." };
  }
  if (target.role === "owner") {
    return { ok: false, error: "The owner cannot be demoted." };
  }

  await getDb()
    .update(groupMembers)
    .set({ role })
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
      ),
    );
  return { ok: true, value: true };
}

export async function kickMember(
  actorId: string,
  groupId: string,
  profileId: string,
): Promise<GroupResult<true>> {
  const actor = await getMembership(groupId, actorId);
  if (!actor || actor.status !== "accepted" || actor.role !== "owner") {
    return { ok: false, error: "Only the group owner can kick members." };
  }
  if (profileId === actorId) {
    return { ok: false, error: "You cannot kick yourself." };
  }

  const target = await getMembership(groupId, profileId);
  if (!target || target.status !== "accepted") {
    return { ok: false, error: "That person is not in the group." };
  }
  if (target.role === "owner") {
    return { ok: false, error: "The owner cannot be kicked." };
  }

  await getDb()
    .delete(groupMembers)
    .where(
      and(
        eq(groupMembers.groupId, groupId),
        eq(groupMembers.profileId, profileId),
      ),
    );
  return { ok: true, value: true };
}

export async function updateGroupPresentation(
  actorId: string,
  groupId: string,
  input: { description: string; accent: string },
): Promise<GroupResult<Group>> {
  const actor = await getMembership(groupId, actorId);
  if (!actor || actor.status !== "accepted" || !canManageGroup(actor.role)) {
    return {
      ok: false,
      error: "Only the owner or a co-owner can edit the group.",
    };
  }

  const description = normalizeGroupDescription(input.description);
  const descriptionError = validateGroupDescription(description);
  if (descriptionError) return { ok: false, error: descriptionError };
  if (!isGroupAccent(input.accent)) {
    return { ok: false, error: "Choose a valid accent color." };
  }
  const accentItem = getShopItem(accentItemId(input.accent));
  if (!accentItem) {
    return { ok: false, error: "Choose a valid accent color." };
  }
  const owned = await ownsItem(actorId, accentItem);
  if (!owned) {
    return { ok: false, error: "Unlock that color in the Shop first." };
  }

  const [updated] = await getDb()
    .update(groups)
    .set({ description, accent: input.accent })
    .where(eq(groups.id, groupId))
    .returning();

  if (!updated) return { ok: false, error: "That group no longer exists." };
  return { ok: true, value: toGroup(updated) };
}

export async function getLatestScoreDay(groupId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({
      day: sql<string>`max(${groupDailyScores.day})::text`,
    })
    .from(groupDailyScores)
    .where(eq(groupDailyScores.groupId, groupId));

  return row?.day ?? null;
}

export async function listMemberPoints(
  groupId: string,
): Promise<Map<string, number>> {
  const rows = await getDb()
    .select({
      profileId: groupDailyScores.profileId,
      points: sql<number>`coalesce(sum(${groupDailyScores.points}), 0)::int`,
    })
    .from(groupDailyScores)
    .where(eq(groupDailyScores.groupId, groupId))
    .groupBy(groupDailyScores.profileId);

  return new Map(rows.map((row) => [row.profileId, row.points]));
}

export async function listScoresForDay(
  groupId: string,
  day: string,
): Promise<
  {
    profileId: string;
    place: number;
    minutes: number;
    points: number;
  }[]
> {
  return getDb()
    .select({
      profileId: groupDailyScores.profileId,
      place: groupDailyScores.place,
      minutes: groupDailyScores.minutes,
      points: groupDailyScores.points,
    })
    .from(groupDailyScores)
    .where(
      and(eq(groupDailyScores.groupId, groupId), eq(groupDailyScores.day, day)),
    );
}

export async function rankMembersForDay(
  members: GroupMemberRow[],
  day: string,
): Promise<RankedMember[]> {
  const minutes = await Promise.all(
    members.map(async (member) => ({
      member,
      minutes: await sumDailyMinutes({
        profileId: member.profile.id,
        fromDay: day,
        toDay: day,
      }),
    })),
  );

  return assignPlaces(minutes.map((row) => ({
    profile: row.member.profile,
    minutes: row.minutes,
  })));
}

export function pointsForPlace(place: number): number {
  if (place === 1) return 5;
  if (place === 2) return 3;
  if (place === 3) return 1;
  return 0;
}

export function assignPlaces(
  rows: { profile: Profile; minutes: number }[],
): RankedMember[] {
  const sorted = [...rows].sort((a, b) => {
    const byMinutes = a.minutes - b.minutes;
    if (byMinutes !== 0) return byMinutes;
    return a.profile.displayName.localeCompare(b.profile.displayName);
  });

  const ranked: RankedMember[] = [];
  let index = 0;
  while (index < sorted.length) {
    const minutes = sorted[index].minutes;
    let end = index;
    while (end < sorted.length && sorted[end].minutes === minutes) {
      end += 1;
    }
    const place = index + 1;
    const points = pointsForPlace(place);
    for (let i = index; i < end; i += 1) {
      ranked.push({
        profile: sorted[i].profile,
        minutes: sorted[i].minutes,
        place,
        points,
      });
    }
    index = end;
  }
  return ranked;
}

export async function listAllGroups(): Promise<Group[]> {
  const rows = await getDb().select().from(groups);
  return rows.map(toGroup);
}
