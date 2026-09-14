import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/dashboard-data";
import Card from "@/components/Card";
import HighScoreRow from "@/components/HighScoreRow";

const VISIBLE_ROWS = 3;

export default function MiniLeaderboard({
  entries,
  href = "/leaderboard",
}: {
  entries: LeaderboardEntry[];
  href?: string;
}) {
  const rows = entries.slice(0, VISIBLE_ROWS);

  return (
    <Card className="corners flex h-full flex-col p-5" radius="lg">
      <div className="flex items-center justify-between">
        <h2 className="text-sm text-paper">Leaderboard</h2>
        <Link href={href} className="text-xs text-fern hover:text-signal">
          View all
        </Link>
      </div>

      <div className="scanlines -mx-5 -mb-5 mt-4 flex-1 border-t border-line bg-raised pb-5 pt-5">
        <h3 className="text-center font-pixel text-sm tracking-wide text-clay">
          High Scores
        </h3>

        <div className="mt-5 flex items-center gap-3 px-4 pb-2 font-pixel text-[9px] tracking-wide text-fern">
          <span className="w-14 shrink-0">Rank</span>
          <span className="w-7 shrink-0" />
          <span className="flex-1">Name</span>
          <span className="w-24 shrink-0 text-right">Hours</span>
        </div>

        <div className="space-y-0.5">
          {Array.from({ length: VISIBLE_ROWS }).map((_, index) =>
            rows[index] ? (
              <MiniRow
                key={`${rows[index].name}-${index}`}
                rank={index + 1}
                row={rows[index]}
              />
            ) : (
              <EmptyRow key={`empty-${index}`} />
            ),
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
