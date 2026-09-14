import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { resolveAppUrl } from "@/lib/app-url";
import { getFriendshipStatuses } from "@/lib/db/friends";
import {
  getGroupById,
  getLatestScoreDay,
  getMembership,
  listAcceptedMembers,
  listMemberPoints,
  listPendingMembers,
  listScoresForDay,
  rankMembersForDay,
} from "@/lib/db/groups";
import {
  formatHeldDay,
  formatPlaytime,
  getProfileByAuthUserId,
} from "@/lib/db/profiles";
import { addUtcDays, dayStringInZone } from "@/lib/playtime-windows";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import { AddGroupFriendButton } from "../add-group-friend-button";
import {
  acceptJoinAction,
  declineJoinAction,
  deleteGroupAction,
  leaveGroupAction,
  rotateInviteAction,
} from "../actions";
import { CopyInviteLink } from "../copy-invite";

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

function ordinal(n: number): string {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}TH`;
  switch (n % 10) {
    case 1:
      return `${n}ST`;
    case 2:
      return `${n}ND`;
    case 3:
      return `${n}RD`;
    default:
      return `${n}TH`;
  }
}

export default async function GroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const viewer = await getProfileByAuthUserId(session.user.id);
  if (!viewer) redirect("/onboarding");

  const { id } = await params;
  const group = await getGroupById(id);
  if (!group) notFound();

  const membership = await getMembership(group.id, viewer.id);
  if (!membership || membership.status !== "accepted") {
    return (
      <AppShell active="groups" displayName={viewer.displayName}>
        <Card className="corners space-y-3 p-6">
          <h1 className="text-sm text-paper">You are not in {group.name}</h1>
          <p className="text-sm text-muted">
            Ask the owner for the join link, or wait if you already requested.
          </p>
          <Button href="/groups" variant="primary">
            Back to groups
          </Button>
        </Card>
      </AppShell>
    );
  }

  const isOwner = membership.role === "owner";
  const today = dayStringInZone(new Date(), group.timeZone);
  const yesterday = addUtcDays(today, -1);

  const [members, pending, points, latestDay, origin] = await Promise.all([
    listAcceptedMembers(group.id),
    isOwner ? listPendingMembers(group.id) : Promise.resolve([]),
    listMemberPoints(group.id),
    getLatestScoreDay(group.id),
    resolveAppUrl(),
  ]);

  const [live, lastScores, friendships] = await Promise.all([
    rankMembersForDay(members, today),
    latestDay ? listScoresForDay(group.id, latestDay) : Promise.resolve([]),
    getFriendshipStatuses(
      viewer.id,
      members.map((member) => member.profile.id),
    ),
  ]);

  const profileById = new Map(
    members.map((member) => [member.profile.id, member.profile]),
  );
  const lastBoard = lastScores
    .map((row) => {
      const profile = profileById.get(row.profileId);
      if (!profile) return null;
      return { ...row, profile };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.place - b.place || a.minutes - b.minutes);

  const inviteUrl = `${origin}/groups/join/${group.inviteToken}`;

  return (
    <AppShell active="groups" displayName={viewer.displayName}>
      <Link href="/groups" className="text-xs text-fern hover:text-signal">
        ← Back to groups
      </Link>

      <PageIntro kicker="Lowest activity" title={group.name}>
        Today is {formatHeldDay(today)} in {group.timeZone}. Lowest held
        minutes wins. Scores are calculated on {formatHeldDay(yesterday)} after the daily
        Steam pull at {group.timeZone}.
      </PageIntro>

      {isOwner ? (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">Join link</h2>
          <CopyInviteLink url={inviteUrl} />
          <form action={rotateInviteAction}>
            <input type="hidden" name="groupId" value={group.id} />
            <button type="submit" className="text-xs text-fern hover:text-signal">
              Generate a new link
            </button>
          </form>
        </Card>
      ) : null}

      {isOwner && pending.length > 0 ? (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">
            Join requests ({pending.length})
          </h2>
          <ul className="divide-y divide-line">
            {pending.map((row) => (
              <li
                key={row.profile.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar
                  name={row.profile.displayName}
                  avatarUrl={row.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-paper">{row.profile.displayName}</p>
                  <p className="text-xs text-muted">@{row.profile.username}</p>
                </div>
                <form action={acceptJoinAction}>
                  <input type="hidden" name="groupId" value={group.id} />
                  <input type="hidden" name="profileId" value={row.profile.id} />
                  <Button type="submit" variant="primary" className="px-3 py-1 text-xs">
                    Accept
                  </Button>
                </form>
                <form action={declineJoinAction}>
                  <input type="hidden" name="groupId" value={group.id} />
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

      <Card className="corners overflow-hidden p-5" radius="sm">
        <h2 className="text-sm text-paper">Today</h2>
        <p className="mt-1 text-xs text-muted">
          Live held minutes. Points land when cron scores yesterday.
        </p>
        <div className="mt-4 divide-y divide-line">
          {live.map((row) => (
            <div
              key={row.profile.id}
              className={`flex items-center gap-3 py-2.5 text-sm ${
                row.profile.id === viewer.id ? "text-signal" : "text-paper"
              }`}
            >
              <span className="w-10 shrink-0 text-xs text-clay">
                {ordinal(row.place)}
              </span>
              <Avatar
                name={row.profile.displayName}
                avatarUrl={row.profile.avatarUrl}
              />
              <span className="min-w-0 flex-1 truncate">
                {row.profile.displayName}
              </span>
              <span className="tabular-nums">
                {formatPlaytime(row.minutes)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="corners overflow-hidden p-5" radius="sm">
        <h2 className="text-sm text-paper">
          {latestDay
            ? `Last scored · ${formatHeldDay(latestDay)}`
            : "Last scored day"}
        </h2>
        {lastBoard.length === 0 ? null : (
          <div className="mt-4 divide-y divide-line">
            {lastBoard.map((row) => (
              <div
                key={row.profileId}
                className={`flex items-center gap-3 py-2.5 text-sm ${
                  row.profileId === viewer.id ? "text-signal" : "text-paper"
                }`}
              >
                <span className="w-10 shrink-0 text-xs text-clay">
                  {ordinal(row.place)}
                </span>
                <Avatar
                  name={row.profile.displayName}
                  avatarUrl={row.profile.avatarUrl}
                />
                <span className="min-w-0 flex-1 truncate">
                  {row.profile.displayName}
                </span>
                <span className="text-xs text-muted">
                  {formatPlaytime(row.minutes)}
                </span>
                <span className="w-14 shrink-0 text-right tabular-nums text-signal">
                  {row.points} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Members ({members.length})</h2>
        <ul className="divide-y divide-line">
          {members.map((member) => {
            const status = friendships.get(member.profile.id) ?? "none";
            const isSelf = member.profile.id === viewer.id;
            return (
              <li
                key={member.profile.id}
                className="flex items-center gap-3 py-3 text-sm"
              >
                <Avatar
                  name={member.profile.displayName}
                  avatarUrl={member.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  {isSelf || status === "accepted" ? (
                    <Link
                      href={isSelf ? "/dashboard" : `/u/${member.profile.username}`}
                      className="truncate text-paper hover:text-signal"
                    >
                      {member.profile.displayName}
                    </Link>
                  ) : (
                    <p className="truncate text-paper">
                      {member.profile.displayName}
                    </p>
                  )}
                  <p className="text-xs text-muted">
                    @{member.profile.username}
                    {member.role === "owner" ? " · owner" : ""}
                  </p>
                </div>
                <span className="text-xs text-signal">
                  {points.get(member.profile.id) ?? 0} pts
                </span>
                {isSelf ? (
                  <span className="text-xs text-muted">You</span>
                ) : status === "accepted" ? (
                  <Link
                    href={`/u/${member.profile.username}`}
                    className="text-xs text-fern hover:text-signal"
                  >
                    Profile
                  </Link>
                ) : status === "outgoing" ? (
                  <span className="text-xs text-muted">Request sent</span>
                ) : status === "incoming" ? (
                  <Link
                    href="/friends"
                    className="text-xs text-fern hover:text-signal"
                  >
                    Accept on Friends
                  </Link>
                ) : (
                  <AddGroupFriendButton
                    otherProfileId={member.profile.id}
                    groupId={group.id}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      {isOwner ? (
        <form action={deleteGroupAction}>
          <input type="hidden" name="groupId" value={group.id} />
          <button type="submit" className="text-xs text-danger hover:underline">
            Delete group
          </button>
        </form>
      ) : (
        <form action={leaveGroupAction}>
          <input type="hidden" name="groupId" value={group.id} />
          <button type="submit" className="text-xs text-muted hover:text-danger">
            Leave group
          </button>
        </form>
      )}
    </AppShell>
  );
}
