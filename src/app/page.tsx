import { formatPlaytime, getUserBySteamId, type UserRecord } from "@/lib/db/users";
import { getSession } from "@/lib/session";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  let stored: UserRecord | null = null;
  if (session) {
    try {
      stored = await getUserBySteamId(session.steamId);
    } catch {
      stored = null;
    }
  }
  const user = stored
    ? {
        displayName: stored.name,
        steamId: stored.id,
        avatarUrl: stored.avatarUrl,
        profileUrl: session?.profileUrl ?? "",
        playtimeMinutes: stored.playtimeMinutes,
        playtimePublic: stored.playtimePublic,
        games: stored.games,
      }
    : session
      ? {
          displayName: session.displayName,
          steamId: session.steamId,
          avatarUrl: session.avatarUrl,
          profileUrl: session.profileUrl,
          playtimeMinutes: 0,
          playtimePublic: false,
          games: [],
        }
      : null;
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-[#1b2838] px-6 py-16 font-sans text-[#c7d5e0]">
      <main className="flex w-full max-w-lg flex-col items-center gap-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            Blowing Off Steam
          </h1>
          <p className="text-sm text-[#8f98a0]">
            Personal playtime dashboard
          </p>
        </div>

        {user ? (
          <div className="flex w-full flex-col items-center gap-5 rounded bg-[#16202d] px-6 py-8">
            {user.avatarUrl ? (
              // player avatar gotten from steam api request
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={`${user.displayName} avatar`}
                width={84}
                height={84}
                className="size-21 rounded"
              />
            ) : null}
            <div className="space-y-1">
              <p className="text-xl font-medium text-white">
                {user.displayName}
              </p>
              <p className="font-mono text-xs text-[#8f98a0]">{user.steamId}</p>
              <p className="pt-2 text-sm text-[#c7d5e0]">
                {user.playtimePublic
                  ? `${formatPlaytime(user.playtimeMinutes)} played across ${user.games.length} games`
                  : "Playtime hidden — set Game details to Public on Steam"}
              </p>
            </div>
            {user.playtimePublic && user.games.length > 0 ? (
              <ul className="flex max-h-80 w-full flex-col gap-1 overflow-y-auto text-left">
                {user.games.map((game) => (
                  <li
                    key={game.appId}
                    className="flex items-center gap-3 rounded px-2 py-1.5"
                  >
                    {game.iconUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={game.iconUrl}
                        alt=""
                        width={32}
                        height={32}
                        className="size-8 rounded"
                      />
                    ) : (
                      <span className="size-8 rounded bg-[#1b2838]" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-white">
                      {game.name}
                    </span>
                    <span className="shrink-0 text-right text-xs text-[#8f98a0]">
                      <span className="block text-[#c7d5e0]">
                        {formatPlaytime(game.playtimeMinutes)}
                      </span>
                      {game.playtimeTwoWeeksMinutes > 0 ? (
                        <span>{formatPlaytime(game.playtimeTwoWeeksMinutes)} / 2w</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="flex items-center gap-4 text-sm">
              {user.profileUrl ? (
                <a
                  href={user.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#66c0f4] hover:text-white"
                >
                  Steam profile
                </a>
              ) : null}
              <a href="/api/me" className="text-[#8f98a0] hover:text-white">
                JSON
              </a>
              <a href="/auth/logout" className="text-[#8f98a0] hover:text-white">
                Sign out
              </a>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            {error === "steam" ? (
              <p className="text-sm text-[#c94a4a]">
                Steam sign-in failed. Please try again.
              </p>
            ) : null}
            <a href="/auth/steam/login" className="inline-block">
              {/* Official Steam sign-in button — do not restyle */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sits_02.png"
                alt="Sign in through Steam"
                width={180}
                height={35}
              />
            </a>
            <p className="max-w-xs text-xs leading-5 text-[#8f98a0]">
              Game details must be Public on your Steam profile for playtime
              to show.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
