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
import { rollingWindowStart, utcDayString, PERIOD_DAYS } from "./playtime-windows";
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
};

export async function loadDashboard(profile: Profile): Promise<DashboardData> {
  let steam = await getSteamLink(profile.id);

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
  const today = utcDayString(now);
  const library = steam ? await getProfileGames(profile.id) : [];

  if (steam?.playtimePublic && library.length > 0) {
    await seedMissingDailyFromSteamWindow({
      profileId: profile.id,
      games: library,
      at: now,
    });
  }

  const periods = steam
    ? await getPlaytimePeriods(profile.id, now)
    : {
        sampledFrom: null,
        snapshotCount: 0,
        twoWeeks: null,
        today: null,
        week: null,
        month: null,
      };

  const [todayByApp, weekByApp] = await Promise.all([
    sumDailyMinutesByApp({ profileId: profile.id, fromDay: today, toDay: today }),
    sumDailyMinutesByApp({
      profileId: profile.id,
      fromDay: utcDayString(rollingWindowStart(now, PERIOD_DAYS.week)),
      toDay: today,
    }),
  ]);

  const games = library.map((game) => ({
    ...game,
    todayMinutes: todayByApp.get(game.appId) ?? 0,
    weekMinutes: weekByApp.get(game.appId) ?? 0,
  }));

  return { profile, steam, games, periods };
}
