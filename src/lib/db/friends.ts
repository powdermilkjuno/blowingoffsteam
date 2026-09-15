import { and, eq, inArray, or } from "drizzle-orm";
import { getDb } from "./index";
import { toProfile, type Profile } from "./profiles";
import { friendships, profiles } from "./schema";

export type FriendRequest = {
  profile: Profile;
  createdAt: Date;
};

export type AddFriendResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

export type FriendshipStatus = "none" | "accepted" | "outgoing" | "incoming";

function pair(a: string, b: string) {
  return or(
    and(eq(friendships.requesterId, a), eq(friendships.addresseeId, b)),
    and(eq(friendships.requesterId, b), eq(friendships.addresseeId, a)),
  );
}

export async function sendFriendRequest(
  profileId: string,
  friendCode: string,
): Promise<AddFriendResult> {
  const db = getDb();
  const code = friendCode.trim().toUpperCase();

  const [target] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.friendCode, code))
    .limit(1);

  if (!target) return { ok: false, error: "No user has that friend code." };
  return sendFriendRequestToProfile(profileId, toProfile(target));
}

export async function sendFriendRequestToProfile(
  profileId: string,
  target: Profile | string,
): Promise<AddFriendResult> {
  const db = getDb();
  let person: Profile | null;
  if (typeof target === "string") {
    const [row] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, target))
      .limit(1);
    person = row ? toProfile(row) : null;
  } else {
    person = target;
  }

  if (!person) return { ok: false, error: "That person is not on Blowing Off Steam." };
  if (person.id === profileId) {
    return { ok: false, error: "That is you." };
  }

  const [existing] = await db
    .select()
    .from(friendships)
    .where(pair(profileId, person.id))
    .limit(1);

  if (existing?.status === "accepted") {
    return { ok: false, error: `You are already friends with ${person.displayName}.` };
  }
  if (existing?.status === "pending") {
    return existing.requesterId === profileId
      ? { ok: false, error: "You already sent them a request." }
      : { ok: false, error: "They already sent you a request — check your invites." };
  }

  await db.insert(friendships).values({
    requesterId: profileId,
    addresseeId: person.id,
  });

  return { ok: true, profile: person };
}

export async function acceptFriendRequest(
  profileId: string,
  requesterId: string,
): Promise<void> {
  await getDb()
    .update(friendships)
    .set({ status: "accepted", respondedAt: new Date() })
    .where(
      and(
        eq(friendships.requesterId, requesterId),
        eq(friendships.addresseeId, profileId),
        eq(friendships.status, "pending"),
      ),
    );
}

export async function removeFriendship(
  profileId: string,
  otherProfileId: string,
): Promise<void> {
  await getDb().delete(friendships).where(pair(profileId, otherProfileId));
}

export async function listFriends(profileId: string): Promise<Profile[]> {
  const db = getDb();

  const asRequester = await db
    .select({ profile: profiles })
    .from(friendships)
    .innerJoin(profiles, eq(profiles.id, friendships.addresseeId))
    .where(
      and(
        eq(friendships.requesterId, profileId),
        eq(friendships.status, "accepted"),
      ),
    );

  const asAddressee = await db
    .select({ profile: profiles })
    .from(friendships)
    .innerJoin(profiles, eq(profiles.id, friendships.requesterId))
    .where(
      and(
        eq(friendships.addresseeId, profileId),
        eq(friendships.status, "accepted"),
      ),
    );

  return [...asRequester, ...asAddressee]
    .map((row) => toProfile(row.profile))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function listIncomingRequests(
  profileId: string,
): Promise<FriendRequest[]> {
  const rows = await getDb()
    .select({ profile: profiles, createdAt: friendships.createdAt })
    .from(friendships)
    .innerJoin(profiles, eq(profiles.id, friendships.requesterId))
    .where(
      and(
        eq(friendships.addresseeId, profileId),
        eq(friendships.status, "pending"),
      ),
    );

  return rows.map((row) => ({
    profile: toProfile(row.profile),
    createdAt: row.createdAt,
  }));
}

export async function listOutgoingRequests(
  profileId: string,
): Promise<FriendRequest[]> {
  const rows = await getDb()
    .select({ profile: profiles, createdAt: friendships.createdAt })
    .from(friendships)
    .innerJoin(profiles, eq(profiles.id, friendships.addresseeId))
    .where(
      and(
        eq(friendships.requesterId, profileId),
        eq(friendships.status, "pending"),
      ),
    );

  return rows.map((row) => ({
    profile: toProfile(row.profile),
    createdAt: row.createdAt,
  }));
}

export async function areFriends(
  profileId: string,
  otherProfileId: string,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ status: friendships.status })
    .from(friendships)
    .where(and(pair(profileId, otherProfileId), eq(friendships.status, "accepted")))
    .limit(1);

  return row !== undefined;
}

export async function getFriendshipStatuses(
  profileId: string,
  otherIds: string[],
): Promise<Map<string, FriendshipStatus>> {
  const statuses = new Map<string, FriendshipStatus>(
    otherIds.map((id) => [id, "none"]),
  );
  const ids = otherIds.filter((id) => id !== profileId);
  if (ids.length === 0) return statuses;

  const rows = await getDb()
    .select()
    .from(friendships)
    .where(
      or(
        and(
          eq(friendships.requesterId, profileId),
          inArray(friendships.addresseeId, ids),
        ),
        and(
          eq(friendships.addresseeId, profileId),
          inArray(friendships.requesterId, ids),
        ),
      ),
    );

  for (const row of rows) {
    const otherId =
      row.requesterId === profileId ? row.addresseeId : row.requesterId;
    if (row.status === "accepted") {
      statuses.set(otherId, "accepted");
    } else if (row.requesterId === profileId) {
      statuses.set(otherId, "outgoing");
    } else {
      statuses.set(otherId, "incoming");
    }
  }

  return statuses;
}
