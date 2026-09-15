import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/dashboard-data";
import Card from "@/components/Card";
import HighScoreRow from "@/components/HighScoreRow";

export default function MiniLeaderboard({
  entries,
  href = "/leaderboard",
  title = "Leaderboard",
  featured = false,
  actionLabel = "View all",
}: {
  entries: LeaderboardEntry[];
  href?: string;
  title?: string;
  featured?: boolean;
  actionLabel?: string;
}) {
  const visible = featured ? Math.max(entries.length, 1) : 3;
  const rows = entries.slice(0, visible);

  return (
    <Card className="corners flex h-full flex-col p-5" radius="lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm text-paper">{title}</h2>
          <p className="mt-0.5 text-[10px] text-muted">Today</p>
        </div>
        <Link href={href} className="shrink-0 text-xs text-fern hover:text-signal">
          {actionLabel}
        </Link>
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
