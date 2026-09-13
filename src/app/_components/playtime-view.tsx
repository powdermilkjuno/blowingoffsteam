import Image from "next/image";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatPlaytime } from "@/lib/db/profiles";
import type { PeriodDelta } from "@/lib/db/daily";
import { RefreshPlaytimeButton } from "../dashboard/refresh-button";

export function PlaytimeView({
  data,
  viewerIsOwner,
}: {
  data: DashboardData;
  viewerIsOwner: boolean;
}) {
  const { profile, steam, games, periods } = data;
  const who = viewerIsOwner ? "You have" : `${profile.displayName} has`;

  return (
    <div className="space-y-6">
      <section className="flex items-center gap-4 rounded border border-[#2a3f5a] bg-[#16202d] p-5">
        {profile.avatarUrl ? (
          <Image
            src={profile.avatarUrl}
            alt=""
            width={64}
            height={64}
            className="rounded"
          />
        ) : (
          <div className="grid size-16 place-items-center rounded bg-[#2a3f5a] text-xl text-white">
            {profile.displayName.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-semibold text-white">
            {profile.displayName}
          </h1>
          <p className="text-sm text-[#8f98a0]">@{profile.username}</p>
          {steam?.profileUrl && (
            <a
              href={steam.profileUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#66c0f4] hover:text-white"
            >
              Steam profile
            </a>
          )}
        </div>

        {steam && (
          <div className="space-y-2 text-right">
            <div>
              <p className="text-2xl font-semibold text-white">
                {formatPlaytime(steam.playtimeMinutes)}
              </p>
              <p className="text-xs uppercase tracking-wide text-[#8f98a0]">
                Lifetime
              </p>
              <p className="text-[11px] text-[#5a6b7c]">from Steam</p>
            </div>
            {viewerIsOwner && (
              <RefreshPlaytimeButton lastSyncedAt={steam.syncedAt} />
            )}
          </div>
        )}
      </section>

      {steam && steam.playtimePublic && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SampledStat label="Last 2 weeks" delta={periods.twoWeeks} />
          <SampledStat label="Today" delta={periods.today} />
          <SampledStat label="This week" delta={periods.week} />
          <SampledStat label="This month" delta={periods.month} />
        </section>
      )}

      {steam && steam.playtimePublic && (
        <p className="text-xs text-[#5a6b7c]">
          Lifetime still comes from Steam. On first link we copy Steam&apos;s
          last 14 days onto this week / last 2 weeks / this month — never onto
          today. Today only grows from later refreshes. This week is the
          previous 7 UTC days. At midnight, today clears into this week.
          Tracking started{" "}
          {periods.sampledFrom
            ? periods.sampledFrom.toISOString().slice(0, 10)
            : "today"}
          .
        </p>
      )}

      {!steam && (
        <EmptyState
          title="No Steam account linked"
          body={
            viewerIsOwner
              ? "Link your Steam account to pull in your library and playtime."
              : `${profile.displayName} has not linked a Steam account yet.`
          }
          action={
            viewerIsOwner ? (
              <Link
                href="/auth/steam/login"
                className="inline-block rounded bg-[#66c0f4] px-4 py-2 text-sm font-medium text-[#1b2838] hover:bg-white"
              >
                Link Steam
              </Link>
            ) : null
          }
        />
      )}

      {steam && !steam.playtimePublic && (
        <EmptyState
          title="Game details are private"
          body={
            viewerIsOwner
              ? "Your Steam game details are set to private, so per-game playtime cannot be read. Change it in Steam privacy settings, then re-link."
              : `${profile.displayName} keeps their Steam game details private.`
          }
        />
      )}

      {steam && steam.playtimePublic && games.length === 0 && (
        <EmptyState
          title="No games with playtime"
          body={`${who} no games with recorded playtime yet.`}
        />
      )}

      {games.length > 0 && (
        <section className="rounded border border-[#2a3f5a] bg-[#16202d]">
          <header className="flex items-center justify-between border-b border-[#2a3f5a] px-5 py-3">
            <h2 className="text-sm font-medium uppercase tracking-wide text-[#8f98a0]">
              Games
            </h2>
            <span className="text-xs text-[#5a6b7c]">{games.length} titles</span>
          </header>

          <ul className="divide-y divide-[#2a3f5a]">
            {games.map((game) => (
              <li
                key={game.appId}
                className="flex items-center gap-3 px-5 py-3 text-sm"
              >
                {game.iconUrl ? (
                  <Image
                    src={game.iconUrl}
                    alt=""
                    width={32}
                    height={32}
                    className="rounded"
                  />
                ) : (
                  <div className="size-8 rounded bg-[#2a3f5a]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-white">{game.name}</p>
                  <p className="text-xs text-[#5a6b7c]">
                    {formatPlaytime(game.todayMinutes)} today
                    {" · "}
                    {formatPlaytime(game.weekMinutes)} this week
                    {game.weekMinutes === 0 && game.playtimeTwoWeeksMinutes > 0
                      ? ` · ${formatPlaytime(game.playtimeTwoWeeksMinutes)} last 2 weeks (Steam)`
                      : ""}
                    {game.lastPlayedAt
                      ? ` · last launched ${new Date(game.lastPlayedAt * 1000).toISOString().slice(0, 10)}`
                      : ""}
                  </p>
                </div>

                <p className="shrink-0 tabular-nums text-[#c7d5e0]">
                  {formatPlaytime(game.playtimeMinutes)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SteamStat({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="rounded border border-[#2a3f5a] bg-[#16202d] px-4 py-3">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs uppercase tracking-wide text-[#8f98a0]">{label}</p>
      <p className="text-[11px] text-[#5a6b7c]">{note}</p>
    </div>
  );
}

function periodNote(label: string, delta: PeriodDelta): string {
  const window =
    label === "Today"
      ? "today, UTC"
      : label === "This week"
        ? "previous 7 days"
        : label === "This month"
          ? "last 4 weeks"
          : "last 14 days";

  if (delta.source === "steam_2weeks") {
    return "Steam last 14 days";
  }
  if (delta.source === "since_tracking") {
    return `${window} · since we started watching`;
  }
  return `${window} · held`;
}

function SampledStat({
  label,
  delta,
  empty = "no held minutes yet",
}: {
  label: string;
  delta: PeriodDelta | null;
  empty?: string;
}) {
  if (!delta) {
    return <SteamStat label={label} value="—" note={empty} />;
  }

  return (
    <SteamStat
      label={label}
      value={formatPlaytime(delta.minutes)}
      note={periodNote(label, delta)}
    />
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded border border-[#2a3f5a] bg-[#16202d] p-5">
      <h2 className="text-sm font-medium text-white">{title}</h2>
      <p className="text-sm text-[#8f98a0]">{body}</p>
      {action}
    </section>
  );
}
