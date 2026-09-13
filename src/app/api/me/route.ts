import { auth } from "@/lib/auth/server";
import { loadDashboard } from "@/lib/dashboard-data";
import { formatPlaytime, getProfileByAuthUserId } from "@/lib/db/profiles";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) {
    return Response.json({ error: "Onboarding incomplete" }, { status: 409 });
  }

  const { steam, games } = await loadDashboard(profile);

  return Response.json({
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      friendCode: profile.friendCode,
      email: session.user.email,
    },
    steam: steam
      ? {
          steamId: steam.steamId,
          profileUrl: steam.profileUrl,
          playtimeMinutes: steam.playtimeMinutes,
          playtimeFormatted: formatPlaytime(steam.playtimeMinutes),
          playtimePublic: steam.playtimePublic,
          syncedAt: steam.syncedAt,
        }
      : null,
    games: games.map((game) => ({
      appId: game.appId,
      name: game.name,
      playtimeMinutes: game.playtimeMinutes,
      playtimeFormatted: formatPlaytime(game.playtimeMinutes),
      playtimeTwoWeeksMinutes: game.playtimeTwoWeeksMinutes,
      lastPlayedAt: game.lastPlayedAt,
      iconUrl: game.iconUrl,
    })),
  });
}
