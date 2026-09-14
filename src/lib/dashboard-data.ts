import { listFriends } from "./db/friends";
import {
  getProfileGames,
  getSteamLink,
  isStale,
  type Profile,
  type SteamLink,
} from "./db/profiles";
import {
  getPlaytimePeriods,
  seedMissingDailyFromSteamWindow,
  sumDailyMinutesByApp,
  type PlaytimePeriods,
} from "./db/daily";
import { syncLinkedPlaytime } from "./playtime-sync";
import {
  dayStringInZone,
  resolveTimeZone,
  rollingStartDay,
  PERIOD_DAYS,
} from "./playtime-windows";
import type { GamePlaytime } from "./steam-api";

export type DashboardGame = GamePlaytime & {
  todayMinutes: number;
  weekMinutes: number;
};

export type DashboardData = {
  profile: Profile;
  steam: SteamLink | null;
  games: DashboardGame[];
  periods: PlaytimePeriods;
  displayTimeZone: string;
};

export async function loadDashboard(
  profile: Profile,
  opts?: { displayTimeZone?: string },
): Promise<DashboardData> {
  let steam = await getSteamLink(profile.id);
  const timeZone = resolveTimeZone(profile.timeZone);
  const displayTimeZone = resolveTimeZone(
    opts?.displayTimeZone ?? profile.timeZone,
  );

  if (steam && isStale(steam.syncedAt)) {
    try {
      await syncLinkedPlaytime({
        profileId: profile.id,
        steamId: steam.steamId,
        profileUrl: steam.profileUrl,
      });
      steam = await getSteamLink(profile.id);
    } catch {
      // Serve the last held totals if Steam is unreachable.
    }
  }

  const now = new Date();
  const today = dayStringInZone(now, timeZone);
  const library = steam ? await getProfileGames(profile.id) : [];

  if (steam?.playtimePublic && library.length > 0) {
    await seedMissingDailyFromSteamWindow({
      profileId: profile.id,
      games: library,
      at: now,
      timeZone,
    });
  }

  const steamTwoWeeks = library.reduce(
    (sum, game) => sum + game.playtimeTwoWeeksMinutes,
    0,
  );
  const periods = steam
    ? await getPlaytimePeriods(profile.id, now, {
        twoWeeks: steamTwoWeeks,
        timeZone,
      })
    : {
        sampledFrom: null,
        snapshotCount: 0,
        twoWeeks: null,
        today: null,
        week: null,
        month: null,
      };

  const weekStart = rollingStartDay(today, PERIOD_DAYS.week);
  const [todayByApp, weekByApp] = await Promise.all([
    sumDailyMinutesByApp({ profileId: profile.id, fromDay: today, toDay: today }),
    sumDailyMinutesByApp({
      profileId: profile.id,
      fromDay: weekStart,
      toDay: today,
    }),
  ]);

  const games = library.map((game) => ({
    ...game,
    todayMinutes: todayByApp.get(game.appId) ?? 0,
    weekMinutes: weekByApp.get(game.appId) ?? 0,
  }));

  return { profile, steam, games, periods, displayTimeZone };
}

export type LeaderboardEntry = {
  name: string;
  hours: number;
  isUser?: boolean;
};

export type LeaderboardBoards = {
  week: LeaderboardEntry[];
  month: LeaderboardEntry[];
  all: LeaderboardEntry[];
};

function hoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function rankBoard(
  rows: { name: string; minutes: number; isUser: boolean }[],
): LeaderboardEntry[] {
  return [...rows]
    .sort((a, b) => a.minutes - b.minutes)
    .map((row) => ({
      name: row.name,
      hours: hoursFromMinutes(row.minutes),
      isUser: row.isUser,
    }));
}

export async function loadLeaderboard(
  viewer: Profile,
): Promise<LeaderboardBoards> {
  const friends = await listFriends(viewer.id);
  const people = [viewer, ...friends];
  const now = new Date();

  const scored = await Promise.all(
    people.map(async (person) => {
      const steam = await getSteamLink(person.id);
      const periods = steam
        ? await getPlaytimePeriods(person.id, now, {
            timeZone: person.timeZone,
          })
        : null;
      return {
        name: person.username,
        isUser: person.id === viewer.id,
        week: periods?.week?.minutes ?? 0,
        month: periods?.month?.minutes ?? 0,
        all: steam?.playtimeMinutes ?? 0,
      };
    }),
  );

  return {
    week: rankBoard(
      scored.map((row) => ({
        name: row.name,
        minutes: row.week,
        isUser: row.isUser,
      })),
    ),
    month: rankBoard(
      scored.map((row) => ({
        name: row.name,
        minutes: row.month,
        isUser: row.isUser,
      })),
    ),
    all: rankBoard(
      scored.map((row) => ({
        name: row.name,
        minutes: row.all,
        isUser: row.isUser,
      })),
    ),
  };
}
