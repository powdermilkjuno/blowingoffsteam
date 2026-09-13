export type SteamPlayerSummary = {
  steamId: string;
  displayName: string;
  avatarUrl: string;
  profileUrl: string;
};

export async function fetchPlayerSummary(
  steamId: string,
): Promise<SteamPlayerSummary> {
  const fallback: SteamPlayerSummary = {
    steamId,
    displayName: "Steam User",
    avatarUrl: "",
    profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
  };

  const key = process.env.STEAM_API_KEY;
  if (!key) return fallback;

  const params = new URLSearchParams({
    key,
    steamids: steamId,
  });

  const res = await fetch(
    `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?${params}`,
    { cache: "no-store" },
  );

  if (!res.ok) return fallback;

  const data = await res.json();
  const player = data?.response?.players?.[0];
  if (!player) return fallback;

  return {
    steamId,
    displayName: player.personaname ?? fallback.displayName,
    avatarUrl: player.avatarfull ?? "",
    profileUrl: player.profileurl ?? fallback.profileUrl,
  };
}

export type GamePlaytime = {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes: number;
  lastPlayedAt: number | null;
  iconHash: string;
  iconUrl: string;
};

export type Playtime = {
  minutes: number;
  isPublic: boolean;
  games: GamePlaytime[];
};

type SteamOwnedGame = {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  img_icon_url?: string;
};

export function steamGameIconUrl(appId: number, iconHash: string): string {
  if (!iconHash) return "";
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appId}/${iconHash}.jpg`;
}

export async function fetchPlaytime(steamId: string): Promise<Playtime> {
  const empty: Playtime = { minutes: 0, isPublic: false, games: [] };
  const key = process.env.STEAM_API_KEY;
  if (!key) return empty;

  const params = new URLSearchParams({
    key,
    steamid: steamId,
    include_appinfo: "true",
    include_played_free_games: "true",
  });

  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${params}`,
    { cache: "no-store" },
  );
  if (!res.ok) return empty;

  const data = await res.json();
  const rawGames = data?.response?.games;
  if (!Array.isArray(rawGames)) return empty;

  const games = (rawGames as SteamOwnedGame[])
    .map((game) => {
      const appId = Number(game.appid) || 0;
      const playtimeMinutes = Number(game.playtime_forever) || 0;
      const iconHash = typeof game.img_icon_url === "string" ? game.img_icon_url : "";

      return {
        appId,
        name: game.name?.trim() || `App ${appId}`,
        playtimeMinutes,
        playtimeTwoWeeksMinutes: Number(game.playtime_2weeks) || 0,
        lastPlayedAt: Number(game.rtime_last_played) || null,
        iconHash,
        iconUrl: steamGameIconUrl(appId, iconHash),
      };
    })
    .filter((game) => game.appId > 0 && game.playtimeMinutes > 0)
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

  const minutes = (rawGames as SteamOwnedGame[]).reduce(
    (sum, game) => sum + (Number(game.playtime_forever) || 0),
    0,
  );

  return {
    minutes,
    isPublic: true,
    games,
  };
}
