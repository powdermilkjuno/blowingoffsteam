import { eq } from "drizzle-orm";
import { lastHeldDayByApp, listAccountDailyMinutes } from "@/lib/db/daily";
import {
  updateProfileArchetype,
  type Archetype,
  type Profile,
} from "@/lib/db/profiles";
import { getDb } from "@/lib/db/index";
import { gamePlaytime } from "@/lib/db/schema";
import {
  addUtcDays,
  dayStringInZone,
  recencyUnix,
  resolveTimeZone,
} from "@/lib/playtime-windows";

export const ARCHETYPE_META: Record<
  Archetype,
  { label: string; article: "a" | "an"; meaning: string }
> = {
  night_owl: {
    label: "Night Owl",
    article: "a",
    meaning: "their recent last-played times land between 8pm and 5am",
  },
  early_bird: {
    label: "Early Bird",
    article: "an",
    meaning: "their recent last-played times land between 6am and 1pm",
  },
  firecracker: {
    label: "Firecracker",
    article: "a",
    meaning: "their recent play days are short bursts",
  },
  hearth: {
    label: "Hearth",
    article: "a",
    meaning: "their recent play days run long",
  },
  one_hit_wonder: {
    label: "One-Hit Wonder",
    article: "a",
    meaning: "they play on very few days in a week",
  },
  chart_topper: {
    label: "Chart-Topper",
    article: "a",
    meaning: "they play on most days in a week",
  },
  grass_toucher: {
    label: "Grass-toucher",
    article: "a",
    meaning: "they have barely played lately",
  },
};

export type ArchetypeBreakdown = {
  winner: Archetype;
  clock: number;
  length: number;
  volume: number;
  owlShare: number;
  birdShare: number;
};

export type PlayStamp = {
  lastPlayedAt?: number | null;
  lastHeldDay?: string | null;
};

const DAY_SECONDS = 24 * 60 * 60;
const RECENT_DAYS = 30;
const GRASS_DAYS = 14;
const CLOCK_SHARE = 0.65;

function hourInZone(unixSeconds: number, timeZone: string): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(unixSeconds * 1000));
  return Number(hour.find((part) => part.type === "hour")?.value ?? 0);
}

function isNightHour(hour: number): boolean {
  return hour >= 20 || hour < 5;
}

