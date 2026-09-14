import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Neon Auth owns the `neon_auth` schema, so this is a plain unique column
  // rather than a cross-schema foreign key.
  authUserId: text("auth_user_id").notNull().unique(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url").notNull().default(""),
  friendCode: text("friend_code").notNull().unique(),
  timeZone: text("time_zone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const steamLinks = pgTable("steam_links", {
  profileId: uuid("profile_id")
    .primaryKey()
    .references(() => profiles.id, { onDelete: "cascade" }),
  steamId: text("steam_id").notNull().unique(),
  profileUrl: text("profile_url").notNull().default(""),
  playtimeMinutes: integer("playtime_minutes").notNull().default(0),
  playtimePublic: boolean("playtime_public").notNull().default(false),
  syncedAt: timestamp("synced_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const gamePlaytime = pgTable(
  "game_playtime",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    appId: integer("app_id").notNull(),
    name: text("name").notNull().default(""),
    playtimeForever: integer("playtime_forever").notNull().default(0),
    playtimeTwoWeeks: integer("playtime_two_weeks").notNull().default(0),
    lastPlayedAt: integer("last_played_at"),
    iconHash: text("icon_hash").notNull().default(""),
  },
  (table) => [primaryKey({ columns: [table.profileId, table.appId] })],
);

// Append-only lifetime samples. Steam has no day/week/month series; we need the difference (dataset in past - dataset now = delta = diff)
// app_id 0 is the account rollup for the same captured_at. 
export const playtimeSnapshots = pgTable(
  "playtime_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    steamId: text("steam_id").notNull(),
    appId: integer("app_id").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    playtimeForever: integer("playtime_forever").notNull().default(0),
    playtimeTwoWeeks: integer("playtime_two_weeks").notNull().default(0),
  },
  (table) => [
    index("playtime_snapshots_profile_captured_idx").on(
      table.profileId,
      table.capturedAt,
    ),
    index("playtime_snapshots_profile_app_captured_idx").on(
      table.profileId,
      table.appId,
      table.capturedAt,
    ),
  ],
);

// Minutes actually played on a UTC calendar day. Refresh and cron both add
// Steam forever-deltas into today's row. Week/month are sums of these rows.
export const playtimeDaily = pgTable(
  "playtime_daily",
  {
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    appId: integer("app_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    minutes: integer("minutes").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.profileId, table.appId, table.day] }),
    index("playtime_daily_profile_day_idx").on(table.profileId, table.day),
  ],
);

export const friendships = pgTable(
  "friendships",
  {
    requesterId: uuid("requester_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    addresseeId: uuid("addressee_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.requesterId, table.addresseeId] }),
    check("friendships_no_self", sql`${table.requesterId} <> ${table.addresseeId}`),
    check(
      "friendships_status",
      sql`${table.status} in ('pending', 'accepted')`,
    ),
  ],
);
