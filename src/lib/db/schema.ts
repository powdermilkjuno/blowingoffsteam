import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

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
