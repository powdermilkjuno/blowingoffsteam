import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { loadLeaderboard } from "@/lib/dashboard-data";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import LeaderboardTabs from "@/components/LeaderboardTabs";
import PageIntro from "@/components/PageIntro";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const boards = await loadLeaderboard(profile);

  return (
    <AppShell active="leaderboard" displayName={profile.displayName}>
      <PageIntro  title="Leaderboard">
      </PageIntro>

      <Card className="corners overflow-hidden p-5" radius="sm">
        <LeaderboardTabs boards={boards} />
      </Card>
    </AppShell>
  );
}
