"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import type { DashboardGame } from "@/lib/dashboard-data";
import { formatLastPlayedAt, formatPlaytime } from "@/lib/db/profiles";

const SORT_STORAGE_KEY = "bos_game_sort";

export type GameSort = "last-played" | "lifetime";

function sortGames(games: DashboardGame[], sort: GameSort): DashboardGame[] {
  return [...games].sort((a, b) => {
    if (sort === "last-played") {
      const last = (b.lastPlayedAt ?? 0) - (a.lastPlayedAt ?? 0);
      if (last !== 0) return last;
    }
    return b.playtimeMinutes - a.playtimeMinutes;
  });
}

export function GameList({
  games,
  displayTimeZone,
}: {
  games: DashboardGame[];
  displayTimeZone: string;
}) {
  const [sort, setSort] = useState<GameSort>("last-played");

  useEffect(() => {
    const saved = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (saved === "last-played" || saved === "lifetime") setSort(saved);
  }, []);

  function chooseSort(next: GameSort) {
    setSort(next);
    window.localStorage.setItem(SORT_STORAGE_KEY, next);
  }

  const ordered = useMemo(() => sortGames(games, sort), [games, sort]);

  return (
    <section className="corners overflow-hidden rounded-sm border border-line bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-raised/50 px-5 py-3">
        <h2 className="kicker">Games</h2>
        <div className="flex items-center gap-3">
          <div className="flex overflow-hidden rounded-sm border border-line text-xs">
            <SortButton
              active={sort === "last-played"}
              onClick={() => chooseSort("last-played")}
            >
              Last played
            </SortButton>
            <SortButton
              active={sort === "lifetime"}
              onClick={() => chooseSort("lifetime")}
            >
              Lifetime
            </SortButton>
          </div>
          <span className="text-xs text-muted">{games.length} titles</span>
        </div>
      </header>

      <ul className="divide-y divide-line">
        {ordered.map((game) => (
          <li
            key={game.appId}
            className="flex items-center gap-3 px-5 py-3 text-sm transition-colors hover:bg-raised/70"
          >
            {game.iconUrl ? (
              <Image
                src={game.iconUrl}
                alt=""
                width={32}
                height={32}
                className="rounded-sm"
              />
            ) : (
              <div className="size-8 rounded-sm bg-raised" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-paper">{game.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {formatPlaytime(game.todayMinutes)} today
                {" · "}
                {formatPlaytime(game.weekMinutes)} this week
                {game.weekMinutes === 0 && game.playtimeTwoWeeksMinutes > 0
                  ? ` · ${formatPlaytime(game.playtimeTwoWeeksMinutes)} last 2 weeks (Steam)`
                  : ""}
              </p>
              {game.lastPlayedAt ? (
                <p className="mt-0.5 text-xs text-clay2">
                  Last played{" "}
                  {formatLastPlayedAt(game.lastPlayedAt, displayTimeZone)}
                </p>
              ) : null}
            </div>

            <p className="shrink-0 tabular-nums text-clay">
              {formatPlaytime(game.playtimeMinutes)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SortButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "bg-signal px-2.5 py-1 font-medium text-ink"
          : "bg-surface px-2.5 py-1 text-paper hover:bg-raised hover:text-signal"
      }
    >
      {children}
    </button>
  );
}
