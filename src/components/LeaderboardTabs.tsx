"use client";

import { useState } from "react";
import type {
  LeaderboardBoards,
  LeaderboardEntry,
  LeaderboardGroupBoard,
} from "@/lib/dashboard-data";
import { GROUP_ACCENTS, type GroupAccent } from "@/lib/group-accent";
import HighScoreRow from "@/components/HighScoreRow";

const tabs = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

export default function LeaderboardTabs({
  group,
  friends,
}: {
  group: LeaderboardGroupBoard | null;
  friends: LeaderboardBoards;
}) {
  const [period, setPeriod] = useState<keyof LeaderboardBoards>("today");

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
        />
      ) : (
        <p className="mt-5 text-sm text-muted">
          Star a group on Groups to rank it here. If you only have one group,
          it shows automatically.
        </p>
      )}

      <Board title="Friends" rows={friends[period]} />
    </div>
  );
}

function Board({
  title,
  rows,
  accent,
  description,
}: {
  title: string;
  rows: LeaderboardEntry[];
  accent?: GroupAccent;
  description?: string;
}) {
  const tint = accent ? GROUP_ACCENTS[accent] : null;

  return (
    <div
      className={`scanlines -mx-5 mt-5 overflow-visible border-t border-line bg-raised px-4 pb-5 pt-6 last:-mb-5 ${tint?.border ?? ""}`}
    >
      <h3
        className={`text-center font-pixel text-base tracking-wide ${tint?.title ?? "text-clay"}`}
      >
        {title}
      </h3>
      {description ? (
        <p className="mt-2 text-center text-xs text-muted">{description}</p>
      ) : null}

      <div className="mt-6 flex items-center gap-3 px-4 pb-2 font-pixel text-[10px] tracking-wide text-fern">
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
