"use client";

import { useRef, useState, type PointerEvent } from "react";
import Link from "next/link";
import type {
  LeaderboardBoards,
  LeaderboardEntry,
} from "@/lib/dashboard-data";
import { hoursFromMinutes } from "@/lib/hours";
import { GROUP_ACCENTS, type GroupAccent } from "@/lib/group-accent";
import Card from "@/components/Card";
import HighScoreRow from "@/components/HighScoreRow";
import TopFiveChart from "@/components/TopFiveChart";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "all", label: "All time" },
] as const;

type Period = (typeof PERIODS)[number]["key"];

export default function MiniLeaderboard({
  entries,
  boards,
  href = "/leaderboard",
  title = "Leaderboard",
  featured = false,
  actionLabel = "View all",
  accent,
  description,
  goalMinutes,
  goalHours,
  chartOnly = false,
}: {
  entries?: LeaderboardEntry[];
  boards?: LeaderboardBoards;
  href?: string;
  title?: string;
  featured?: boolean;
  actionLabel?: string;
  accent?: GroupAccent;
  description?: string;
  goalMinutes?: number | null;
  goalHours?: {
    today: number | null;
    week: number | null;
    month: number | null;
  };
  chartOnly?: boolean;
}) {
  const [period, setPeriod] = useState<Period>("today");
  const startX = useRef<number | null>(null);
  const tint = accent ? GROUP_ACCENTS[accent] : null;

  const chartRows = boards
    ? boards[period]
    : (entries ?? []);
  const listRows = entries ?? boards?.today ?? [];
  const visible = featured ? Math.max(listRows.length, 1) : 3;
  const rows = listRows.slice(0, visible);

  const capMinutes =
    period === "all"
      ? null
      : (goalHours?.[period] ?? (period === "today" ? goalMinutes : null) ?? null);
  const goal = capMinutes == null ? null : hoursFromMinutes(capMinutes);
  const periodLabel =
    PERIODS.find((item) => item.key === period)?.label ?? "Today";

  function shiftPeriod(delta: number) {
    const index = PERIODS.findIndex((item) => item.key === period);
    const next = index + delta;
    if (next < 0 || next >= PERIODS.length) return;
    setPeriod(PERIODS[next].key);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (startX.current == null) return;
    const dx = event.clientX - startX.current;
    startX.current = null;
    if (Math.abs(dx) < 40) return;
    shiftPeriod(dx < 0 ? 1 : -1);
  }

  if (chartOnly) {
    return (
      <Card
        tone={tint ? "plain" : "panel"}
        className={`corners scanlines flex h-full flex-col p-6 ${tint?.card ?? ""}`}
        radius="lg"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="kicker">{periodLabel}</p>
            <h2
              className={`mt-1 truncate text-sm tracking-tight ${tint?.title ?? "text-paper"}`}
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 truncate text-xs text-muted">{description}</p>
            ) : null}
          </div>
          <Link
            href={href}
            className="shrink-0 text-xs text-fern hover:text-signal"
          >
            {actionLabel}
          </Link>
        </div>

        {boards ? (
          <div className="mt-4 flex flex-wrap items-center gap-1">
            {PERIODS.map((tab) => (
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
        ) : null}

        <div
          className="flex min-h-0 flex-1 touch-pan-y items-center justify-center py-6"
          onPointerDown={boards ? onPointerDown : undefined}
          onPointerUp={boards ? onPointerUp : undefined}
          onPointerCancel={() => {
            startX.current = null;
          }}
        >
          <div className="w-full max-w-xl">
            <TopFiveChart
              rows={chartRows.slice(0, 5)}
              goal={goal}
              size="md"
              embedded
              hideHeading
            />
            {boards ? (
              <p className="mt-3 text-center text-[10px] text-muted sm:hidden">
                Swipe to change timeframe
              </p>
            ) : null}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card
      tone={tint ? "plain" : "panel"}
      className={`corners flex h-full flex-col p-5 ${tint?.card ?? ""}`}
      radius="lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className={`truncate text-sm ${tint?.title ?? "text-paper"}`}>
            {title}
          </h2>
          {description ? (
            <p className="mt-0.5 truncate text-xs text-muted">{description}</p>
          ) : null}
          <p className="mt-0.5 text-[10px] text-muted">Today</p>
        </div>
        <Link href={href} className="shrink-0 text-xs text-fern hover:text-signal">
          {actionLabel}
        </Link>
      </div>

      <div className="mt-4">
        <TopFiveChart
          rows={(entries ?? []).slice(0, 5)}
          goal={
            goalMinutes == null ? null : hoursFromMinutes(goalMinutes)
          }
          size="sm"
          embedded={Boolean(tint)}
        />
      </div>

      <div className="scanlines -mx-5 -mb-5 mt-4 flex-1 overflow-visible border-t border-line bg-raised pb-5 pt-5">
        <div className="flex items-center gap-3 px-4 pb-2 font-pixel text-[9px] tracking-wide text-fern">
          <span className="w-14 shrink-0">Rank</span>
          <span className="w-7 shrink-0" />
          <span className="flex-1">Name</span>
          <span className="w-24 shrink-0 text-right">Hours</span>
        </div>

        <div className="space-y-0.5">
          {featured ? (
            rows.length === 0 ? (
              <EmptyRow />
            ) : (
              rows.map((row, index) => (
                <MiniRow
                  key={`${row.name}-${index}`}
                  rank={index + 1}
                  row={row}
                />
              ))
            )
          ) : (
            Array.from({ length: 3 }).map((_, index) =>
              rows[index] ? (
                <MiniRow
                  key={`${rows[index].name}-${index}`}
                  rank={index + 1}
                  row={rows[index]}
                />
              ) : (
                <EmptyRow key={`empty-${index}`} />
              ),
            )
          )}
        </div>
      </div>
    </Card>
  );
}

function MiniRow({ rank, row }: { rank: number; row: LeaderboardEntry }) {
  return (
    <HighScoreRow
      rank={rank}
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
  );
}

function EmptyRow() {
  return (
    <div className="flex items-center gap-3 px-4 py-2 font-pixel text-[11px] tracking-wide text-muted">
      <span className="w-14 shrink-0">—</span>
      <span className="h-7 w-7 shrink-0" />
      <span className="flex-1">—</span>
      <span className="w-24 shrink-0 text-right">—</span>
    </div>
  );
}
