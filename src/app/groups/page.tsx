import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  listGroupsForProfile,
  listPendingJoinsForOwner,
} from "@/lib/db/groups";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import { acceptJoinAction, declineJoinAction } from "./actions";
import { CreateGroupForm } from "./create-group-form";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/[_\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Avatar({
  name,
  avatarUrl,
}: {
  name: string;
  avatarUrl?: string | null;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt=""
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded object-cover"
      />
    );
  }
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-moss/70 font-mono text-[10px] text-paper">
      {initials(name)}
    </span>
  );
}

export default async function GroupsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const [mine, pending] = await Promise.all([
    listGroupsForProfile(profile.id),
    listPendingJoinsForOwner(profile.id),
  ]);

  return (
    <AppShell active="groups" displayName={profile.displayName}>
      <PageIntro kicker="Lowest activity" title="Groups" />

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Create a group</h2>
        <p className="text-xs text-muted">
          You get a join link. People request in; you accept. They do not need
          to be friends to see today&apos;s minutes.
        </p>
        <CreateGroupForm />
      </Card>

      {pending.length > 0 ? (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">
            Join requests ({pending.length})
          </h2>
          <ul className="divide-y divide-line">
            {pending.map((row) => (
              <li
                key={`${row.group.id}-${row.profile.id}`}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar
                  name={row.profile.displayName}
                  avatarUrl={row.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-paper">{row.profile.displayName}</p>
                  <p className="text-xs text-muted">
                    wants to join {row.group.name}
                  </p>
                </div>
                <form action={acceptJoinAction}>
                  <input type="hidden" name="groupId" value={row.group.id} />
                  <input type="hidden" name="profileId" value={row.profile.id} />
                  <Button type="submit" variant="primary" className="px-3 py-1 text-xs">
                    Accept
                  </Button>
                </form>
                <form action={declineJoinAction}>
                  <input type="hidden" name="groupId" value={row.group.id} />
                  <input type="hidden" name="profileId" value={row.profile.id} />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-danger"
                  >
                    Decline
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Your groups ({mine.length})</h2>
        {mine.length === 0 ? (
          <p className="text-sm text-muted">
            No groups yet. Create one or ask someone for their join link.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {mine.map((group) => (
              <li key={group.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/groups/${group.id}`}
                    className="truncate text-paper hover:text-signal"
                  >
                    {group.name}
                  </Link>
                  <p className="text-xs text-muted">
                    {group.memberCount}{" "}
                    {group.memberCount === 1 ? "member" : "members"}
                    {group.role === "owner" ? " · owner" : ""}
                  </p>
                </div>
                <span className="text-xs text-signal">{group.myPoints} pts</span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}
