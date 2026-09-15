import type { DashboardData, LeaderboardBoards } from "@/lib/dashboard-data";
import type { GroupAccent } from "@/lib/group-accent";
import { formatPlaytime } from "@/lib/db/profiles";
import type { PeriodDelta } from "@/lib/db/daily";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import StatPill from "@/components/StatPill";
import MiniLeaderboard from "@/components/MiniLeaderboard";
import { SteamButton } from "../auth/_components/social-buttons";
import { RefreshPlaytimeButton } from "../dashboard/refresh-button";
import AvatarWithBio from "@/components/AvatarWithBio";
import NameWithBio from "@/components/NameWithBio";
import { BadgeLegend, BadgeRow } from "@/components/StreakBadge";
import { GameList } from "./game-list";

export function PlaytimeView({
  data,
  viewerIsOwner,
  leaderboard,
  leaderboardTitle = "Leaderboard",
  leaderboardHref = "/leaderboard",
  leaderboardAccent,
  leaderboardDescription,
  leaderboardGoalHours,
}: {
  data: DashboardData;
  viewerIsOwner: boolean;
  leaderboard?: LeaderboardBoards;
  leaderboardTitle?: string;
  leaderboardHref?: string;
  leaderboardAccent?: GroupAccent;
  leaderboardDescription?: string;
  leaderboardGoalHours?: {
    today: number | null;
    week: number | null;
    month: number | null;
  };
}) {
  const { profile, steam, games, periods, displayTimeZone } = data;
  const who = viewerIsOwner ? "You have" : `${profile.displayName} has`;

  const profileCard = (
    <Card className="corners flex h-full flex-col p-6" radius="lg">
      <div className="flex items-start gap-4">
        <AvatarWithBio
          name={profile.displayName}
          bio={profile.bio}
          avatarUrl={profile.avatarUrl}
          size={56}
          frame={profile.equippedFrame}
          font={profile.equippedFont} nameColor={profile.equippedNameColor}
        />

        <div className="min-w-0 flex-1">
          <NameWithBio
            name={profile.displayName}
            bio={profile.bio}
            className="truncate text-sm text-paper"
            font={profile.equippedFont} nameColor={profile.equippedNameColor}
          />
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

      <div className="mt-5 border-t border-line pt-5">
        <BadgeLegend
          archetype={profile.archetype}
          streaks={data.streaks}
          caps={profile}
        />
      </div>

      {steam ? (
        <div className="mt-auto grid grid-cols-3 divide-x divide-line border-t border-line pt-5">
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
      ) : null}
    </Card>
  );

  return (
    <div className="space-y-6">
      <PageIntro
        kicker={viewerIsOwner ? "Welcome back" : "Friend"}
        title={
          <NameWithBio name={profile.displayName} bio={profile.bio} font={profile.equippedFont} nameColor={profile.equippedNameColor} />
        }
        aside={
          <BadgeRow
            archetype={profile.archetype}
            streaks={data.streaks}
            caps={profile}
            nowrap
            className=""
          />
        }
      >
        @{profile.username}
      </PageIntro>

      {leaderboard ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-full lg:col-span-2">
            <MiniLeaderboard
              boards={leaderboard}
              title={leaderboardTitle}
              href={leaderboardHref}
              featured
              chartOnly
              actionLabel={leaderboardHref.startsWith("/groups/") ? "Open group" : "View all"}
              accent={leaderboardAccent}
              description={leaderboardDescription}
              goalHours={leaderboardGoalHours}
            />
          </div>
          {profileCard}
        </div>
      ) : (
        profileCard
      )}

      {steam && steam.playtimePublic && (
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SampledStat label="Today" delta={periods.today} />
          <SampledStat label="This week" delta={periods.week} />
          <SampledStat label="Last 2 weeks" delta={periods.twoWeeks} />
          <SampledStat label="This month" delta={periods.month} />
        </section>
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
