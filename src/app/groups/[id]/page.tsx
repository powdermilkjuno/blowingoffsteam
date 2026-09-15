import Link from "next/link";
import { notFound } from "next/navigation";
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
} from "@/lib/db/profiles";
import { addUtcDays, dayStringInZone } from "@/lib/playtime-windows";
import { requireCompleteProfile } from "@/lib/require-profile";
import { loadStreaks } from "@/lib/streaks";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import AvatarWithBio from "@/components/AvatarWithBio";
import NameWithBio from "@/components/NameWithBio";
import FavoriteStarButton from "@/components/FavoriteStarButton";
import { BadgeRow } from "@/components/StreakBadge";
import { AddGroupFriendButton } from "../add-group-friend-button";
import {
  acceptJoinAction,
  declineJoinAction,
  deleteGroupAction,
  leaveGroupAction,
  rotateInviteAction,
  toggleFavoriteAction,
} from "../actions";
import { CopyInviteLink } from "../copy-invite";

export const dynamic = "force-dynamic";

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
  const viewer = await requireCompleteProfile();

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

  const [live, lastScores, friendships, memberStreaks] = await Promise.all([
    rankMembersForDay(members, today),
    latestDay ? listScoresForDay(group.id, latestDay) : Promise.resolve([]),
    getFriendshipStatuses(
      viewer.id,
      members.map((member) => member.profile.id),
    ),
    Promise.all(
      members.map(async (member) => [
        member.profile.id,
        await loadStreaks(member.profile),
      ] as const),
    ),
  ]);
  const streaksById = new Map(memberStreaks);

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
      <form action={toggleFavoriteAction} className="-mt-3">
        <input type="hidden" name="groupId" value={group.id} />
        <FavoriteStarButton favorited={membership.favorited} labeled />
      </form>

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
                <AvatarWithBio
                  name={row.profile.displayName}
                  bio={row.profile.bio}
                  avatarUrl={row.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <NameWithBio
                    name={row.profile.displayName}
                    bio={row.profile.bio}
                    className="truncate text-paper"
                  />
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

      <Card className="corners p-5" radius="sm">
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
              <AvatarWithBio
                name={row.profile.displayName}
                bio={row.profile.bio}
                avatarUrl={row.profile.avatarUrl}
              />
              <div className="min-w-0 flex-1">
                <NameWithBio
                  name={row.profile.displayName}
                  bio={row.profile.bio}
                  className="truncate"
                />
                <BadgeRow
                  archetype={row.profile.archetype}
                  streaks={streaksById.get(row.profile.id)}
                  caps={row.profile}
                />
              </div>
              <span className="tabular-nums">
                {formatPlaytime(row.minutes)}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="corners p-5" radius="sm">
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
                <AvatarWithBio
                  name={row.profile.displayName}
                  bio={row.profile.bio}
                  avatarUrl={row.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  <NameWithBio
                    name={row.profile.displayName}
                    bio={row.profile.bio}
                    className="truncate"
                  />
                </div>
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
                <AvatarWithBio
                  name={member.profile.displayName}
                  bio={member.profile.bio}
                  avatarUrl={member.profile.avatarUrl}
                />
                <div className="min-w-0 flex-1">
                  {isSelf || status === "accepted" ? (
                    <NameWithBio
                      name={member.profile.displayName}
                      bio={member.profile.bio}
                      href={isSelf ? "/dashboard" : `/u/${member.profile.username}`}
                      className="truncate text-paper hover:text-signal"
                    />
                  ) : (
                    <NameWithBio
                      name={member.profile.displayName}
                      bio={member.profile.bio}
                      className="truncate text-paper"
                    />
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
