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
