import Link from "next/link";
import {
  listAcceptedMembers,
  listGroupsForProfile,
  listPendingJoinsForOwner,
  rankMembersForDay,
  type GroupListItem,
  type RankedMember,
} from "@/lib/db/groups";
import { formatHeldDay, formatPlaytime } from "@/lib/db/profiles";
import { hoursFromMinutes } from "@/lib/hours";
import { dayStringInZone } from "@/lib/playtime-windows";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Button from "@/components/Button";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import AvatarWithBio from "@/components/AvatarWithBio";
import NameWithBio from "@/components/NameWithBio";
import FavoriteStarButton from "@/components/FavoriteStarButton";
import TopFiveChart from "@/components/TopFiveChart";
import type { LeaderboardEntry } from "@/lib/dashboard-data";
import { GROUP_ACCENTS } from "@/lib/group-accent";
import { acceptJoinAction, declineJoinAction, toggleFavoriteAction } from "./actions";
import { CreateGroupForm } from "./create-group-form";

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

async function loadGroupOverview(group: GroupListItem) {
  const today = dayStringInZone(new Date(), group.timeZone);
  const members = await listAcceptedMembers(group.id);
  const live = await rankMembersForDay(members, today);
  return { group, today, live };
}

export default async function GroupsPage() {
  const profile = await requireCompleteProfile();

  const [mine, pending] = await Promise.all([
    listGroupsForProfile(profile.id),
    listPendingJoinsForOwner(profile.id),
  ]);
  const overviews = await Promise.all(mine.map(loadGroupOverview));

  return (
    <AppShell active="groups" displayName={profile.displayName} walletPoints={profile.walletPoints} sitePack={profile.equippedSiteTheme}>
      <PageIntro kicker="Compete" title="Groups">
        Live held minutes for today. Lowest time is winning right now.
      </PageIntro>

      {overviews.length === 0 ? (
        <Card className="corners space-y-3 p-6">
          <p className="text-sm text-muted">
            No groups yet. Create one below or ask someone for their join link.
          </p>
        </Card>
      ) : (
        overviews.map(({ group, today, live }) => (
          <GroupOverviewCard
            key={group.id}
            group={group}
            today={today}
            live={live}
            viewerId={profile.id}
          />
        ))
      )}

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
                <AvatarWithBio
                  name={row.profile.displayName}
                  bio={row.profile.bio}
                  avatarUrl={row.profile.avatarUrl}
                  frame={row.profile.equippedFrame}
                  font={row.profile.equippedFont} nameColor={row.profile.equippedNameColor}
                />
                <div className="min-w-0 flex-1">
                  <NameWithBio
                    name={row.profile.displayName}
                    bio={row.profile.bio}
                    className="truncate text-paper"
                    font={row.profile.equippedFont} nameColor={row.profile.equippedNameColor}
                  />
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
        <h2 className="text-sm text-paper">Create a group</h2>
        <p className="text-xs text-muted">
          You get a join link. People request in; you accept. They do not need
          to be friends to see today&apos;s minutes.
        </p>
        <CreateGroupForm />
      </Card>
    </AppShell>
  );
}

function GroupOverviewCard({
  group,
  today,
  live,
  viewerId,
}: {
  group: GroupListItem;
  today: string;
  live: RankedMember[];
  viewerId: string;
}) {
  const accent = GROUP_ACCENTS[group.accent];

  return (
    <Card tone="plain" className={`corners p-5 ${accent.card}`} radius="sm">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <Link
            href={`/groups/${group.id}`}
            className={`truncate text-lg tracking-tight hover:text-signal ${accent.title}`}
          >
            {group.name}
          </Link>
          {group.description ? (
            <p className="mt-1 text-sm text-muted">{group.description}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted">
            Live today · {formatHeldDay(today)} ·{" "}
            {group.timeZone.replaceAll("_", " ")}
          </p>
          <p className="text-xs text-muted">
            {group.memberCount}{" "}
            {group.memberCount === 1 ? "member" : "members"}
            {group.role === "owner"
              ? " · owner"
              : group.role === "co_owner"
                ? " · co-owner"
                : ""}
            {" · "}
            <span className="text-signal">{group.myPoints} pts</span>
          </p>
        </div>
        <form action={toggleFavoriteAction}>
          <input type="hidden" name="groupId" value={group.id} />
          <FavoriteStarButton favorited={group.favorited} />
        </form>
      </div>

      <div className="mt-4">
        <TopFiveChart
          rows={live.slice(0, 5).map((row): LeaderboardEntry => ({
            name: row.profile.displayName,
            hours: hoursFromMinutes(row.minutes),
            avatarUrl: row.profile.avatarUrl || undefined,
            isUser: row.profile.id === viewerId,
            bio: row.profile.bio,
            frame: row.profile.equippedFrame,
            font: row.profile.equippedFont,
            nameColor: row.profile.equippedNameColor,
          }))}
          size="xs"
          embedded
        />
      </div>

      <div className="mt-4 divide-y divide-line border-t border-line">
        {live.map((row) => {
          const isViewer = row.profile.id === viewerId;
          return (
            <div
              key={row.profile.id}
              className={`flex items-center gap-3 py-2.5 text-sm ${
                isViewer ? "text-signal" : "text-paper"
              }`}
            >
              <span className="w-10 shrink-0 text-xs text-clay">
                {ordinal(row.place)}
              </span>
              <AvatarWithBio
                name={row.profile.displayName}
                bio={row.profile.bio}
                avatarUrl={row.profile.avatarUrl}
                frame={row.profile.equippedFrame}
                font={row.profile.equippedFont} nameColor={row.profile.equippedNameColor}
              />
              <div className="min-w-0 flex-1">
                <NameWithBio
                  name={row.profile.displayName}
                  bio={row.profile.bio}
                  className="truncate"
                  font={row.profile.equippedFont} nameColor={row.profile.equippedNameColor}
                />
              </div>
              <span className="tabular-nums">
                {formatPlaytime(row.minutes)}
              </span>
            </div>
          );
        })}
      </div>

      <Link
        href={`/groups/${group.id}`}
        className="mt-3 inline-block text-xs text-fern hover:text-signal"
      >
        Open group
      </Link>
    </Card>
  );
}
