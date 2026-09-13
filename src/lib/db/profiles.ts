import { randomInt } from "crypto";
import { desc, eq } from "drizzle-orm";
import type { GamePlaytime, Playtime } from "../steam-api";
import { steamGameIconUrl } from "../steam-api";
import { getDb } from "./index";
import { gamePlaytime, profiles, steamLinks } from "./schema";
import { appendDailySnapshot } from "./snapshots";

// Crockford-style alphabet: no I, L, O or U, so codes can be read aloud.
const FRIEND_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const FRIEND_CODE_LENGTH = 8;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "friends",
  "onboarding",
  "settings",
  "support",
  "u",
]);

const STALE_AFTER_MS = 15 * 60 * 1000;

export type Profile = {
  id: string;
  authUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  friendCode: string;
};

export type SteamLink = {
  steamId: string;
  profileUrl: string;
  playtimeMinutes: number;
  playtimePublic: boolean;
  syncedAt: Date;
};

export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours.toLocaleString()}h`;
  return `${hours.toLocaleString()}h ${mins}m`;
}

export function generateFriendCode(): string {
  let code = "";
  for (let i = 0; i < FRIEND_CODE_LENGTH; i += 1) {
    code += FRIEND_CODE_ALPHABET[randomInt(FRIEND_CODE_ALPHABET.length)];
  }
  return code;
}

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (username.length < 3 || username.length > 20) {
    return "Username must be 3-20 characters.";
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return "Username can only use letters, numbers and underscores.";
  }
  if (RESERVED_USERNAMES.has(username)) {
    return "That username is reserved.";
  }
  return null;
}

export function suggestUsername(displayName: string, steamId: string): string {
  const base = normalizeUsername(displayName).replace(/[^a-z0-9_]/g, "");
  if (base.length >= 3) return base.slice(0, 20);
  return `player_${steamId.slice(-6)}`;
}

export async function getProfileByAuthUserId(
  authUserId: string,
): Promise<Profile | null> {
  const [row] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, authUserId))
    .limit(1);

  return row ?? null;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const [row] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.username, normalizeUsername(username)))
    .limit(1);

  return row ?? null;
}

export async function isUsernameTaken(
  username: string,
  excludeProfileId?: string,
): Promise<boolean> {
  const existing = await getProfileByUsername(username);
  if (!existing) return false;
  return existing.id !== excludeProfileId;
}

export async function updateProfile(
  profileId: string,
  input: { username: string; displayName: string },
): Promise<Profile> {
  const [row] = await getDb()
    .update(profiles)
    .set({
      username: normalizeUsername(input.username),
      displayName: input.displayName,
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return row;
}

export async function createProfile(input: {
  authUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
}): Promise<Profile> {
  const db = getDb();

  // Retry only guards against a friend-code collision; any other failure is real.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const [row] = await db
        .insert(profiles)
        .values({
          authUserId: input.authUserId,
          username: normalizeUsername(input.username),
          displayName: input.displayName,
          avatarUrl: input.avatarUrl,
          friendCode: generateFriendCode(),
        })
        .returning();

      return row;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("friend_code")) throw error;
    }
  }

  throw new Error("Could not allocate a unique friend code");
}

export async function rotateFriendCode(profileId: string): Promise<string> {
  const db = getDb();

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const friendCode = generateFriendCode();
    try {
      const [row] = await db
        .update(profiles)
        .set({ friendCode })
        .where(eq(profiles.id, profileId))
        .returning();

      return row.friendCode;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("friend_code")) throw error;
    }
  }

  throw new Error("Could not allocate a unique friend code");
}

export async function getSteamLink(
  profileId: string,
): Promise<SteamLink | null> {
  const [row] = await getDb()
    .select()
    .from(steamLinks)
    .where(eq(steamLinks.profileId, profileId))
    .limit(1);

  return row ?? null;
}

export async function getProfileBySteamId(
  steamId: string,
): Promise<Profile | null> {
  const [row] = await getDb()
    .select({ profile: profiles })
    .from(steamLinks)
    .innerJoin(profiles, eq(profiles.id, steamLinks.profileId))
    .where(eq(steamLinks.steamId, steamId))
    .limit(1);

  return row?.profile ?? null;
}

export async function getProfileGames(
  profileId: string,
): Promise<GamePlaytime[]> {
  const rows = await getDb()
    .select()
    .from(gamePlaytime)
    .where(eq(gamePlaytime.profileId, profileId))
    .orderBy(desc(gamePlaytime.playtimeForever));

  return rows.map((row) => ({
    appId: row.appId,
    name: row.name,
    playtimeMinutes: row.playtimeForever,
    playtimeTwoWeeksMinutes: row.playtimeTwoWeeks,
    lastPlayedAt: row.lastPlayedAt,
    iconHash: row.iconHash,
    iconUrl: steamGameIconUrl(row.appId, row.iconHash),
  }));
}

export async function saveSteamPlaytime(input: {
  profileId: string;
  steamId: string;
  profileUrl: string;
  playtime: Playtime;
}): Promise<void> {
  const db = getDb();
  const syncedAt = new Date();

  await db
    .insert(steamLinks)
    .values({
      profileId: input.profileId,
      steamId: input.steamId,
      profileUrl: input.profileUrl,
      playtimeMinutes: input.playtime.minutes,
      playtimePublic: input.playtime.isPublic,
      syncedAt,
    })
    .onConflictDoUpdate({
      target: steamLinks.profileId,
      set: {
        steamId: input.steamId,
        profileUrl: input.profileUrl,
        playtimeMinutes: input.playtime.minutes,
        playtimePublic: input.playtime.isPublic,
        syncedAt,
      },
    });

  // A private profile returns no games; keep the previous snapshot rather than
  // wiping the library every time Steam hides it.
  if (!input.playtime.isPublic) return;

  await db.delete(gamePlaytime).where(eq(gamePlaytime.profileId, input.profileId));

  const rows = input.playtime.games.map((game) => ({
    profileId: input.profileId,
    appId: game.appId,
    name: game.name,
    playtimeForever: game.playtimeMinutes,
    playtimeTwoWeeks: game.playtimeTwoWeeksMinutes,
    lastPlayedAt: game.lastPlayedAt,
    iconHash: game.iconHash,
  }));

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(gamePlaytime).values(rows.slice(i, i + chunkSize));
  }

  // Current library is replaced above. History is append-only and at most
  // one sample per UTC day so the cron and a login the same day do not double-write.
  await appendDailySnapshot({
    profileId: input.profileId,
    steamId: input.steamId,
    playtime: input.playtime,
    capturedAt: syncedAt,
  });
}

export function isStale(syncedAt: Date): boolean {
  return Date.now() - syncedAt.getTime() > STALE_AFTER_MS;
}
