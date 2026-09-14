import { and, eq } from "drizzle-orm";
import { addUtcDays, dayStringInZone } from "../playtime-windows";
import { listAcceptedMembers, listAllGroups, rankMembersForDay } from "./groups";
import { getDb } from "./index";
import { groupDailyScores } from "./schema";

export type GroupAwardResult = {
  groups: number;
  awarded: number;
  skipped: number;
};

async function hasScoresForDay(groupId: string, day: string): Promise<boolean> {
  const [row] = await getDb()
    .select({ profileId: groupDailyScores.profileId })
    .from(groupDailyScores)
    .where(
      and(eq(groupDailyScores.groupId, groupId), eq(groupDailyScores.day, day)),
    )
    .limit(1);
  return row !== undefined;
}

export async function awardGroupDailyPoints(
  at: Date = new Date(),
): Promise<GroupAwardResult> {
  const allGroups = await listAllGroups();
  const result: GroupAwardResult = {
    groups: allGroups.length,
    awarded: 0,
    skipped: 0,
  };

  for (const group of allGroups) {
    const today = dayStringInZone(at, group.timeZone);
    const yesterday = addUtcDays(today, -1);

    if (await hasScoresForDay(group.id, yesterday)) {
      result.skipped += 1;
      continue;
    }

    const members = await listAcceptedMembers(group.id);
    if (members.length === 0) {
      result.skipped += 1;
      continue;
    }

    const ranked = await rankMembersForDay(members, yesterday);

    await getDb()
      .insert(groupDailyScores)
      .values(
        ranked.map((row) => ({
          groupId: group.id,
          profileId: row.profile.id,
          day: yesterday,
          place: row.place,
          minutes: row.minutes,
          points: row.points,
        })),
      )
      .onConflictDoNothing();

    result.awarded += 1;
  }

  return result;
}
