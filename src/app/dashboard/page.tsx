import Link from "next/link";
import { redirect } from "next/navigation";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { auth } from "@/lib/auth/server";
import { loadDashboard, loadLeaderboard } from "@/lib/dashboard-data";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import { PlaytimeView } from "../_components/playtime-view";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  steam_taken: "That Steam account is already linked to another account.",
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;
  const [data, { hasPassword }, boards] = await Promise.all([
    loadDashboard(profile),
    getLinkedAccounts(),
    loadLeaderboard(profile),
  ]);

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

      <PlaytimeView data={data} viewerIsOwner leaderboard={boards.week} />
    </AppShell>
  );
}
