import { randomInt } from "crypto";
import { desc, eq } from "drizzle-orm";
import type { GamePlaytime, Playtime } from "../steam-api";
import { steamGameIconUrl } from "../steam-api";
import { resolveTimeZone } from "../playtime-windows";
import {
  applyPlaytimeIncrements,
  backfillDailyFromSnapshots,
} from "./daily";
import { getDb } from "./index";
import { gamePlaytime, profiles, steamLinks } from "./schema";
import { recordPlaytimeSnapshot } from "./snapshots";

// Crockford-style alphabet: no I, L, O or U, so codes can be read aloud.
const FRIEND_CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const FRIEND_CODE_LENGTH = 8;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "auth",
  "dashboard",
  "friends",
  "groups",
  "onboarding",
  "settings",
  "support",
  "u",
]);

const STALE_AFTER_MS = 15 * 60 * 1000;

export type Archetype =
  | "night_owl"
  | "early_bird"
  | "firecracker"
  | "hearth"
  | "one_hit_wonder"
  | "chart_topper"
  | "grass_toucher";

export type Profile = {
  id: string;
  authUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  friendCode: string;
  timeZone: string;
  archetype: Archetype | null;
  capDayMinutes: number | null;
  capWeekMinutes: number | null;
  capMonthMinutes: number | null;
  bio: string;
  walletPoints: number;
  equippedFrame: string;
  equippedFont: string;
  equippedSiteTheme: string;
  equippedNameColor: string;
  equippedBackdrop: string;
  createdAt: Date;
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

export function formatLastPlayedAt(
  unixSeconds: number,
  timeZone?: string | null,
): string {
  return formatDateTimeAt(new Date(unixSeconds * 1000), timeZone);
}

export function formatDateTimeAt(at: Date, timeZone?: string | null): string {
  return at.toLocaleString("en-US", {
    timeZone: resolveTimeZone(timeZone),
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export function formatHeldDay(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return day;
  return new Date(Date.UTC(year, month - 1, date)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatClockAt(at: Date, timeZone?: string | null): string {
  return at.toLocaleTimeString("en-US", {
    timeZone: resolveTimeZone(timeZone),
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
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

export const BIO_MAX_LENGTH = 80;

export function validateBio(raw: string): string | null {
  const bio = raw.replace(/\s+/g, " ").trim();
  if (bio.length > BIO_MAX_LENGTH) {
    return `Bio must be ${BIO_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

export function normalizeBio(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
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

export function isProfileComplete(profile: Profile): boolean {
  return (
    profile.capDayMinutes != null &&
    profile.capWeekMinutes != null &&
    profile.capMonthMinutes != null
  );
}

export function toProfile(row: typeof profiles.$inferSelect): Profile {
  return {
    id: row.id,
    authUserId: row.authUserId,
    username: row.username,
    displayName: row.displayName,
    avatarUrl: row.avatarUrl,
    friendCode: row.friendCode,
    timeZone: row.timeZone,
    archetype: (row.archetype as Archetype | null) ?? null,
    capDayMinutes: row.capDayMinutes,
    capWeekMinutes: row.capWeekMinutes,
    capMonthMinutes: row.capMonthMinutes,
    bio: row.bio ?? "",
    walletPoints: row.walletPoints ?? 0,
    equippedFrame: row.equippedFrame || "frame:none",
    equippedFont: row.equippedFont || "font:mono",
    equippedSiteTheme: row.equippedSiteTheme || "theme:default",
    equippedNameColor: row.equippedNameColor || "name:default",
    equippedBackdrop: row.equippedBackdrop || "backdrop:none",
    createdAt: row.createdAt,
  };
}

export async function getProfileByAuthUserId(
  authUserId: string,
): Promise<Profile | null> {
  const [row] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, authUserId))
    .limit(1);

  return row ? toProfile(row) : null;
}

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const [row] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);

  return row ? toProfile(row) : null;
}

export async function getProfileByUsername(
  username: string,
): Promise<Profile | null> {
  const [row] = await getDb()
    .select()
    .from(profiles)
    .where(eq(profiles.username, normalizeUsername(username)))
    .limit(1);

  return row ? toProfile(row) : null;
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
  input: {
    username: string;
    displayName: string;
    timeZone: string;
    capDayMinutes?: number;
    capWeekMinutes?: number;
    capMonthMinutes?: number;
    bio?: string;
  },
): Promise<Profile> {
  const [row] = await getDb()
    .update(profiles)
    .set({
      username: normalizeUsername(input.username),
      displayName: input.displayName,
      timeZone: input.timeZone,
      ...(input.bio != null ? { bio: input.bio } : {}),
      ...(input.capDayMinutes != null ? { capDayMinutes: input.capDayMinutes } : {}),
      ...(input.capWeekMinutes != null
        ? { capWeekMinutes: input.capWeekMinutes }
        : {}),
      ...(input.capMonthMinutes != null
        ? { capMonthMinutes: input.capMonthMinutes }
        : {}),
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return toProfile(row);
}

export async function updateProfileCaps(
  profileId: string,
  input: {
    capDayMinutes: number;
    capWeekMinutes: number;
    capMonthMinutes: number;
  },
): Promise<void> {
  await getDb()
    .update(profiles)
    .set({
      capDayMinutes: input.capDayMinutes,
      capWeekMinutes: input.capWeekMinutes,
      capMonthMinutes: input.capMonthMinutes,
    })
    .where(eq(profiles.id, profileId));
}

export async function updateProfileArchetype(
  profileId: string,
  archetype: Archetype,
): Promise<void> {
  await getDb()
    .update(profiles)
    .set({ archetype })
    .where(eq(profiles.id, profileId));
}

export async function createProfile(input: {
  authUserId: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  timeZone?: string;
  capDayMinutes?: number | null;
  capWeekMinutes?: number | null;
  capMonthMinutes?: number | null;
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
          timeZone: input.timeZone ?? "UTC",
          capDayMinutes: input.capDayMinutes ?? null,
          capWeekMinutes: input.capWeekMinutes ?? null,
          capMonthMinutes: input.capMonthMinutes ?? null,
        })
        .returning();

      return toProfile(row);
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

  return row?.profile ? toProfile(row.profile) : null;
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

  await backfillDailyFromSnapshots(input.profileId);

  const previousRows = await db
    .select({
      appId: gamePlaytime.appId,
      playtimeForever: gamePlaytime.playtimeForever,
      lastPlayedAt: gamePlaytime.lastPlayedAt,
    })
    .from(gamePlaytime)
    .where(eq(gamePlaytime.profileId, input.profileId));

  const previousForever = new Map(
    previousRows.map((row) => [row.appId, row.playtimeForever]),
  );
  const previousLastPlayed = new Map(
    previousRows.map((row) => [row.appId, row.lastPlayedAt]),
  );

  await db.delete(gamePlaytime).where(eq(gamePlaytime.profileId, input.profileId));

  const syncedAtUnix = Math.floor(syncedAt.getTime() / 1000);
  const rows = input.playtime.games.map((game) => {
    const steamLast = game.lastPlayedAt;
    const prevForever = previousForever.get(game.appId);
    const gained =
      prevForever !== undefined && game.playtimeMinutes > prevForever;
    const lastPlayedAt =
      steamLast ??
      (gained ? syncedAtUnix : (previousLastPlayed.get(game.appId) ?? null));

    return {
      profileId: input.profileId,
      appId: game.appId,
      name: game.name,
      playtimeForever: game.playtimeMinutes,
      playtimeTwoWeeks: game.playtimeTwoWeeksMinutes,
      lastPlayedAt,
      iconHash: game.iconHash,
    };
  });

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(gamePlaytime).values(rows.slice(i, i + chunkSize));
  }

  const [owner] = await db
    .select({
      timeZone: profiles.timeZone,
      archetype: profiles.archetype,
    })
    .from(profiles)
    .where(eq(profiles.id, input.profileId))
    .limit(1);

  // Library forever is the new baseline. Any increase since the last sync is
  // added to today's held bucket — cron and the refresh button share this path.
  await applyPlaytimeIncrements({
    profileId: input.profileId,
    previousForever,
    playtime: input.playtime,
    at: syncedAt,
    timeZone: owner?.timeZone,
  });

  await recordPlaytimeSnapshot({
    profileId: input.profileId,
    steamId: input.steamId,
    playtime: input.playtime,
    capturedAt: syncedAt,
  });
}

export function isStale(syncedAt: Date): boolean {
  return Date.now() - syncedAt.getTime() > STALE_AFTER_MS;
}
