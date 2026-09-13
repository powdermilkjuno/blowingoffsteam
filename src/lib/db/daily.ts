import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { Playtime } from "../steam-api";
import {
  ACCOUNT_APP_ID,
  addUtcDays,
  computePlaytimeIncrements,
  dailyDiffsFromClosings,
  PERIOD_DAYS,
  rollingWindowStart,
  utcDayString,
} from "../playtime-windows";
import { getDb } from "./index";
import { playtimeDaily, playtimeSnapshots } from "./schema";

export type PeriodSource = "sampled" | "since_tracking";

export type PeriodDelta = {
  minutes: number;
  since: Date;
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

export { ACCOUNT_APP_ID };

async function firstDailyDay(profileId: string): Promise<string | null> {
  const [row] = await getDb()
    .select({ day: playtimeDaily.day })
    .from(playtimeDaily)
    .where(
      and(
        eq(playtimeDaily.profileId, profileId),
        eq(playtimeDaily.appId, ACCOUNT_APP_ID),
      ),
    )
    .orderBy(asc(playtimeDaily.day))
    .limit(1);

  return row?.day ?? null;
}

async function trackedDayCount(profileId: string): Promise<number> {
  const [row] = await getDb()
    .select({
      count: sql<number>`count(*)::int`,
    })
    .from(playtimeDaily)
    .where(
      and(
        eq(playtimeDaily.profileId, profileId),
        eq(playtimeDaily.appId, ACCOUNT_APP_ID),
      ),
    );

  return row?.count ?? 0;
}

async function incrementDailyMinutes(input: {
  profileId: string;
  appId: number;
  day: string;
  minutes: number;
}): Promise<void> {
  await getDb()
    .insert(playtimeDaily)
    .values({
      profileId: input.profileId,
      appId: input.appId,
      day: input.day,
      minutes: input.minutes,
    })
    .onConflictDoUpdate({
      target: [playtimeDaily.profileId, playtimeDaily.appId, playtimeDaily.day],
      set: {
        minutes: sql`${playtimeDaily.minutes} + ${input.minutes}`,
      },
    });
}

export async function ensureTodayRow(
  profileId: string,
  at: Date = new Date(),
): Promise<void> {
  await incrementDailyMinutes({
    profileId,
    appId: ACCOUNT_APP_ID,
    day: utcDayString(at),
    minutes: 0,
  });
}

async function hasPositiveDaily(
  profileId: string,
  appId: number,
): Promise<boolean> {
  const [row] = await getDb()
    .select({ minutes: playtimeDaily.minutes })
    .from(playtimeDaily)
    .where(
      and(
        eq(playtimeDaily.profileId, profileId),
        eq(playtimeDaily.appId, appId),
        sql`${playtimeDaily.minutes} > 0`,
      ),
    )
    .limit(1);

  return row !== undefined;
}

export async function applyPlaytimeIncrements(input: {
  profileId: string;
  previousForever: Map<number, number>;
  playtime: Playtime;
  at?: Date;
}): Promise<void> {
  if (!input.playtime.isPublic) return;

  const at = input.at ?? new Date();
  const day = utcDayString(at);
  const increments = computePlaytimeIncrements(
    input.previousForever,
    input.playtime.games,
  );
  const accountDelta = increments.reduce((sum, row) => sum + row.minutes, 0);

  await incrementDailyMinutes({
    profileId: input.profileId,
    appId: ACCOUNT_APP_ID,
    day,
    minutes: accountDelta,
  });

  for (const increment of increments) {
    await incrementDailyMinutes({
      profileId: input.profileId,
      appId: increment.appId,
      day,
      minutes: increment.minutes,
    });
  }

  await seedMissingDailyFromSteamWindow({
    profileId: input.profileId,
    games: input.playtime.games,
    at,
  });
}

// One-time recovery when same-day snapshot overwrites erased the opening
// baseline. Steam's 14-day field is only copied onto last-played day if we
// have never held minutes for that game.
export async function seedMissingDailyFromSteamWindow(input: {
  profileId: string;
  games: {
    appId: number;
    playtimeTwoWeeksMinutes: number;
    lastPlayedAt: number | null;
  }[];
  at?: Date;
}): Promise<void> {
  const at = input.at ?? new Date();
  const windowStart = rollingWindowStart(at, PERIOD_DAYS.twoWeeks);

  for (const game of input.games) {
    if (game.playtimeTwoWeeksMinutes <= 0 || game.lastPlayedAt == null) {
      continue;
    }

    const lastPlayed = new Date(game.lastPlayedAt * 1000);
    if (lastPlayed < windowStart || lastPlayed > at) continue;
    if (await hasPositiveDaily(input.profileId, game.appId)) continue;

    const day = utcDayString(lastPlayed);
    await incrementDailyMinutes({
      profileId: input.profileId,
      appId: game.appId,
      day,
      minutes: game.playtimeTwoWeeksMinutes,
    });
    await incrementDailyMinutes({
      profileId: input.profileId,
      appId: ACCOUNT_APP_ID,
      day,
      minutes: game.playtimeTwoWeeksMinutes,
    });
  }
}

function closingForeverByDay(
  rows: { capturedAt: Date; forever: number }[],
): Map<string, number> {
  const closings = new Map<string, { at: number; forever: number }>();

  for (const row of rows) {
    const day = utcDayString(row.capturedAt);
    const prev = closings.get(day);
    if (!prev || row.capturedAt.getTime() >= prev.at) {
      closings.set(day, { at: row.capturedAt.getTime(), forever: row.forever });
    }
  }

  return new Map(
    [...closings.entries()].map(([day, value]) => [day, value.forever]),
  );
}

// Rebuild held daily minutes from consecutive lifetime snapshots. Same-day
// overwrites already collapsed those samples, so this only recovers days that
// still have a distinct previous-day forever value.
export async function backfillDailyFromSnapshots(
  profileId: string,
): Promise<void> {
  if (await hasPositiveDaily(profileId, ACCOUNT_APP_ID)) return;

  const rows = await getDb()
    .select({
      appId: playtimeSnapshots.appId,
      capturedAt: playtimeSnapshots.capturedAt,
      forever: playtimeSnapshots.playtimeForever,
    })
    .from(playtimeSnapshots)
    .where(eq(playtimeSnapshots.profileId, profileId))
    .orderBy(asc(playtimeSnapshots.capturedAt));

  if (rows.length === 0) return;

  const byApp = new Map<number, { capturedAt: Date; forever: number }[]>();
  for (const row of rows) {
    const list = byApp.get(row.appId) ?? [];
    list.push({ capturedAt: row.capturedAt, forever: row.forever });
    byApp.set(row.appId, list);
  }

  for (const [appId, samples] of byApp) {
    const consecutive: { day: string; minutes: number }[] = [];
    const ordered = [...samples].sort(
      (a, b) => a.capturedAt.getTime() - b.capturedAt.getTime(),
    );
    for (let i = 1; i < ordered.length; i += 1) {
      const minutes = Math.max(0, ordered[i].forever - ordered[i - 1].forever);
      if (minutes > 0) {
        consecutive.push({
          day: utcDayString(ordered[i].capturedAt),
          minutes,
        });
      }
    }

    const fromClosings = dailyDiffsFromClosings(closingForeverByDay(samples));
    const merged = consecutive.length > 0 ? consecutive : fromClosings;
    if (merged.length === 0) continue;
    if (await hasPositiveDaily(profileId, appId)) continue;

    for (const diff of merged) {
      await incrementDailyMinutes({
        profileId,
        appId,
        day: diff.day,
        minutes: diff.minutes,
      });
    }
  }
}

export async function sumDailyMinutes(input: {
  profileId: string;
  appId?: number;
  fromDay: string;
  toDay: string;
}): Promise<number> {
  const [row] = await getDb()
    .select({
      minutes: sql<number>`coalesce(sum(${playtimeDaily.minutes}), 0)::int`,
    })
    .from(playtimeDaily)
    .where(
      and(
        eq(playtimeDaily.profileId, input.profileId),
        eq(playtimeDaily.appId, input.appId ?? ACCOUNT_APP_ID),
        gte(playtimeDaily.day, input.fromDay),
        lte(playtimeDaily.day, input.toDay),
      ),
    );

  return row?.minutes ?? 0;
}

export async function sumDailyMinutesByApp(input: {
  profileId: string;
  fromDay: string;
  toDay: string;
}): Promise<Map<number, number>> {
  const rows = await getDb()
    .select({
      appId: playtimeDaily.appId,
      minutes: sql<number>`coalesce(sum(${playtimeDaily.minutes}), 0)::int`,
    })
    .from(playtimeDaily)
    .where(
      and(
        eq(playtimeDaily.profileId, input.profileId),
        gte(playtimeDaily.day, input.fromDay),
        lte(playtimeDaily.day, input.toDay),
      ),
    )
    .groupBy(playtimeDaily.appId);

  return new Map(
    rows
      .filter((row) => row.appId !== ACCOUNT_APP_ID)
      .map((row) => [row.appId, row.minutes]),
  );
}

function toPeriod(
  minutes: number,
  since: Date,
  sampledFrom: Date | null,
): PeriodDelta {
  const complete = sampledFrom !== null && sampledFrom <= since;
  return {
    minutes,
    since,
    complete,
    source: complete ? "sampled" : "since_tracking",
  };
}

export async function getPlaytimePeriods(
  profileId: string,
  at: Date = new Date(),
): Promise<PlaytimePeriods> {
  await backfillDailyFromSnapshots(profileId);
  await ensureTodayRow(profileId, at);

  const today = utcDayString(at);
  const sampledDay = await firstDailyDay(profileId);
  const sampledFrom = sampledDay
    ? new Date(`${sampledDay}T00:00:00.000Z`)
    : null;
  const snapshotCount = await trackedDayCount(profileId);

  const windows = {
    today: { days: PERIOD_DAYS.today, start: rollingWindowStart(at, PERIOD_DAYS.today) },
    week: { days: PERIOD_DAYS.week, start: rollingWindowStart(at, PERIOD_DAYS.week) },
    twoWeeks: {
      days: PERIOD_DAYS.twoWeeks,
      start: rollingWindowStart(at, PERIOD_DAYS.twoWeeks),
    },
    month: { days: PERIOD_DAYS.month, start: rollingWindowStart(at, PERIOD_DAYS.month) },
  };

  const [todayMinutes, weekMinutes, twoWeekMinutes, monthMinutes] =
    await Promise.all([
      sumDailyMinutes({
        profileId,
        fromDay: utcDayString(windows.today.start),
        toDay: today,
      }),
      sumDailyMinutes({
        profileId,
        fromDay: utcDayString(windows.week.start),
        toDay: today,
      }),
      sumDailyMinutes({
        profileId,
        fromDay: utcDayString(windows.twoWeeks.start),
        toDay: today,
      }),
      sumDailyMinutes({
        profileId,
        fromDay: utcDayString(windows.month.start),
        toDay: today,
      }),
    ]);

  return {
    sampledFrom,
    snapshotCount,
    today: toPeriod(todayMinutes, windows.today.start, sampledFrom),
    week: toPeriod(weekMinutes, windows.week.start, sampledFrom),
    twoWeeks: toPeriod(twoWeekMinutes, windows.twoWeeks.start, sampledFrom),
    month: toPeriod(monthMinutes, windows.month.start, sampledFrom),
  };
}

export async function getGamePeriodMinutes(
  profileId: string,
  appId: number,
  periodStart: Date,
  at: Date = new Date(),
): Promise<number> {
  return sumDailyMinutes({
    profileId,
    appId,
    fromDay: utcDayString(periodStart),
    toDay: utcDayString(at),
  });
}

export { addUtcDays, rollingWindowStart, utcDayString };
