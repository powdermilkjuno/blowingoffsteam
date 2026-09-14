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

function mapSteamGame(game: SteamOwnedGame): GamePlaytime | null {
  const appId = Number(game.appid) || 0;
  if (appId <= 0) return null;

  const iconHash = typeof game.img_icon_url === "string" ? game.img_icon_url : "";
  return {
    appId,
    name: game.name?.trim() || `App ${appId}`,
    playtimeMinutes: Number(game.playtime_forever) || 0,
    playtimeTwoWeeksMinutes: Number(game.playtime_2weeks) || 0,
    lastPlayedAt: Number(game.rtime_last_played) || null,
    iconHash,
    iconUrl: steamGameIconUrl(appId, iconHash),
  };
}

function mergeSteamGame(
  existing: GamePlaytime | undefined,
  incoming: GamePlaytime,
): GamePlaytime {
  if (!existing) return incoming;

  return {
    appId: existing.appId,
    name:
      existing.name.startsWith("App ") && !incoming.name.startsWith("App ")
        ? incoming.name
        : existing.name,
    playtimeMinutes: Math.max(existing.playtimeMinutes, incoming.playtimeMinutes),
    playtimeTwoWeeksMinutes: Math.max(
      existing.playtimeTwoWeeksMinutes,
      incoming.playtimeTwoWeeksMinutes,
    ),
    lastPlayedAt: existing.lastPlayedAt ?? incoming.lastPlayedAt,
    iconHash: existing.iconHash || incoming.iconHash,
    iconUrl: existing.iconUrl || incoming.iconUrl,
  };
}

async function steamJson(
  path: string,
  params: URLSearchParams,
): Promise<unknown> {
  const res = await fetch(`https://api.steampowered.com/${path}?${params}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchPlaytime(steamId: string): Promise<Playtime> {
  const empty: Playtime = { minutes: 0, isPublic: false, games: [] };
  const key = process.env.STEAM_API_KEY;
  if (!key) return empty;

  const ownedParams = new URLSearchParams({
    key,
    steamid: steamId,
    include_appinfo: "true",
    include_played_free_games: "true",
    include_free_sub: "true",
    skip_unvetted_apps: "false",
  });
  const recentParams = new URLSearchParams({
    key,
    steamid: steamId,
    count: "0",
  });

  const [ownedPayload, recentPayload] = await Promise.all([
    steamJson("IPlayerService/GetOwnedGames/v1/", ownedParams),
    steamJson("IPlayerService/GetRecentlyPlayedGames/v1/", recentParams),
  ]);

  const owned = ownedPayload as {
    response?: { games?: SteamOwnedGame[] };
  } | null;
  const rawOwned = owned?.response?.games;
  if (!Array.isArray(rawOwned)) return empty;

  const byAppId = new Map<number, GamePlaytime>();
  for (const raw of rawOwned) {
    const game = mapSteamGame(raw);
    if (game) byAppId.set(game.appId, game);
  }

  // Free-to-play titles (Deltarune, etc.) are often omitted from owned games
  // even with include_played_free_games. Recently played still has them.
  const recent = recentPayload as {
    response?: { games?: SteamOwnedGame[] };
  } | null;
  const rawRecent = Array.isArray(recent?.response?.games)
    ? recent.response.games
    : [];
  for (const raw of rawRecent) {
    const game = mapSteamGame(raw);
    if (!game) continue;

    const existing = byAppId.get(game.appId);
    if (!existing) {
      byAppId.set(game.appId, game);
      continue;
    }

    byAppId.set(game.appId, mergeSteamGame(existing, game));
  }

  const games = [...byAppId.values()]
    .filter(
      (game) =>
        game.playtimeMinutes > 0 ||
        game.playtimeTwoWeeksMinutes > 0 ||
        game.lastPlayedAt != null,
    )
    .sort((a, b) => b.playtimeMinutes - a.playtimeMinutes);

  const minutes = games.reduce((sum, game) => sum + game.playtimeMinutes, 0);

  return {
    minutes,
    isPublic: true,
    games,
  };
}
