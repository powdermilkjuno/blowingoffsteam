"use client";

import { useEffect, useState } from "react";
import type {
  LeaderboardBoards,
  LeaderboardEntry,
  LeaderboardGroupBoard,
} from "@/lib/dashboard-data";
import { hoursFromMinutes } from "@/lib/hours";
import { GROUP_ACCENTS, type GroupAccent } from "@/lib/group-accent";
import HighScoreRow from "@/components/HighScoreRow";
import TopFiveChart from "@/components/TopFiveChart";

const tabs = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

// Tailwind's `lg` breakpoint (1024px) — below this we swap to a smaller
// chart variant instead of letting a desktop-sized chart force overflow.
const MOBILE_QUERY = "(max-width: 1023px)";

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY);
    setIsMobile(mql.matches);
    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, []);

  return isMobile;
}

function goalForPeriod(
  period: keyof LeaderboardBoards,
  goalHours: {
    today: number | null;
    week: number | null;
    month: number | null;
  },
): number | null {
  if (period === "all") return null;
  const capMinutes = goalHours[period];
  return capMinutes == null ? null : hoursFromMinutes(capMinutes);
}

function PeriodTabs({
  period,
  onPeriod,
}: {
  period: keyof LeaderboardBoards;
  onPeriod: (key: keyof LeaderboardBoards) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-line pb-4">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onPeriod(tab.key)}
          className={`rounded-md px-4 py-2.5 text-sm transition-colors lg:rounded lg:px-3 lg:py-1.5 ${
            period === tab.key
              ? "bg-signal text-ink"
              : "text-paper hover:bg-raised hover:text-signal"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

export function LeaderboardBoard({
  title,
  rows,
  accent,
  description,
  goal,
  chartSize = "md",
}: {
  title: string;
  rows: LeaderboardEntry[];
  accent?: GroupAccent;
  description?: string;
  goal: number | null;
  chartSize?: "md" | "sm" | "xs";
}) {
  const tint = accent ? GROUP_ACCENTS[accent] : null;
  const topFive = rows.slice(0, 5);
  const isMobile = useIsMobile();
  const effectiveChartSize = isMobile ? "sm" : chartSize;

  return (
    <div
      className={
        tint
          ? "mt-5 overflow-visible pt-2"
          : "scanlines -mx-5 mt-5 overflow-visible border-t border-line bg-raised px-4 pb-5 pt-6 last:-mb-5"
      }
    >
      <h3
        className={`text-center font-pixel text-lg tracking-wide lg:text-base ${tint?.title ?? "text-clay"}`}
      >
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-center text-xs text-muted">{description}</p>
      ) : null}

      <div className="mt-6 grid gap-5 lg:gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,32rem)]">
        <TopFiveChart
          rows={topFive}
          goal={goal}
          size={effectiveChartSize}
          embedded={Boolean(tint)}
        />

        <div>
          <div className="flex items-center gap-3 px-3 pb-2 font-pixel text-[11px] tracking-wide text-fern lg:gap-3 lg:px-4 lg:text-[10px]">
            <span className="w-12 shrink-0 lg:w-14">Rank</span>
            <span className="w-8 shrink-0 lg:w-7" />
            <span className="flex-1">Name</span>
            <span className="w-20 shrink-0 text-right lg:w-24">Hours</span>
          </div>

          {rows.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted">
              No playtime to rank yet. Refresh after Steam is linked.
            </p>
          ) : (
            <div className="space-y-0.5">
              {rows.map((row, index) => (
                <HighScoreRow
                  key={`${title}-${row.name}-${index}`}
                  rank={index + 1}
                  name={row.name}
                  hours={row.hours}
                  avatarUrl={row.avatarUrl}
                  isUser={row.isUser}
                  bio={row.bio}
                  showBadges
                  archetype={row.archetype}
                  streaks={row.streaks}
                  caps={row.caps}
                  frame={row.frame}
                  font={row.font}
                  nameColor={row.nameColor}
                  flushPlate={Boolean(tint)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function GroupLeaderboard({
  boards,
  goalHours,
  title,
  description,
  accent,
}: {
  boards: LeaderboardBoards;
  goalHours: {
    today: number | null;
    week: number | null;
    month: number | null;
  };
  title: string;
  description?: string;
  accent?: GroupAccent;
}) {
  const [period, setPeriod] = useState<keyof LeaderboardBoards>("today");

  return (
    <div>
      <PeriodTabs period={period} onPeriod={setPeriod} />
      <LeaderboardBoard
        title={title}
        rows={boards[period]}
        accent={accent}
        description={description}
        goal={goalForPeriod(period, goalHours)}
      />
    </div>
  );
}

export default function LeaderboardTabs({
  group,
  friends,
  goalHours,
}: {
  group: LeaderboardGroupBoard | null;
  friends: LeaderboardBoards;
  goalHours: {
    today: number | null;
    week: number | null;
    month: number | null;
  };
}) {
  const [period, setPeriod] = useState<keyof LeaderboardBoards>("today");
  const goal = goalForPeriod(period, goalHours);

  return (
    <div>
      <PeriodTabs period={period} onPeriod={setPeriod} />

      {group ? (
        <LeaderboardBoard
          title={group.starred ? `Starred · ${group.name}` : group.name}
          rows={group.boards[period]}
          accent={group.accent}
          description={group.description}
          goal={goal}
        />
      ) : (
        <p className="mt-5 text-sm text-muted">
          Star a group on Groups to rank it here. If you only have one group,
          it shows automatically.
        </p>
      )}

      <LeaderboardBoard title="Friends" rows={friends[period]} goal={goal} />
    </div>
  );
}