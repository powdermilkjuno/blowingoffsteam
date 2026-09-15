"use client";

import type { LeaderboardEntry } from "@/lib/dashboard-data";
import AvatarWithBio from "@/components/AvatarWithBio";

const SIZES = {
  md: {
    wrap: "corners border border-line bg-surface/70 p-6",
    plot: "mt-3 flex h-72 gap-3",
    avatar: 26,
    avatarClearance: 40,
    nameH: 18,
    axis: true,
    tooltips: true,
    names: true,
    heading: true,
    barGap: "gap-3",
  },
  sm: {
    wrap: "corners border border-line bg-surface/70 p-4",
    plot: "mt-2 flex h-52 gap-2",
    avatar: 22,
    avatarClearance: 34,
    nameH: 16,
    axis: true,
    tooltips: true,
    names: true,
    heading: true,
    barGap: "gap-2",
  },
  xs: {
    wrap: "rounded-sm border border-line/70 bg-surface/50 p-2",
    plot: "mt-1 flex h-24 gap-1",
    avatar: 16,
    avatarClearance: 22,
    nameH: 0,
    axis: false,
    tooltips: false,
    names: false,
    heading: false,
    barGap: "gap-1.5",
  },
} as const;

export default function TopFiveChart({
  rows,
  goal,
  size = "md",
  embedded = false,
  hideHeading = false,
}: {
  rows: LeaderboardEntry[];
  goal?: number | null;
  size?: keyof typeof SIZES;
  embedded?: boolean;
  hideHeading?: boolean;
}) {
  const spec = SIZES[size];
  const wrap = embedded
    ? size === "xs"
      ? "rounded-sm border border-current/20 bg-black/10 p-2"
      : size === "sm"
        ? "corners border border-current/25 bg-black/10 p-4"
        : "corners border border-current/25 bg-black/10 p-6"
    : spec.wrap;
  const showHeading = spec.heading && !hideHeading;
  const ordered = [...rows].sort((a, b) => a.hours - b.hours);
  const topHours = ordered.reduce((max, row) => Math.max(max, row.hours), 0);
  const maxHours = Math.max(topHours, goal ?? 0, 1);
  const showGoal = goal != null;
  const goalPct = showGoal
    ? Math.min(100, Math.round((goal / maxHours) * 100))
    : 0;

  return (
    <div className={wrap}>
      {showHeading ? (
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
      ) : null}

      {ordered.length === 0 ? (
        <p className="mt-4 text-center text-[10px] text-muted">No data yet.</p>
      ) : (
        <div className={spec.plot}>
          {spec.axis ? (
            <div className="flex h-full flex-col">
              <div
                className="shrink-0"
                style={{ height: spec.avatarClearance }}
              />
              <div className="flex min-h-0 flex-1 flex-col justify-between text-right text-xs tabular-nums text-muted">
                <span>{maxHours}h</span>
                <span>{Math.round((maxHours / 2) * 10) / 10}h</span>
                <span>0h</span>
              </div>
              {spec.names ? (
                <div
                  className="shrink-0"
                  style={{ height: spec.nameH }}
                />
              ) : null}
            </div>
          ) : null}

          <div className="flex min-h-0 min-w-0 flex-1 flex-col">
            <div
              className="shrink-0"
              style={{ height: spec.avatarClearance }}
            />
            <div className="relative min-h-0 flex-1">
              {showGoal ? (
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-danger/60"
                  style={{ bottom: `${goalPct}%` }}
                />
              ) : null}
              <div
                className={`grid h-full grid-cols-5 items-end ${spec.barGap} border-l border-line ${spec.axis ? "pl-3" : "pl-1.5"}`}
              >
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
                      className="group relative flex h-full min-w-0 items-end justify-center"
                    >
                      {spec.tooltips ? (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-sm border border-line bg-raised px-2 py-1 text-xs text-paper opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                        >
                          {row.name} · {row.hours}h
                          {overGoal ? " (over goal)" : ""}
                        </span>
                      ) : null}
                      <span
                        className="absolute left-1/2 z-[1]"
                        style={{
                          bottom: `${Math.max(pct, 2)}%`,
                          transform: "translate(-50%, calc(-100% - 6px))",
                        }}
                      >
                        <AvatarWithBio
                          name={row.name}
                          bio={row.bio}
                          avatarUrl={row.avatarUrl}
                          size={spec.avatar}
                          frame={row.frame}
                          font={row.font}
                          nameColor={row.nameColor}
                        />
                      </span>
                      <div
                        className={`w-full max-w-[2.5rem] rounded-sm transition-opacity group-hover:opacity-80 ${tone}`}
                        style={{ height: `${Math.max(pct, 2)}%` }}
                        title={
                          spec.tooltips
                            ? `${row.name} · ${row.hours}h${overGoal ? " (over goal)" : ""}`
                            : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            {spec.names ? (
              <div
                className={`mt-1.5 grid grid-cols-5 ${spec.barGap} ${spec.axis ? "pl-3" : "pl-1.5"}`}
                style={{ height: spec.nameH }}
              >
                {ordered.map((row, i) => (
                  <span
                    key={`${row.name}-label-${i}`}
                    className="truncate text-center text-[10px] leading-tight text-muted"
                    title={row.name}
                  >
                    {row.name}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
