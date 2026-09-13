import {
  getProfileGames,
  getSteamLink,
  isStale,
  saveSteamPlaytime,
  type Profile,
  type SteamLink,
} from "./db/profiles";
import {
  appendDailySnapshot,
  getPlaytimePeriods,
  type PlaytimePeriods,
} from "./db/snapshots";
import { fetchPlaytime, type GamePlaytime } from "./steam-api";

export type DashboardData = {
  profile: Profile;
  steam: SteamLink | null;
  games: GamePlaytime[];
  periods: PlaytimePeriods;
};

// Steam playtime is only refreshed on demand, so a stale link is re-pulled the
// next time someone looks at the dashboard. That refresh also writes today's
// snapshot if the cron has not already.
export async function loadDashboard(profile: Profile): Promise<DashboardData> {
  let steam = await getSteamLink(profile.id);

  if (steam && isStale(steam.syncedAt)) {
    try {
      const playtime = await fetchPlaytime(steam.steamId);
      await saveSteamPlaytime({
        profileId: profile.id,
        steamId: steam.steamId,
        profileUrl: steam.profileUrl,
        playtime,
      });
      steam = await getSteamLink(profile.id);
    } catch {
      // Serve the last known snapshot if Steam is unreachable.
    }
  }

  const games = steam ? await getProfileGames(profile.id) : [];

  // Anyone who already has a library but no history yet gets day zero now,
  // instead of waiting for the next stale refresh or cron tick.
  if (steam?.playtimePublic && games.length > 0) {
    await appendDailySnapshot({
      profileId: profile.id,
      steamId: steam.steamId,
      playtime: {
        minutes: steam.playtimeMinutes,
        isPublic: true,
        games,
      },
    });
  }

  const twoWeeks = games.reduce(
    (sum, game) => sum + game.playtimeTwoWeeksMinutes,
    0,
  );
  const periods = await getPlaytimePeriods(profile.id, new Date(), {
    forever: steam?.playtimeMinutes,
    twoWeeks,
  });

  return { profile, steam, games, periods };
}
