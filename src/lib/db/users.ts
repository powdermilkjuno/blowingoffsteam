import { desc, eq } from "drizzle-orm";
import type { GamePlaytime } from "../steam-api";
import { steamGameIconUrl } from "../steam-api";
import { getDb } from "./index";
import { userGames, users } from "./schema";

export type UserRecord = {
  name: string;
  id: string;
  avatarUrl: string;
  playtimeMinutes: number;
  playtimePublic: boolean;
  games: GamePlaytime[];
};

export function formatPlaytime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours.toLocaleString()}h`;
  return `${hours.toLocaleString()}h ${mins}m`;
}

export async function upsertUser(record: UserRecord): Promise<UserRecord> {
  const db = getDb();

  const [row] = await db
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

  await db.delete(userGames).where(eq(userGames.steamId, record.id));

  const rows = record.games.map((game) => ({
    steamId: record.id,
    appId: game.appId,
    name: game.name,
    playtimeForever: game.playtimeMinutes,
    playtimeTwoWeeks: game.playtimeTwoWeeksMinutes,
    lastPlayedAt: game.lastPlayedAt,
    iconHash: game.iconHash,
  }));

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(userGames).values(rows.slice(i, i + chunkSize));
  }

  if (!row) return record;
  return {
    ...toUserRecord(row),
    games: record.games,
  };
}

export async function getUserBySteamId(
  steamId: string,
): Promise<UserRecord | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(users)
    .where(eq(users.steamId, steamId))
    .limit(1);

  if (!row) return null;

  const games = await db
    .select()
    .from(userGames)
    .where(eq(userGames.steamId, steamId))
    .orderBy(desc(userGames.playtimeForever));

  return {
    ...toUserRecord(row),
    games: games.map((game) => ({
      appId: game.appId,
      name: game.name,
      playtimeMinutes: game.playtimeForever,
      playtimeTwoWeeksMinutes: game.playtimeTwoWeeks,
      lastPlayedAt: game.lastPlayedAt,
      iconHash: game.iconHash,
      iconUrl: steamGameIconUrl(game.appId, game.iconHash),
    })),
  };
}

function toUserRecord(
  row: typeof users.$inferSelect,
): Omit<UserRecord, "games"> {
  return {
    name: row.name,
    id: row.steamId,
    avatarUrl: row.avatarUrl,
    playtimeMinutes: row.playtimeMinutes,
    playtimePublic: row.playtimePublic,
  };
}
