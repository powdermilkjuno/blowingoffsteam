import Link from "next/link";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { loadDashboard, loadLeaderboard } from "@/lib/dashboard-data";
import { listGroupsForProfile } from "@/lib/db/groups";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
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
  const [data, { hasPassword }, boards, groups] = await Promise.all([
    loadDashboard(profile),
    getLinkedAccounts(),
    loadLeaderboard(profile),
    listGroupsForProfile(profile.id),
  ]);

  const favorites = groups.filter((group) => group.favorited);

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

      {favorites.length > 0 ? (
        <Card className="corners flex flex-wrap gap-2 p-4">
          <p className="w-full text-xs text-fern">Favorites</p>
          {favorites.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="rounded-sm border border-line px-3 py-1.5 text-sm text-paper hover:border-fern hover:text-signal"
            >
              {group.name}
            </Link>
          ))}
        </Card>
      ) : null}

      <PlaytimeView data={data} viewerIsOwner leaderboard={boards.friends.today} />
    </AppShell>
  );
}
