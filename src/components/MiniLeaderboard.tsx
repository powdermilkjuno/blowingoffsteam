import Link from "next/link";
import type { LeaderboardEntry } from "@/lib/dashboard-data";
import Card from "@/components/Card";
import HighScoreRow from "@/components/HighScoreRow";

export default function MiniLeaderboard({
  entries,
  href = "/leaderboard",
}: {
  entries: LeaderboardEntry[];
  href?: string;
}) {
  const rows = entries.slice(0, 5);

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

        {rows.length === 0 ? (
          <p className="px-4 py-4 text-xs text-muted">
            No playtime to rank yet.
          </p>
        ) : (
          <div className="space-y-0.5">
            {rows.map((row, index) => (
              <MiniRow key={`${row.name}-${index}`} rank={index + 1} row={row} />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

function MiniRow({ rank, row }: { rank: number; row: LeaderboardEntry }) {
  return <HighScoreRow rank={rank} name={row.name} hours={row.hours} isUser={row.isUser} />;
}
