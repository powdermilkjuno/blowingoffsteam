import { loadLeaderboard } from "@/lib/dashboard-data";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import LeaderboardTabs from "@/components/LeaderboardTabs";
import PageIntro from "@/components/PageIntro";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const profile = await requireCompleteProfile();

  const view = await loadLeaderboard(profile);

  return (
    <AppShell active="leaderboard" displayName={profile.displayName} walletPoints={profile.walletPoints} sitePack={profile.equippedSiteTheme}>
      <PageIntro kicker="Lowest hours" title="Leaderboard" />

      <Card className="corners p-5" radius="sm">
        <LeaderboardTabs group={view.group} friends={view.friends} />
      </Card>
    </AppShell>
  );
}
