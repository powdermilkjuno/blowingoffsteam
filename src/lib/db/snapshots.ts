import { and, eq, sql } from "drizzle-orm";
import { ACCOUNT_APP_ID, startOfUtcDay } from "../playtime-windows";
import type { Playtime } from "../steam-api";
import { getDb } from "./index";
import { playtimeSnapshots, steamLinks } from "./schema";

export type LinkedSteamAccount = {
  profileId: string;
  steamId: string;
  profileUrl: string;
};

export {
  type PeriodDelta,
  type PeriodSource,
  type PlaytimePeriods,
  getPlaytimePeriods,
  getGamePeriodMinutes,
} from "./daily";

export async function listLinkedSteamAccounts(): Promise<LinkedSteamAccount[]> {
  return getDb()
    .select({
      profileId: steamLinks.profileId,
      steamId: steamLinks.steamId,
      profileUrl: steamLinks.profileUrl,
    })
    .from(steamLinks);
}

export async function hasSnapshotOnUtcDay(
  profileId: string,
  at: Date,
): Promise<boolean> {
  const dayStart = startOfUtcDay(at);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const [row] = await getDb()
    .select({ id: playtimeSnapshots.id })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, ACCOUNT_APP_ID),
        sql`${playtimeSnapshots.capturedAt} >= ${dayStart}`,
        sql`${playtimeSnapshots.capturedAt} < ${nextDay}`,
      ),
    )
    .limit(1);

  return row !== undefined;
}

function snapshotRows(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt: Date;
}) {
  return [
    {
      profileId: input.profileId,
      steamId: input.steamId,
      appId: ACCOUNT_APP_ID,
      capturedAt: input.capturedAt,
      playtimeForever: input.playtime.minutes,
      playtimeTwoWeeks: input.playtime.games.reduce(
        (sum, game) => sum + game.playtimeTwoWeeksMinutes,
        0,
      ),
    },
    ...input.playtime.games.map((game) => ({
      profileId: input.profileId,
      steamId: input.steamId,
      appId: game.appId,
      capturedAt: input.capturedAt,
      playtimeForever: game.playtimeMinutes,
      playtimeTwoWeeks: game.playtimeTwoWeeksMinutes,
    })),
  ];
}

// First sample of a UTC day only. Later refreshes must not overwrite it —
// held play lives in playtime_daily increments, not mutated lifetime rows.
export async function recordPlaytimeSnapshot(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt?: Date;
}): Promise<boolean> {
  if (!input.playtime.isPublic) return false;

  const capturedAt = input.capturedAt ?? new Date();
  if (await hasSnapshotOnUtcDay(input.profileId, capturedAt)) {
    return false;
  }

  const db = getDb();
  const rows = snapshotRows({ ...input, capturedAt });
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(playtimeSnapshots).values(rows.slice(i, i + chunkSize));
  }

  return true;
}

export async function appendDailySnapshot(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt?: Date;
}): Promise<boolean> {
  return recordPlaytimeSnapshot(input);
}
