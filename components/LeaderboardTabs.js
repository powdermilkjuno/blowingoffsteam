"use client";

import { useState } from "react";
import HighScoreRow from "@/components/HighScoreRow";

const datasets = {
  week: [
    { rank: 1, name: "mira_kwon", hours: 34.2, delta: 1 },
    { rank: 2, name: "devon_r", hours: 29.8, delta: -1 },
    { rank: 3, name: "alex_chen", hours: 21.6, delta: 2, isUser: true },
    { rank: 4, name: "priya.s", hours: 18.4, delta: 0 },
    { rank: 5, name: "tomas_lg", hours: 15.1, delta: -1 },
    { rank: 6, name: "kenji_o", hours: 13.7, delta: 1 },
    { rank: 7, name: "sam_iw", hours: 11.2, delta: 0 },
    { rank: 8, name: "hana_bell", hours: 9.6, delta: -2 },
    { rank: 9, name: "leo_marsh", hours: 7.8, delta: 1 },
    { rank: 10, name: "yuki_tan", hours: 5.4, delta: 0 },
  ],
  month: [
    { rank: 1, name: "devon_r", hours: 112.4, delta: 2 },
    { rank: 2, name: "mira_kwon", hours: 108.9, delta: -1 },
    { rank: 3, name: "alex_chen", hours: 86.3, delta: 0, isUser: true },
    { rank: 4, name: "kenji_o", hours: 71.5, delta: 3 },
    { rank: 5, name: "priya.s", hours: 68.2, delta: -1 },
    { rank: 6, name: "tomas_lg", hours: 60.7, delta: -2 },
    { rank: 7, name: "hana_bell", hours: 52.1, delta: 1 },
    { rank: 8, name: "sam_iw", hours: 47.9, delta: 0 },
    { rank: 9, name: "leo_marsh", hours: 39.4, delta: -1 },
    { rank: 10, name: "yuki_tan", hours: 28.8, delta: 2 },
  ],
  all: [
    { rank: 1, name: "mira_kwon", hours: 1042.6, delta: 0 },
    { rank: 2, name: "devon_r", hours: 981.3, delta: 0 },
    { rank: 3, name: "kenji_o", hours: 734.0, delta: 1 },
    { rank: 4, name: "alex_chen", hours: 612.8, delta: -1, isUser: true },
    { rank: 5, name: "priya.s", hours: 588.4, delta: 0 },
    { rank: 6, name: "tomas_lg", hours: 501.2, delta: 0 },
    { rank: 7, name: "hana_bell", hours: 447.9, delta: 0 },
    { rank: 8, name: "sam_iw", hours: 398.5, delta: 0 },
    { rank: 9, name: "leo_marsh", hours: 322.1, delta: 0 },
    { rank: 10, name: "yuki_tan", hours: 266.7, delta: 0 },
  ],
};

const tabs = [
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
];

export default function LeaderboardTabs() {
  const [period, setPeriod] = useState("week");
  const rows = datasets[period];

  return (
    <div>
      <div className="flex items-center gap-1 border-b border-line pb-4">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setPeriod(t.key)}
            className={`rounded px-3 py-1.5 text-sm transition-colors ${
              period === t.key
                ? "bg-raised text-signal"
                : "text-muted hover:text-paper"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="-mx-5 -mb-5 mt-5 border-t border-line bg-raised px-4 pb-5 pt-6">
        <h3 className="text-center font-pixel text-base tracking-wide text-clay">
          High Scores
        </h3>

        <div className="mt-6 flex items-center gap-3 px-4 pb-2 font-pixel text-[10px] tracking-wide text-fern">
          <span className="w-14 flex-shrink-0">Rank</span>
          <span className="w-7 flex-shrink-0" />
          <span className="flex-1">Name</span>
          <span className="hidden w-16 flex-shrink-0 text-right sm:block">Trend</span>
          <span className="w-24 flex-shrink-0 text-right">Hours</span>
        </div>

        <div className="space-y-0.5">
          {rows.map((r) => (
            <HighScoreRow key={r.name} detailed {...r} />
          ))}
        </div>
      </div>
    </div>
  );
}
