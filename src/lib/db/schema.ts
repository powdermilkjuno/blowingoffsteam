import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  steamId: text("steam_id").primaryKey(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  playtimeMinutes: integer("playtime_minutes").notNull().default(0),
  playtimePublic: boolean("playtime_public").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const userGames = pgTable(
  "user_games",
  {
    steamId: text("steam_id")
      .notNull()
      .references(() => users.steamId, { onDelete: "cascade" }),
    appId: integer("app_id").notNull(),
    name: text("name").notNull().default(""),
    playtimeForever: integer("playtime_forever").notNull().default(0),
    playtimeTwoWeeks: integer("playtime_two_weeks").notNull().default(0),
    lastPlayedAt: integer("last_played_at"),
    iconHash: text("icon_hash").notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.steamId, table.appId] })],
);
