import type { Archetype } from "@/lib/db/profiles";
import type { Streaks } from "@/lib/streaks";
import { BadgeRow } from "@/components/StreakBadge";
import AvatarWithBio from "@/components/AvatarWithBio";
import NameWithBio from "@/components/NameWithBio";

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
  frame,
  font,
  nameColor,
  flushPlate = false,
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
  frame?: string | null;
  font?: string | null;
  nameColor?: string | null;
  flushPlate?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 overflow-visible px-4 py-2.5 font-pixel text-[11px] tracking-wide ${
        isUser
          ? "bg-signal/15 text-signal"
          : flushPlate
            ? "text-paper hover:bg-black/10"
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

      <span
        className={`flex min-w-0 flex-1 items-center gap-2 rounded-sm border px-2 py-1.5 ${
          isUser
            ? "border-signal/40 bg-signal/10"
            : flushPlate
              ? "border-line/40 bg-black/10"
              : "border-line bg-raised/80"
        }`}
      >
        <AvatarWithBio
          name={name}
          bio={bio}
          avatarUrl={avatarUrl}
          size={28}
          className={isUser ? "bg-signal/25 text-signal" : ""}
          frame={frame}
          font={font}
          nameColor={nameColor}
        />
        <span className="min-w-0 flex-1">
          <NameWithBio
            name={name}
            bio={bio}
            className="block truncate normal-case"
            font={font}
            nameColor={nameColor}
          />
          {showBadges ? (
            <BadgeRow
              archetype={archetype}
              streaks={streaks}
              caps={caps}
              className="mt-1"
            />
          ) : null}
        </span>
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
