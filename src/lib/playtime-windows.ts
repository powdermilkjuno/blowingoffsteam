export const ACCOUNT_APP_ID = 0;

export const PERIOD_DAYS = {
  today: 1,
  week: 7,
  twoWeeks: 14,
  month: 28,
} as const;

export function startOfUtcDay(at: Date): Date {
  return new Date(
    Date.UTC(at.getUTCFullYear(), at.getUTCMonth(), at.getUTCDate()),
  );
}

export function utcDayString(at: Date): string {
  return startOfUtcDay(at).toISOString().slice(0, 10);
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

// Steam's 14-day total is never "played today" — last-played is only a
// launch time. Brand-new accounts need this on a closed day so this week
// and last 2 weeks show something on first sync.
export function steamSeedDay(
  at: Date,
  lastPlayedAt: number | null,
): string {
  const today = utcDayString(at);
  const yesterday = utcDayString(priorUtcWindow(at, 1).to);
  const windowStart = utcDayString(rollingWindowStart(at, PERIOD_DAYS.twoWeeks));

  if (lastPlayedAt == null) return yesterday;

  const lastDay = utcDayString(new Date(lastPlayedAt * 1000));
  if (lastDay >= windowStart && lastDay < today) return lastDay;
  return yesterday;
}

export function computePlaytimeIncrements(
  previousForever: Map<number, number>,
  games: { appId: number; playtimeMinutes: number }[],
): { appId: number; minutes: number }[] {
  if (previousForever.size === 0) return [];

  const increments: { appId: number; minutes: number }[] = [];
  for (const game of games) {
    const prev = previousForever.get(game.appId);
    if (prev === undefined) continue;
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
