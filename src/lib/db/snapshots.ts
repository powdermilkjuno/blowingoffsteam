import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import type { Playtime } from "../steam-api";
import { getDb } from "./index";
import { playtimeSnapshots, steamLinks } from "./schema";

export const ACCOUNT_APP_ID = 0;

export type SnapshotPoint = {
  capturedAt: Date;
  forever: number;
};

export type PeriodDelta = {
  minutes: number;
  since: Date;
  // True when we have a sample from before the period started, so this is a
  // full calendar day/week/month — not just "since we started watching."
  complete: boolean;
};

export type PlaytimePeriods = {
  sampledFrom: Date | null;
  snapshotCount: number;
  today: PeriodDelta | null;
  week: PeriodDelta | null;
  month: PeriodDelta | null;
};

export type LinkedSteamAccount = {
  profileId: string;
  steamId: string;
  profileUrl: string;
};

export function startOfUtcDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

export function startOfIsoWeekUtc(at: Date): Date {
  const day = startOfUtcDay(at);
  const weekday = day.getUTCDay(); // 0 Sun .. 6 Sat
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  day.setUTCDate(day.getUTCDate() - daysFromMonday);
  return day;
}

export function startOfUtcMonth(at: Date): Date {
  return new Date(Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), 1));
}

export function deltaFromSnapshots(opts: {
  latest: SnapshotPoint | null;
  first: SnapshotPoint | null;
  baseline: SnapshotPoint | null;
}): PeriodDelta | null {
  const { latest, first, baseline } = opts;
  if (!latest || !first) return null;

  if (baseline) {
    return {
      minutes: Math.max(0, latest.forever - baseline.forever),
      since: baseline.capturedAt,
      complete: true,
    };
  }

  return {
    minutes: Math.max(0, latest.forever - first.forever),
    since: first.capturedAt,
    complete: false,
  };
}

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

export async function appendDailySnapshot(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt?: Date;
}): Promise<boolean> {
  if (!input.playtime.isPublic) return false;

  const capturedAt = input.capturedAt ?? new Date();
  if (await hasSnapshotOnUtcDay(input.profileId, capturedAt)) return false;

  const rows = [
    {
      profileId: input.profileId,
      steamId: input.steamId,
      appId: ACCOUNT_APP_ID,
      capturedAt,
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
      capturedAt,
      playtimeForever: game.playtimeMinutes,
      playtimeTwoWeeks: game.playtimeTwoWeeksMinutes,
    })),
  ];

  const db = getDb();
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(playtimeSnapshots).values(rows.slice(i, i + chunkSize));
  }

  return true;
}

async function latestAccountSnapshot(
  profileId: string,
): Promise<SnapshotPoint | null> {
  const [row] = await getDb()
    .select({
      capturedAt: playtimeSnapshots.capturedAt,
      forever: playtimeSnapshots.playtimeForever,
    })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, ACCOUNT_APP_ID),
      ),
    )
    .orderBy(desc(playtimeSnapshots.capturedAt))
    .limit(1);

  return row ?? null;
}

async function firstAccountSnapshot(
  profileId: string,
): Promise<SnapshotPoint | null> {
  const [row] = await getDb()
    .select({
      capturedAt: playtimeSnapshots.capturedAt,
      forever: playtimeSnapshots.playtimeForever,
    })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, ACCOUNT_APP_ID),
      ),
    )
    .orderBy(asc(playtimeSnapshots.capturedAt))
    .limit(1);

  return row ?? null;
}

async function lastAccountSnapshotBefore(
  profileId: string,
  before: Date,
): Promise<SnapshotPoint | null> {
  const [row] = await getDb()
    .select({
      capturedAt: playtimeSnapshots.capturedAt,
      forever: playtimeSnapshots.playtimeForever,
    })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, ACCOUNT_APP_ID),
        lt(playtimeSnapshots.capturedAt, before),
      ),
    )
    .orderBy(desc(playtimeSnapshots.capturedAt))
    .limit(1);

  return row ?? null;
}

async function accountSnapshotCount(profileId: string): Promise<number> {
  const [row] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, ACCOUNT_APP_ID),
      ),
    );

  return row?.count ?? 0;
}

export async function getPlaytimePeriods(
  profileId: string,
  at: Date = new Date(),
): Promise<PlaytimePeriods> {
  const [latest, first, snapshotCount] = await Promise.all([
    latestAccountSnapshot(profileId),
    firstAccountSnapshot(profileId),
    accountSnapshotCount(profileId),
  ]);

  if (!latest || !first) {
    return {
      sampledFrom: null,
      snapshotCount,
      today: null,
      week: null,
      month: null,
    };
  }

  const [beforeToday, beforeWeek, beforeMonth] = await Promise.all([
    lastAccountSnapshotBefore(profileId, startOfUtcDay(at)),
    lastAccountSnapshotBefore(profileId, startOfIsoWeekUtc(at)),
    lastAccountSnapshotBefore(profileId, startOfUtcMonth(at)),
  ]);

  return {
    sampledFrom: first.capturedAt,
    snapshotCount,
    today: deltaFromSnapshots({ latest, first, baseline: beforeToday }),
    week: deltaFromSnapshots({ latest, first, baseline: beforeWeek }),
    month: deltaFromSnapshots({ latest, first, baseline: beforeMonth }),
  };
}

export async function getGamePeriodMinutes(
  profileId: string,
  appId: number,
  periodStart: Date,
): Promise<number | null> {
  const db = getDb();

  const [latest] = await db
    .select({
      capturedAt: playtimeSnapshots.capturedAt,
      forever: playtimeSnapshots.playtimeForever,
    })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, appId),
      ),
    )
    .orderBy(desc(playtimeSnapshots.capturedAt))
    .limit(1);

  if (!latest) return null;

  const [baseline] = await db
    .select({ forever: playtimeSnapshots.playtimeForever })
    .from(playtimeSnapshots)
    .where(
      and(
        eq(playtimeSnapshots.profileId, profileId),
        eq(playtimeSnapshots.appId, appId),
        lt(playtimeSnapshots.capturedAt, periodStart),
      ),
    )
    .orderBy(desc(playtimeSnapshots.capturedAt))
    .limit(1);

  if (!baseline) return null;
  return Math.max(0, latest.forever - baseline.forever);
}
