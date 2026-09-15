import { redirect } from "next/navigation";
import { getGroupByToken, getMembership } from "@/lib/db/groups";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import { requestJoinAction } from "../../actions";

export const dynamic = "force-dynamic";

export default async function GroupJoinPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const viewer = await requireCompleteProfile();

  const { token } = await params;
  const paramsError = (await searchParams).error;
  const error =
    typeof paramsError === "string" ? paramsError : undefined;

  const group = await getGroupByToken(token);
  if (!group) {
    return (
      <AppShell active="groups" displayName={viewer.displayName}>
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

  const membership = await getMembership(group.id, viewer.id);
  if (membership?.status === "accepted") {
    redirect(`/groups/${group.id}`);
  }

  const pending = membership?.status === "pending";

  return (
    <AppShell active="groups" displayName={viewer.displayName}>
      <PageIntro kicker="Join" title={group.name}>
        Lowest activity for the day wins. The owner has to accept you before
        you can see the board.
      </PageIntro>

      <Card className="corners space-y-4 p-6">
        {error ? (
          <p className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {pending ? (
          <p className="text-sm text-muted">
            Request sent. Wait for the owner of {group.name} to accept.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted">
              You do not need to be friends with anyone here to compete. After
              you are in, you can send friend requests from the group roster.
            </p>
            <form action={requestJoinAction}>
              <input type="hidden" name="token" value={group.inviteToken} />
              <Button type="submit" variant="primary">
                Request to join
              </Button>
            </form>
          </>
        )}
      </Card>
    </AppShell>
  );
}
