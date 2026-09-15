export const ACCOUNT_APP_ID = 0;
export const DEFAULT_TIME_ZONE = "UTC";

export const PERIOD_DAYS = {
  today: 1,
  week: 7,
  twoWeeks: 14,
  month: 28,
} as const;

export function isValidTimeZone(timeZone: string): boolean {
  try {
    Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone?: string | null): string {
  if (timeZone && isValidTimeZone(timeZone)) return timeZone;
  return DEFAULT_TIME_ZONE;
}

export function listTimeZones(): string[] {
  const all =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : [DEFAULT_TIME_ZONE];
  const preferred = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Sao_Paulo",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Asia/Tokyo",
    "Asia/Shanghai",
    "Australia/Sydney",
  ].filter((zone) => all.includes(zone));
  return [...preferred, ...all.filter((zone) => !preferred.includes(zone))];
}

export function startOfUtcDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

export function dayStringInZone(at: Date, timeZone?: string | null): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

export function utcDayString(at: Date): string {
  return dayStringInZone(at, DEFAULT_TIME_ZONE);
}

export function addUtcDays(day: string, days: number): string {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + days));
  return next.toISOString().slice(0, 10);
}

export function rollingWindowStart(at: Date, dayCount: number): Date {
  const start = startOfUtcDay(at);
  start.setUTCDate(start.getUTCDate() - (dayCount - 1));
  return start;
}

export function priorDayWindow(
  today: string,
  dayCount: number,
): { from: string; to: string } {
  const to = addUtcDays(today, -1);
  return { from: addUtcDays(to, -(dayCount - 1)), to };
}

export function rollingStartDay(today: string, dayCount: number): string {
  return addUtcDays(today, -(dayCount - 1));
}

// Closed days only: yesterday back `dayCount` days. Today is never included.
export function priorUtcWindow(
  at: Date,
  dayCount: number,
): { from: Date; to: Date } {
  const to = startOfUtcDay(at);
  to.setUTCDate(to.getUTCDate() - 1);
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - (dayCount - 1));
  return { from, to };
}

export function recencyUnix(game: {
  lastPlayedAt?: number | null;
  lastHeldDay?: string | null;
}): number {
  const fromSteam =
    game.lastPlayedAt != null && game.lastPlayedAt > 0 ? game.lastPlayedAt : 0;
  let fromHeld = 0;
  if (game.lastHeldDay) {
    const parsed = Date.parse(`${game.lastHeldDay}T12:00:00.000Z`);
    fromHeld = Number.isFinite(parsed) ? Math.floor(parsed / 1000) : 0;
  }
  return Math.max(fromSteam, fromHeld);
}

// Steam's 14-day minutes are a lump. A real rtime_last_played inside that
// window is the day we can date. Missing last-played still means Steam saw
// play in the last 14 days, so park on yesterday — never today (pull time)
// and never the 14-day window start (that hides this week).
export function steamSeedDay(
  at: Date,
  lastPlayedAt: number | null,
  timeZone?: string | null,
): string {
  const today = dayStringInZone(at, timeZone);
  const yesterday = addUtcDays(today, -1);
  const windowStart = rollingStartDay(today, PERIOD_DAYS.twoWeeks);

  if (lastPlayedAt == null) return yesterday;

  const lastDay = dayStringInZone(new Date(lastPlayedAt * 1000), timeZone);
  if (lastDay >= windowStart && lastDay <= today) return lastDay;
  return yesterday;
}

export function computePlaytimeIncrements(
  previousForever: Map<number, number>,
  games: {
    appId: number;
    playtimeMinutes: number;
    playtimeTwoWeeksMinutes?: number;
    lastPlayedAt?: number | null;
  }[],
  opts?: { today: string; timeZone?: string | null },
): { appId: number; minutes: number }[] {
  if (previousForever.size === 0) return [];

  const increments: { appId: number; minutes: number }[] = [];
  for (const game of games) {
    const prev = previousForever.get(game.appId);
    if (prev === undefined) {
      const twoWeeks = game.playtimeTwoWeeksMinutes ?? 0;
      if (
        opts &&
        twoWeeks > 0 &&
        game.lastPlayedAt != null &&
        dayStringInZone(new Date(game.lastPlayedAt * 1000), opts.timeZone) ===
          opts.today
      ) {
        increments.push({ appId: game.appId, minutes: twoWeeks });
      }
      continue;
    }
    const delta = Math.max(0, game.playtimeMinutes - prev);
    if (delta > 0) increments.push({ appId: game.appId, minutes: delta });
  }
  return increments;
}

export function dailyDiffsFromClosings(
  closingByDay: Map<string, number>,
): { day: string; minutes: number }[] {
  const days = [...closingByDay.keys()].sort();
  const diffs: { day: string; minutes: number }[] = [];

  for (let i = 1; i < days.length; i += 1) {
    const minutes = Math.max(
      0,
      (closingByDay.get(days[i]) ?? 0) - (closingByDay.get(days[i - 1]) ?? 0),
    );
    if (minutes > 0) diffs.push({ day: days[i], minutes });
  }

  return diffs;
}
