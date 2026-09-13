import { eq } from "drizzle-orm";
import { getDb } from "./index";
import { users } from "./schema";

export type UserRecord = {
  name: string;
  id: string;
  avatarUrl: string;
  playtimeMinutes: number;
  playtimePublic: boolean;
};

export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours.toLocaleString()}h`;
  return `${hours.toLocaleString()}h ${mins}m`;
}

export async function upsertUser(record: UserRecord): Promise<UserRecord> {
  const [row] = await getDb()
    .insert(users)
    .values({
      steamId: record.id,
      name: record.name,
      avatarUrl: record.avatarUrl,
      playtimeMinutes: record.playtimeMinutes,
      playtimePublic: record.playtimePublic,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: users.steamId,
      set: {
        name: record.name,
        avatarUrl: record.avatarUrl,
        playtimeMinutes: record.playtimeMinutes,
        playtimePublic: record.playtimePublic,
        updatedAt: new Date(),
      },
    })
    .returning();

  if (!row) return record;
  return toUserRecord(row);
}

export async function getUserBySteamId(
  steamId: string,
): Promise<UserRecord | null> {
  const [row] = await getDb()
    .select()
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1);

  return row ? toUserRecord(row) : null;
}

function toUserRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    name: row.name,
    id: row.steamId,
    avatarUrl: row.avatarUrl,
    playtimeMinutes: row.playtimeMinutes,
    playtimePublic: row.playtimePublic,
  };
}
