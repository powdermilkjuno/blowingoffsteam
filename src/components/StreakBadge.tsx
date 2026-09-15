"use client";

import {
  ArchiveIcon,
  CalendarIcon,
  TokensIcon,
} from "@radix-ui/react-icons";
import * as Tooltip from "@radix-ui/react-tooltip";
import type { Archetype } from "@/lib/db/profiles";
import {
  streakHover,
  streakTone,
  type StreakKind,
  type Streaks,
} from "@/lib/streaks";
import { ArchetypeBadge, IconSquare } from "@/components/ArchetypeBadge";

const LABELS: Record<StreakKind, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
};

const ICONS: Record<StreakKind, typeof CalendarIcon> = {
  day: CalendarIcon,
  week: TokensIcon,
  month: ArchiveIcon,
};

const TILT: Record<StreakKind, string> = {
  day: "rotate-6",
  week: "-rotate-3",
  month: "rotate-[8deg]",
};

export function StreakBadge({
  kind,
  length,
  caps,
}: {
  kind: StreakKind;
  length: number;
  caps: {
    capDayMinutes: number;
    capWeekMinutes: number;
    capMonthMinutes: number;
  };
}) {
  const Icon = ICONS[kind];
  return (
    <IconSquare
      label={LABELS[kind]}
      description={streakHover(kind, length, caps)}
      className={`${TILT[kind]} ${streakTone(length)}`}
    >
      <Icon width={16} height={16} />
    </IconSquare>
  );
}

export function BadgeRow({
  archetype,
  streaks,
  caps,
  className = "mt-1.5",
}: {
  archetype?: Archetype | null;
  streaks?: Streaks | null;
  caps?: {
    capDayMinutes: number | null;
    capWeekMinutes: number | null;
    capMonthMinutes: number | null;
  } | null;
  className?: string;
}) {
  const hasCaps =
    caps?.capDayMinutes != null &&
    caps.capWeekMinutes != null &&
    caps.capMonthMinutes != null;

  return (
    <Tooltip.Provider delayDuration={200}>
      <span className={`flex flex-wrap items-center gap-2 ${className}`}>
        <ArchetypeBadge archetype={archetype} />
        {hasCaps && streaks ? (
          <>
            <StreakBadge
              kind="day"
              length={streaks.day}
              caps={caps as {
                capDayMinutes: number;
                capWeekMinutes: number;
                capMonthMinutes: number;
              }}
            />
            <StreakBadge
              kind="week"
              length={streaks.week}
              caps={caps as {
                capDayMinutes: number;
                capWeekMinutes: number;
                capMonthMinutes: number;
              }}
            />
            <StreakBadge
              kind="month"
              length={streaks.month}
              caps={caps as {
                capDayMinutes: number;
                capWeekMinutes: number;
                capMonthMinutes: number;
              }}
            />
          </>
        ) : null}
      </span>
    </Tooltip.Provider>
  );
}
