import Image from "next/image";
import type { DashboardData } from "@/lib/dashboard-data";
import { formatPlaytime } from "@/lib/db/profiles";
import type { PeriodDelta } from "@/lib/db/daily";
import Card from "@/components/Card";
import StatPill from "@/components/StatPill";
import { SteamButton } from "../auth/_components/social-buttons";
import { RefreshPlaytimeButton } from "../dashboard/refresh-button";
import { GameList } from "./game-list";

export function PlaytimeView({
  data,
  viewerIsOwner,
}: {
  data: DashboardData;
  viewerIsOwner: boolean;
}) {
  const { profile, steam, games, periods, displayTimeZone } = data;
  const who = viewerIsOwner ? "You have" : `${profile.displayName} has`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-fern">
          {viewerIsOwner ? "Welcome back" : "Friend"}
        </p>
        <h1 className="mt-1 truncate text-2xl tracking-tight text-paper">
          {profile.displayName}
        </h1>
        <p className="mt-1 text-sm text-muted">@{profile.username}</p>
      </div>

      <Card className="corners p-6" radius="lg">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <Image
              src={profile.avatarUrl}
              alt=""
              width={56}
              height={56}
              className="rounded"
            />
          ) : (
            <div className="grid size-14 place-items-center rounded bg-moss/70 text-lg text-paper">
              {profile.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-paper">{profile.displayName}</p>
            {steam?.profileUrl ? (
              <a
                href={steam.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-fern hover:text-signal"
              >
                Steam profile
              </a>
            ) : (
              <p className="text-xs text-muted">No Steam link yet</p>
            )}
          </div>

          {steam && viewerIsOwner && (
            <RefreshPlaytimeButton
              lastSyncedAt={steam.syncedAt}
              timeZone={displayTimeZone}
            />
          )}
        </div>

        {steam && (
          <div className="mt-6 grid grid-cols-3 divide-x divide-line border-t border-line pt-5">
            <div>
              <p className="text-xs text-fern">This week</p>
              <p className="mt-1.5 text-xl tracking-tight text-paper">
                {formatPlaytime(periods.week?.minutes ?? 0)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-fern">Today</p>
              <p className="mt-1.5 text-xl tracking-tight text-paper">
                {formatPlaytime(periods.today?.minutes ?? 0)}
              </p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-fern">Lifetime</p>
              <p className="mt-1.5 text-xl tracking-tight text-paper">
                {formatPlaytime(steam.playtimeMinutes)}
              </p>
              <p className="mt-1 text-xs text-muted">from Steam</p>
            </div>
          </div>
        )}
      </Card>

      {steam && steam.playtimePublic && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SampledStat label="Last 2 weeks" delta={periods.twoWeeks} />
          <SampledStat label="Today" delta={periods.today} />
          <SampledStat label="This week" delta={periods.week} />
          <SampledStat label="This month" delta={periods.month} />
        </section>
      )}

      {steam && steam.playtimePublic && (
        <p className="text-xs leading-relaxed text-muted">
          Lifetime is Steam&apos;s number. Today only grows from later
          refreshes. This week is the last 7 days, including today. Midnight
          is {displayTimeZone.replaceAll("_", " ")}. Tracking started{" "}
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
              ? "Link Steam to pull your library and playtime."
              : `${profile.displayName} has not linked Steam yet.`
          }
          action={
            viewerIsOwner ? (
              <SteamButton caption="Official Steam sign-in. We only read playtime." />
            ) : null
          }
        />
      )}

      {steam && !steam.playtimePublic && (
        <EmptyState
          title="Game details are private"
          body={
            viewerIsOwner
              ? "Steam game details are private, so per-game playtime cannot be read. Change it in Steam privacy settings, then refresh."
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
        <GameList games={games} displayTimeZone={displayTimeZone} />
      )}
    </div>
  );
}

function periodNote(label: string, delta: PeriodDelta): string {
  const window =
    label === "Today"
      ? "today"
      : label === "This week"
        ? "last 7 days"
        : label === "This month"
          ? "last 4 weeks"
          : "last 14 days";

  if (delta.source === "steam_2weeks") return "Steam last 14 days";
  if (delta.source === "since_tracking") {
    return `${window} · since we started watching`;
  }
  return `${window} · held`;
}

function SampledStat({
  label,
  delta,
}: {
  label: string;
  delta: PeriodDelta | null;
}) {
  if (!delta) {
    return <StatPill label={label} value="—" sub="no held minutes yet" />;
  }

  return (
    <StatPill
      label={label}
      value={formatPlaytime(delta.minutes)}
      sub={periodNote(label, delta)}
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
    <Card className="corners space-y-3 p-6">
      <h2 className="text-sm text-paper">{title}</h2>
      <p className="text-sm text-muted">{body}</p>
      {action}
    </Card>
  );
}
