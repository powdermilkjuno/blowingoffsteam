import { and, eq, or } from "drizzle-orm";
import { getDb } from "./index";
import type { Profile } from "./profiles";
import { friendships, profiles } from "./schema";

export type FriendRequest = {
  profile: Profile;
  createdAt: Date;
};

export type AddFriendResult =
  | { ok: true; profile: Profile }
  | { ok: false; error: string };

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
  if (target.id === profileId) {
    return { ok: false, error: "That is your own friend code." };
  }

  const [existing] = await db
    .select()
    .from(friendships)
    .where(pair(profileId, target.id))
    .limit(1);

  if (existing?.status === "accepted") {
    return { ok: false, error: `You are already friends with ${target.displayName}.` };
  }
  if (existing?.status === "pending") {
    return existing.requesterId === profileId
      ? { ok: false, error: "You already sent them a request." }
      : { ok: false, error: "They already sent you a request — check your invites." };
  }

  await db.insert(friendships).values({
    requesterId: profileId,
    addresseeId: target.id,
  });

  return { ok: true, profile: target };
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
    .map((row) => row.profile)
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

  return rows;
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

  return rows;
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