function isMorningHour(hour: number): boolean {
  return hour >= 6 && hour < 13;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function recencyWeight(unix: number, nowUnix: number): number {
  const ageDays = (nowUnix - unix) / DAY_SECONDS;
  if (ageDays > RECENT_DAYS) return 0;
  if (ageDays <= 0) return 1;
  return 1 - (ageDays / RECENT_DAYS) * 0.8;
}

function result(
  winner: Archetype,
  clock: number,
  length: number,
  volume: number,
  owlShare: number,
  birdShare: number,
): ArchetypeBreakdown {
  return { winner, clock, length, volume, owlShare, birdShare };
}

export function classifyArchetype(input: {
  games: PlayStamp[];
  dailyMinutes: { day: string; minutes: number }[];
  timeZone: string;
  now?: Date;
}): ArchetypeBreakdown {
  const now = input.now ?? new Date();
  const nowUnix = Math.floor(now.getTime() / 1000);
  const today = dayStringInZone(now, input.timeZone);
  const weekStart = addUtcDays(today, -6);
  const recentStart = addUtcDays(today, -(RECENT_DAYS - 1));

  const stamps = input.games.map((game) => ({
    lastPlayedAt:
      game.lastPlayedAt != null && game.lastPlayedAt > 0
        ? game.lastPlayedAt
        : null,
    recency: recencyUnix(game),
  }));

  const mostRecent = stamps.reduce(
    (max, stamp) => Math.max(max, stamp.recency),
    0,
  );

  const playDays = input.dailyMinutes.filter((row) => row.minutes > 0);
  const weekPlayDays = playDays.filter(
    (row) => row.day >= weekStart && row.day <= today,
  ).length;
  const recentPlayDays = playDays.filter(
    (row) => row.day >= recentStart && row.day <= today,
  );
  const midPlay = median(recentPlayDays.map((row) => row.minutes));

  let owlWeight = 0;
  let birdWeight = 0;
  let clockWeight = 0;
  let clockCount = 0;
  for (const stamp of stamps) {
    if (stamp.lastPlayedAt == null) continue;
    const weight = recencyWeight(stamp.lastPlayedAt, nowUnix);
    if (weight <= 0) continue;
    clockCount += 1;
    clockWeight += weight;
    const hour = hourInZone(stamp.lastPlayedAt, input.timeZone);
    if (isNightHour(hour)) owlWeight += weight;
    else if (isMorningHour(hour)) birdWeight += weight;
  }

  const owlShare = clockWeight ? owlWeight / clockWeight : 0;
  const birdShare = clockWeight ? birdWeight / clockWeight : 0;
  const clock = Math.round(Math.max(owlShare, birdShare) * 100);
  const length = Math.min(100, Math.round((midPlay / 180) * 100));
  const volume = Math.min(100, Math.round((weekPlayDays / 7) * 100));

  const stale =
    mostRecent === 0 || nowUnix - mostRecent > GRASS_DAYS * DAY_SECONDS;
  if (stale && weekPlayDays <= 1) {
    return result("grass_toucher", clock, length, volume, owlShare, birdShare);
  }

  if (clockCount >= 2 && owlShare >= CLOCK_SHARE && owlShare >= birdShare) {
    return result("night_owl", clock, length, volume, owlShare, birdShare);
  }
  if (clockCount >= 2 && birdShare >= CLOCK_SHARE && birdShare > owlShare) {
    return result("early_bird", clock, length, volume, owlShare, birdShare);
  }

  if (recentPlayDays.length >= 2 && midPlay >= 120) {
    return result("hearth", clock, length, volume, owlShare, birdShare);
  }
  if (recentPlayDays.length >= 2 && midPlay > 0 && midPlay < 45) {
    return result("firecracker", clock, length, volume, owlShare, birdShare);
  }

  if (weekPlayDays >= 5) {
    return result("chart_topper", clock, length, volume, owlShare, birdShare);
  }
  if (weekPlayDays <= 2) {
    return result("one_hit_wonder", clock, length, volume, owlShare, birdShare);
  }

  return result(
    weekPlayDays >= 4 ? "chart_topper" : "one_hit_wonder",
    clock,
    length,
    volume,
    owlShare,
    birdShare,
  );
}

async function loadPlayStamps(profileId: string): Promise<PlayStamp[]> {
  const [rows, held] = await Promise.all([
    getDb()
      .select({
        appId: gamePlaytime.appId,
        lastPlayedAt: gamePlaytime.lastPlayedAt,
      })
      .from(gamePlaytime)
      .where(eq(gamePlaytime.profileId, profileId)),
    lastHeldDayByApp(profileId),
  ]);

  return rows.map((row) => ({
    lastPlayedAt: row.lastPlayedAt,
    lastHeldDay: held.get(row.appId) ?? null,
  }));
}

export async function computeArchetypeBreakdown(
  profile: Pick<Profile, "id" | "timeZone">,
): Promise<ArchetypeBreakdown> {
  const [games, daily] = await Promise.all([
    loadPlayStamps(profile.id),
    listAccountDailyMinutes(profile.id),
  ]);
  return classifyArchetype({
    games,
    dailyMinutes: daily,
    timeZone: profile.timeZone,
  });
}

export async function refreshProfileArchetype(
  profile: Pick<Profile, "id" | "timeZone" | "archetype">,
): Promise<Archetype> {
  const breakdown = await computeArchetypeBreakdown(profile);
  if (profile.archetype) {
    await updateProfileArchetype(profile.id, breakdown.winner);
  }
  return breakdown.winner;
}

export function archetypeHover(archetype: Archetype): string {
  const meta = ARCHETYPE_META[archetype];
  return `This user is ${meta.article} ${meta.label}, meaning that ${meta.meaning}.`;
}
