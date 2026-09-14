import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { loadLeaderboard } from "@/lib/dashboard-data";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import LeaderboardTabs from "@/components/LeaderboardTabs";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const boards = await loadLeaderboard(profile);

  return (
    <AppShell active="leaderboard" displayName={profile.displayName}>
      <div>
        <p className="text-sm text-fern">Friends</p>
        <h1 className="mt-1 text-2xl tracking-tight text-paper">Leaderboard</h1>
        <p className="mt-2 text-sm text-muted">
          You and accepted friends. Week and month use held playtime. All time
          is Steam lifetime.
        </p>
      </div>

      <Card className="corners overflow-hidden p-5" radius="sm">
        <LeaderboardTabs boards={boards} />
      </Card>
    </AppShell>
  );
}
