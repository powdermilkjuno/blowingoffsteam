import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import {
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
} from "@/lib/db/friends";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import { AppNav } from "../_components/app-nav";
import {
  acceptRequestAction,
  removeFriendAction,
  rotateFriendCodeAction,
} from "./actions";
import { AddFriendForm } from "./add-friend-form";

export const dynamic = "force-dynamic";

export default async function FriendsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(profile.id),
    listIncomingRequests(profile.id),
    listOutgoingRequests(profile.id),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#1b2838] font-sans text-[#c7d5e0]">
      <AppNav displayName={profile.displayName} />

      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <Card title="Your friend code">
          <div className="flex items-center gap-3">
            <code className="rounded bg-[#1b2838] px-4 py-2 text-lg tracking-[0.3em] text-white">
              {profile.friendCode}
            </code>
            <form action={rotateFriendCodeAction}>
              <button
                type="submit"
                className="text-xs text-[#66c0f4] hover:text-white"
              >
                Generate a new one
              </button>
            </form>
          </div>
          <p className="text-xs text-[#5a6b7c]">
            Share this so someone can send you a friend request. Rotating it
            does not affect existing friends.
          </p>
        </Card>

        <Card title="Add a friend">
          <AddFriendForm />
        </Card>

        {incoming.length > 0 && (
          <Card title={`Invites (${incoming.length})`}>
            <ul className="divide-y divide-[#2a3f5a]">
              {incoming.map(({ profile: sender }) => (
                <li
                  key={sender.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{sender.displayName}</p>
                    <p className="text-xs text-[#8f98a0]">@{sender.username}</p>
                  </div>

                  <form action={acceptRequestAction}>
                    <input type="hidden" name="requesterId" value={sender.id} />
                    <button
                      type="submit"
                      className="rounded bg-[#66c0f4] px-3 py-1 text-xs font-medium text-[#1b2838] hover:bg-white"
                    >
                      Accept
                    </button>
                  </form>

                  <form action={removeFriendAction}>
                    <input
                      type="hidden"
                      name="otherProfileId"
                      value={sender.id}
                    />
                    <button
                      type="submit"
                      className="text-xs text-[#8f98a0] hover:text-[#ff8f8f]"
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
          <Card title={`Sent requests (${outgoing.length})`}>
            <ul className="divide-y divide-[#2a3f5a]">
              {outgoing.map(({ profile: target }) => (
                <li
                  key={target.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-white">{target.displayName}</p>
                    <p className="text-xs text-[#8f98a0]">@{target.username}</p>
                  </div>
                  <span className="text-xs text-[#5a6b7c]">Pending</span>

                  <form action={removeFriendAction}>
                    <input
                      type="hidden"
                      name="otherProfileId"
                      value={target.id}
                    />
                    <button
                      type="submit"
                      className="text-xs text-[#8f98a0] hover:text-[#ff8f8f]"
                    >
                      Cancel
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title={`Friends (${friends.length})`}>
          {friends.length === 0 ? (
            <p className="text-sm text-[#8f98a0]">
              No friends yet. Swap friend codes with someone to compare
              libraries.
            </p>
          ) : (
            <ul className="divide-y divide-[#2a3f5a]">
              {friends.map((friend) => (
                <li
                  key={friend.id}
                  className="flex items-center gap-3 py-3 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/u/${friend.username}`}
                      className="truncate text-white hover:text-[#66c0f4]"
                    >
                      {friend.displayName}
                    </Link>
                    <p className="text-xs text-[#8f98a0]">@{friend.username}</p>
                  </div>

                  <form action={removeFriendAction}>
                    <input
                      type="hidden"
                      name="otherProfileId"
                      value={friend.id}
                    />
                    <button
                      type="submit"
                      className="text-xs text-[#8f98a0] hover:text-[#ff8f8f]"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded border border-[#2a3f5a] bg-[#16202d] p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[#8f98a0]">
        {title}
      </h2>
      {children}
    </section>
  );
}
