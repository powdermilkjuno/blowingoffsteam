import AppHeader from "@/components/AppHeader";
import Card from "@/components/Card";
import LeaderboardTabs from "@/components/LeaderboardTabs";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen">
      <AppHeader active="leaderboard" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-fern">Friends</p>
          <h1 className="mt-1 text-2xl tracking-tight text-paper">
            Leaderboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            Ranked by total hours played. Updates as soon as Steam reports a
            new session.
          </p>
        </div>

        <Card className="overflow-hidden p-5" radius="sm">
          <LeaderboardTabs />
        </Card>
      </main>
    </div>
  );
}
