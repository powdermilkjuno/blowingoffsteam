import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getGroupByToken, requestJoin } from "@/lib/db/groups";
import {
  getProfileByAuthUserId,
  isProfileComplete,
} from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";

export const dynamic = "force-dynamic";

export default async function GroupJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { token } = await params;
  const nextPath = `/groups/join/${encodeURIComponent(token)}`;

  const { data: session } = await auth.getSession();
  if (!session?.user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const viewer = await getProfileByAuthUserId(session.user.id);
  if (!viewer || !isProfileComplete(viewer)) redirect("/onboarding");

  const paramsError = (await searchParams).error;
  const error = typeof paramsError === "string" ? paramsError : undefined;

  const group = await getGroupByToken(token);
  if (!group) {
    return (
      <AppShell active="groups" displayName={viewer.displayName} walletPoints={viewer.walletPoints} sitePack={viewer.equippedSiteTheme}>
        <Card className="corners space-y-3 p-6">
          <h1 className="text-sm text-paper">Invite not found</h1>
          <p className="text-sm text-muted">
            That join link is invalid or was rotated.
          </p>
          <Button href="/groups" variant="primary">
            Back to groups
          </Button>
        </Card>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell active="groups" displayName={viewer.displayName} walletPoints={viewer.walletPoints} sitePack={viewer.equippedSiteTheme}>
        <Card className="corners space-y-3 p-6">
          <h1 className="text-sm text-paper">Could not join {group.name}</h1>
          <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
          <Button href="/groups" variant="primary">
            Back to groups
          </Button>
        </Card>
      </AppShell>
    );
  }

  const result = await requestJoin(viewer.id, group.inviteToken);
  if (!result.ok) {
    redirect(`${nextPath}?error=${encodeURIComponent(result.error)}`);
  }
  redirect(`/groups/${result.value.group.id}`);
}
