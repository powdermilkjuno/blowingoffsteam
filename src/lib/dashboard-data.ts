import {
  getProfileGames,
  getSteamLink,
  isStale,
  saveSteamPlaytime,
  type Profile,
  type SteamLink,
} from "./db/profiles";
import { fetchPlaytime, type GamePlaytime } from "./steam-api";

export type DashboardData = {
  profile: Profile;
  steam: SteamLink | null;
  games: GamePlaytime[];
};

// Steam playtime is only refreshed on demand, so a stale link is re-pulled the
// next time someone looks at the dashboard.
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

  return { profile, steam, games };
}
