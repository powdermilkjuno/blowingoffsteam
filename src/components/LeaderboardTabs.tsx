"use client";

import { useState } from "react";
import Image from "next/image";
import type {
  LeaderboardBoards,
  LeaderboardEntry,
  LeaderboardGroupBoard,
} from "@/lib/dashboard-data";
import { GROUP_ACCENTS, type GroupAccent } from "@/lib/group-accent";
import HighScoreRow from "@/components/HighScoreRow";

function initials(name: string): string {
  return name
    .split(/[_\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

function hoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

const tabs = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

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
  const capMinutes = period === "all" ? null : goalHours[period];
  const goal = capMinutes == null ? null : hoursFromMinutes(capMinutes);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1 border-b border-line pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setPeriod(tab.key)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              period === tab.key
                ? "bg-signal text-ink"
                : "text-paper hover:bg-raised hover:text-signal"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {group ? (
        <Board
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

      <Board title="Friends" rows={friends[period]} goal={goal} />
    </div>
  );
}

function Board({
  title,
  rows,
  accent,
  description,
  goal,
}: {
  title: string;
  rows: LeaderboardEntry[];
  accent?: GroupAccent;
  description?: string;
  goal: number | null;
}) {
  const tint = accent ? GROUP_ACCENTS[accent] : null;
  const topFive = rows.slice(0, 5);

  return (
    <div
      className={`scanlines -mx-5 mt-5 overflow-visible px-4 pb-5 pt-6 last:-mb-5 ${
        tint?.card ?? "border-t border-line bg-raised"
      }`}
    >
      <h3
        className={`text-center font-pixel text-base tracking-wide ${tint?.title ?? "text-clay"}`}
      >
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-center text-xs text-muted">{description}</p>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,20rem)]">
        <TopFiveChart rows={topFive} goal={goal} />

        <div>
          <div className="flex items-center gap-3 px-4 pb-2 font-pixel text-[10px] tracking-wide text-fern">
            <span className="w-14 shrink-0">Rank</span>
            <span className="w-7 shrink-0" />
            <span className="flex-1">Name</span>
            <span className="w-24 shrink-0 text-right">Hours</span>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TopFiveChart({
  rows,
  goal,
}: {
  rows: LeaderboardEntry[];
  goal: number | null;
}) {
  const ordered = [...rows].sort((a, b) => a.hours - b.hours);
  const topHours = ordered.reduce((max, row) => Math.max(max, row.hours), 0);
  const maxHours = Math.max(topHours, goal ?? 0, 1);
  const showGoal = goal != null;
  const goalPct = showGoal
    ? Math.min(100, Math.round((goal / maxHours) * 100))
    : 0;

  return (
    <div className="corners border border-line bg-surface/70 p-6">
      <div className="grid grid-cols-3 items-center">
        {showGoal ? (
          <span className="text-xs text-muted">Goal: {goal}h</span>
        ) : (
          <span />
        )}
        <h3 className="text-center font-pixel text-sm tracking-wide text-clay">
          Top 5
        </h3>
        <span />
      </div>

      {ordered.length === 0 ? (
        <p className="mt-6 text-center text-xs text-muted">No data yet.</p>
      ) : (
        <div className="relative mt-16 flex h-72 gap-3">
          <div className="flex h-full flex-col justify-between text-right text-xs tabular-nums text-muted">
            <span>{maxHours}h</span>
            <span>{Math.round((maxHours / 2) * 10) / 10}h</span>
            <span>0h</span>
          </div>

          <div className="relative grid flex-1 grid-cols-5 items-end gap-4 border-l border-line pl-4">
            {showGoal ? (
              <div
                className="pointer-events-none absolute inset-x-4 border-t border-dashed border-danger/60"
                style={{ bottom: `${goalPct}%` }}
              />
            ) : null}

            {ordered.map((row, i) => {
              const pct = Math.min(
                100,
                Math.round((row.hours / maxHours) * 100),
              );
              const overGoal =
                row.isUser && goal != null && row.hours > goal;
              const tone = overGoal
                ? "bg-danger animate-pulse"
                : row.isUser
                  ? "bg-signal"
                  : i < 3
                    ? "bg-clay"
                    : "bg-moss";

              return (
                <div
                  key={`${row.name}-${i}`}
                  className="group flex h-full flex-col items-center justify-end gap-2"
                >
                  <div className="relative flex w-full flex-1 items-end">
                    <span
                      role="tooltip"
                      className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm border border-line bg-raised px-2 py-1 text-xs text-paper opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                    >
                      {row.name} · {row.hours}h
                      {overGoal ? " (over goal)" : ""}
                    </span>
                    <span
                      className="absolute left-1/2"
                      style={{
                        bottom: `${pct}%`,
                        transform: "translate(-50%, calc(-100% - 6px))",
                      }}
                    >
                      {row.avatarUrl ? (
                        <Image
                          src={row.avatarUrl}
                          alt=""
                          width={26}
                          height={26}
                          className="h-[26px] w-[26px] rounded object-cover ring-1 ring-line"
                        />
                      ) : (
                        <span className="flex h-[26px] w-[26px] items-center justify-center rounded bg-moss/70 font-mono text-[9px] text-paper ring-1 ring-line">
                          {initials(row.name)}
                        </span>
                      )}
                    </span>
                    <div
                      className={`w-full rounded-sm transition-opacity group-hover:opacity-80 ${tone}`}
                      style={{ height: `${pct}%` }}
                      title={`${row.name} · ${row.hours}h${overGoal ? " (over goal)" : ""}`}
                    />
                  </div>
                  <span
                    className="w-full truncate text-center text-xs text-muted"
                    title={row.name}
                  >
                    {row.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
