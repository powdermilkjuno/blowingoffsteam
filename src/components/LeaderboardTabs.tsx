"use client";

import { useState } from "react";
import type { LeaderboardBoards, LeaderboardEntry } from "@/lib/dashboard-data";
import HighScoreRow from "@/components/HighScoreRow";

const tabs = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

export default function LeaderboardTabs({
  boards,
}: {
  boards: LeaderboardBoards;
}) {
  const [period, setPeriod] = useState<keyof LeaderboardBoards>("week");
  const rows = boards[period];

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-line pb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setPeriod(t.key)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              period === t.key
                ? "bg-signal text-ink"
                : "text-paper hover:bg-raised hover:text-signal"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="scanlines -mx-5 -mb-5 mt-5 border-t border-line bg-raised px-4 pb-5 pt-6">
        <h3 className="text-center font-pixel text-base tracking-wide text-clay">
          High Scores
        </h3>

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
              <BoardRow key={`${row.name}-${index}`} rank={index + 1} row={row} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoardRow({ rank, row }: { rank: number; row: LeaderboardEntry }) {
  return (
    <HighScoreRow
      rank={rank}
      name={row.name}
      hours={row.hours}
      isUser={row.isUser}
    />
  );
}
