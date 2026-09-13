import { and, asc, desc, eq, lt, sql } from "drizzle-orm";
import type { Playtime } from "../steam-api";
import { getDb } from "./index";
import { playtimeSnapshots, steamLinks } from "./schema";

export const ACCOUNT_APP_ID = 0;

export type SnapshotPoint = {
  capturedAt: Date;
  forever: number;
};

export type PeriodSource =
  | "sampled"
  | "since_tracking"
  | "steam_2weeks"
  | "steam_2weeks_overlap";

export type PeriodDelta = {
  minutes: number;
  since: Date;
  // True when we have a sample from before the period started, so this is a
  // full calendar day/week/month — not just "since we started watching."
  complete: boolean;
  source: PeriodSource;
};

export type PlaytimePeriods = {
  sampledFrom: Date | null;
  snapshotCount: number;
  twoWeeks: PeriodDelta | null;
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

export function twoWeeksWindowStart(at: Date): Date {
  const day = startOfUtcDay(at);
  day.setUTCDate(day.getUTCDate() - 14);
  return day;
}

export function twoWeeksFitsInMonth(at: Date): boolean {
  return twoWeeksWindowStart(at) >= startOfUtcMonth(at);
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
      source: "sampled",
    };
  }

  return {
    minutes: Math.max(0, latest.forever - first.forever),
    since: first.capturedAt,
    complete: false,
    source: "since_tracking",
  };
}

// Steam's rolling 14 days is the only recent number we get for free. Use it
// for "this month" only when our forever-delta is incomplete (no sample from
// before the 1st). After the 14th, that window sits inside the month. Before
// that it overlaps last month — still the best fill-in, but labeled as such.
export function resolveMonthPeriod(
  sampled: PeriodDelta | null,
  twoWeeksMinutes: number,
  at: Date,
): PeriodDelta | null {
  if (sampled?.complete) return sampled;
  if (twoWeeksMinutes <= 0) return sampled;

  const windowStart = twoWeeksWindowStart(at);
  const sampledMinutes = sampled?.minutes ?? 0;
  if (twoWeeksMinutes <= sampledMinutes) return sampled;

  return {
    minutes: twoWeeksMinutes,
    since: windowStart,
    complete: false,
    source: twoWeeksFitsInMonth(at) ? "steam_2weeks" : "steam_2weeks_overlap",
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

export async function appendDailySnapshot(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt?: Date;
}): Promise<boolean> {
  return recordPlaytimeSnapshot(input);
}

// One row-set per UTC day. A later refresh the same day overwrites today's
// forever / 2-week numbers for every game so the library stays current.
export async function recordPlaytimeSnapshot(input: {
  profileId: string;
  steamId: string;
  playtime: Playtime;
  capturedAt?: Date;
}): Promise<boolean> {
  if (!input.playtime.isPublic) return false;

  const capturedAt = input.capturedAt ?? new Date();
  const db = getDb();
  const rows = snapshotRows({ ...input, capturedAt });

  if (!(await hasSnapshotOnUtcDay(input.profileId, capturedAt))) {
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await db.insert(playtimeSnapshots).values(rows.slice(i, i + chunkSize));
    }
    return true;
  }

  const dayStart = startOfUtcDay(capturedAt);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  for (const row of rows) {
    const updated = await db
      .update(playtimeSnapshots)
      .set({
        playtimeForever: row.playtimeForever,
        playtimeTwoWeeks: row.playtimeTwoWeeks,
        capturedAt,
      })
      .where(
        and(
          eq(playtimeSnapshots.profileId, row.profileId),
          eq(playtimeSnapshots.appId, row.appId),
          sql`${playtimeSnapshots.capturedAt} >= ${dayStart}`,
          sql`${playtimeSnapshots.capturedAt} < ${nextDay}`,
        ),
      )
      .returning({ id: playtimeSnapshots.id });

    if (updated.length === 0) {
      await db.insert(playtimeSnapshots).values(row);
    }
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
  live?: { forever?: number; twoWeeks?: number },
): Promise<PlaytimePeriods> {
  const [storedLatest, first, snapshotCount] = await Promise.all([
    latestAccountSnapshot(profileId),
    firstAccountSnapshot(profileId),
    accountSnapshotCount(profileId),
  ]);

  const latest =
    storedLatest && live?.forever !== undefined
      ? { capturedAt: at, forever: live.forever }
      : storedLatest;

  const twoWeeksMinutes = live?.twoWeeks ?? 0;
  const twoWeeks: PeriodDelta | null =
    twoWeeksMinutes > 0
      ? {
          minutes: twoWeeksMinutes,
          since: twoWeeksWindowStart(at),
          complete: true,
          source: "steam_2weeks",
        }
      : null;

  if (!latest || !first) {
    return {
      sampledFrom: first?.capturedAt ?? null,
      snapshotCount,
      twoWeeks,
      today: null,
      week: null,
      month: resolveMonthPeriod(null, twoWeeksMinutes, at),
    };
  }

  const [beforeToday, beforeWeek, beforeMonth] = await Promise.all([
    lastAccountSnapshotBefore(profileId, startOfUtcDay(at)),
    lastAccountSnapshotBefore(profileId, startOfIsoWeekUtc(at)),
    lastAccountSnapshotBefore(profileId, startOfUtcMonth(at)),
  ]);

  const sampledMonth = deltaFromSnapshots({
    latest,
    first,
    baseline: beforeMonth,
  });

  return {
    sampledFrom: first.capturedAt,
    snapshotCount,
    twoWeeks,
    today: deltaFromSnapshots({ latest, first, baseline: beforeToday }),
    week: deltaFromSnapshots({ latest, first, baseline: beforeWeek }),
    month: resolveMonthPeriod(sampledMonth, twoWeeksMinutes, at),
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
