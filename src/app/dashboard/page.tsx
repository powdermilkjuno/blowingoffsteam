import Link from "next/link";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { loadDashboard, loadLeaderboard } from "@/lib/dashboard-data";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import { PlaytimeView } from "../_components/playtime-view";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  steam_taken: "That Steam account is already linked to another account.",
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const profile = await requireCompleteProfile();

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;
  const [data, { hasPassword }, boards] = await Promise.all([
    loadDashboard(profile),
    getLinkedAccounts(),
    loadLeaderboard(profile),
  ]);
  const featured = boards.group;
  const leaderboard = featured?.boards.today ?? boards.friends.today;
  const leaderboardTitle = featured
    ? featured.starred
      ? `Starred · ${featured.name}`
      : featured.name
    : "Friends";
  const leaderboardHref = featured ? `/groups/${featured.id}` : "/leaderboard";

  return (
    <AppShell active="dashboard" displayName={profile.displayName} wide>
      {errorMessage && (
        <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {errorMessage}
        </p>
      )}

      {!hasPassword && (
        <p className="rounded border border-line bg-surface px-4 py-3 text-sm text-muted">
          This account has no password, so Google is the only way back in.{" "}
          <Link href="/settings" className="text-signal hover:text-signal2">
            Set one in settings
          </Link>
          .
        </p>
      )}

      <PlaytimeView
        data={data}
        viewerIsOwner
        leaderboard={leaderboard}
        leaderboardTitle={leaderboardTitle}
        leaderboardHref={leaderboardHref}
        leaderboardAccent={featured?.accent}
        leaderboardDescription={featured?.description}
      />
    </AppShell>
  );
}
