import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { loadDashboard } from "@/lib/dashboard-data";
import { areFriends } from "@/lib/db/friends";
import { getProfileByUsername } from "@/lib/db/profiles";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { PlaytimeView } from "../../_components/playtime-view";

export const dynamic = "force-dynamic";

export default async function FriendProfilePage({
  params,
}: PageProps<"/u/[username]">) {
  const viewer = await requireCompleteProfile();

  const { username } = await params;
  const target = await getProfileByUsername(username);
  if (!target) notFound();

  if (target.id === viewer.id) redirect("/dashboard");

  if (!(await areFriends(viewer.id, target.id))) {
    return (
      <AppShell displayName={viewer.displayName}>
        <Card className="corners space-y-3 p-6">
          <h1 className="text-sm text-paper">
            You are not friends with @{target.username}
          </h1>
          <p className="text-sm text-muted">
            Ask them for their friend code to send a request.
          </p>
          <Button href="/friends" variant="primary">
            Go to friends
          </Button>
        </Card>
      </AppShell>
    );
  }

  const data = await loadDashboard(target, {
    displayTimeZone: viewer.timeZone,
  });

  return (
    <AppShell displayName={viewer.displayName}>
      <Link href="/friends" className="text-xs text-fern hover:text-signal">
        ← Back to friends
      </Link>
      <PlaytimeView data={data} viewerIsOwner={false} />
    </AppShell>
  );
}
