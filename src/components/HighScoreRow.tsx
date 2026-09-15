import type { Archetype } from "@/lib/db/profiles";
import type { Streaks } from "@/lib/streaks";
import { BadgeRow } from "@/components/StreakBadge";
import AvatarWithBio from "@/components/AvatarWithBio";

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}TH`;
  switch (n % 10) {
    case 1:
      return `${n}ST`;
    case 2:
      return `${n}ND`;
    case 3:
      return `${n}RD`;
    default:
      return `${n}TH`;
  }
}

function Trend({ delta }: { delta: number }) {
  if (delta === 0) {
    return <span className="text-muted">—</span>;
  }
  const up = delta > 0;
  return (
    <span className={up ? "text-signal" : "text-danger"}>
      {up ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}

export default function HighScoreRow({
  rank,
  name,
  hours,
  avatarUrl,
  delta = 0,
  isUser = false,
  detailed = false,
  bio,
  showBadges = false,
  archetype,
  streaks,
  caps,
}: {
  rank: number;
  name: string;
  hours: number;
  avatarUrl?: string;
  delta?: number;
  isUser?: boolean;
  detailed?: boolean;
  bio?: string | null;
  showBadges?: boolean;
  archetype?: Archetype | null;
  streaks?: Streaks;
  caps?: {
    capDayMinutes: number | null;
    capWeekMinutes: number | null;
    capMonthMinutes: number | null;
  };
}) {
  return (
    <div
      className={`flex items-center gap-3 overflow-visible px-4 py-3 font-pixel text-[11px] tracking-wide ${
        isUser
          ? "bg-signal/15 text-signal"
          : "text-paper hover:bg-surface/80"
      }`}
    >
      <span
        className={`w-14 shrink-0 tabular-nums ${
          !isUser && rank <= 3 ? "text-clay" : ""
        }`}
      >
        {ordinal(rank)}
      </span>

      <AvatarWithBio
        name={name}
        bio={bio}
        avatarUrl={avatarUrl}
        size={28}
        className={isUser ? "bg-signal/25 text-signal" : ""}
      />

      <span className="min-w-0 flex-1">
        <span className="block truncate normal-case">{name}</span>
        {showBadges ? (
          <BadgeRow archetype={archetype} streaks={streaks} caps={caps} />
        ) : null}
      </span>
      {detailed ? (
        <span className="hidden w-16 shrink-0 text-right text-[9px] sm:block">
          <Trend delta={delta} />
        </span>
      ) : null}
      <span className="w-24 shrink-0 text-right tabular-nums">{hours}h</span>
    </div>
  );
}
