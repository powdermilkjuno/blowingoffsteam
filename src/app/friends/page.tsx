import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/lib/db/friends";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import Button from "@/components/Button";
import PageIntro from "@/components/PageIntro";
import {
  acceptRequestAction,
  removeFriendAction,
  rotateFriendCodeAction,
} from "./actions";
import { AddFriendForm } from "./add-friend-form";
import { FriendsLiveRefresh } from "./live-refresh";

export const dynamic = "force-dynamic";

function initials(name: string): string {
  return name
    .split(/[_\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
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

export default async function FriendsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(profile.id),
    listIncomingRequests(profile.id),
    listOutgoingRequests(profile.id),
  ]);

  return (
    <AppShell active="friends" displayName={profile.displayName}>
      <PageIntro kicker="Compare" title="Friends" />
      <FriendsLiveRefresh />
      <PageIntro kicker="People" title="Friends">
        Swap codes, accept invites, then compare libraries.
      </PageIntro>
      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Your friend code</h2>
        <div className="flex items-center gap-3">
          <code className="rounded border border-line bg-raised px-4 py-2 text-lg tracking-[0.3em] text-paper">
            {profile.friendCode}
          </code>
          <form action={rotateFriendCodeAction}>
            <button
              type="submit"
              className="text-xs text-fern hover:text-signal"
            >
              Generate a new one
            </button>
          </form>
        </div>
        <p className="text-xs text-muted">
        </p>
      </Card>

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Add a friend</h2>
        <AddFriendForm />
      </Card>

      {incoming.length > 0 && (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">Invites ({incoming.length})</h2>
          <ul className="divide-y divide-line">
            {incoming.map(({ profile: sender }) => (
              <li
                key={sender.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar name={sender.displayName} avatarUrl={sender.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-paper">{sender.displayName}</p>
                  <p className="text-xs text-muted">@{sender.username}</p>
                </div>

                <form action={acceptRequestAction}>
                  <input type="hidden" name="requesterId" value={sender.id} />
                  <Button type="submit" variant="primary" className="px-3 py-1 text-xs">
                    Accept
                  </Button>
                </form>

                <form action={removeFriendAction}>
                  <input
                    type="hidden"
                    name="otherProfileId"
                    value={sender.id}
                  />
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
      )}

      {outgoing.length > 0 && (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">
            Sent requests ({outgoing.length})
          </h2>
          <ul className="divide-y divide-line">
            {outgoing.map(({ profile: target }) => (
              <li
                key={target.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar name={target.displayName} avatarUrl={target.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-paper">{target.displayName}</p>
                  <p className="text-xs text-muted">@{target.username}</p>
                </div>
                <span className="text-xs text-muted">Pending</span>

                <form action={removeFriendAction}>
                  <input
                    type="hidden"
                    name="otherProfileId"
                    value={target.id}
                  />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-danger"
                  >
                    Cancel
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-sm text-muted">
            No friends yet. Swap friend codes with someone to compare libraries.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {friends.map((friend) => (
              <li
                key={friend.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar name={friend.displayName} avatarUrl={friend.avatarUrl} />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/u/${friend.username}`}
                    className="truncate text-paper hover:text-signal"
                  >
                    {friend.displayName}
                  </Link>
                  <p className="text-xs text-muted">@{friend.username}</p>
                </div>

                <form action={removeFriendAction}>
                  <input
                    type="hidden"
                    name="otherProfileId"
                    value={friend.id}
                  />
                  <button
                    type="submit"
                    className="text-xs text-muted hover:text-danger"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </AppShell>
  );
}

