import type { SessionUser } from "./session";

export async function fetchPlayerSummary(
  steamId: string,
): Promise<SessionUser> {
  const fallback: SessionUser = {
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

export type Playtime = {
  minutes: number;
  isPublic: boolean;
};

export async function fetchPlaytime(steamId: string): Promise<Playtime> {
  const empty: Playtime = { minutes: 0, isPublic: false };
  const key = process.env.STEAM_API_KEY;
  if (!key) return empty;

  const params = new URLSearchParams({
    key,
    steamid: steamId,
    include_appinfo: "false",
    include_played_free_games: "true",
  });

  const res = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${params}`,
    { cache: "no-store" },
  );
  if (!res.ok) return empty;

  const data = await res.json();
  const games = data?.response?.games;
  if (!Array.isArray(games)) return empty;

  const minutes = games.reduce(
    (sum: number, game: { playtime_forever?: number }) =>
      sum + (Number(game.playtime_forever) || 0),
    0,
  );

  return { minutes, isPublic: true };
}
