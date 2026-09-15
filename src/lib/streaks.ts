import { listAccountDailyMinutes } from "@/lib/db/daily";
import type { Profile } from "@/lib/db/profiles";
import { formatCapHours } from "@/lib/hours";
import { addUtcDays, dayStringInZone } from "@/lib/playtime-windows";

export type StreakKind = "day" | "week" | "month";

export type Streaks = {
  day: number;
  week: number;
  month: number;
};

function minutesOn(
  byDay: Map<string, number>,
  fromDay: string,
  toDay: string,
  onboardDay: string,
): number {
  const start = fromDay < onboardDay ? onboardDay : fromDay;
  if (start > toDay) return 0;
  let total = 0;
  for (let day = start; day <= toDay; day = addUtcDays(day, 1)) {
    total += byDay.get(day) ?? 0;
  }
  return total;
}

function sundayOnOrBefore(day: string): string {
  const [year, month, date] = day.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, date));
  utc.setUTCDate(utc.getUTCDate() - utc.getUTCDay());
  return utc.toISOString().slice(0, 10);
}

function lastDayOfMonth(year: number, monthIndex: number): string {
  const utc = new Date(Date.UTC(year, monthIndex + 1, 0));
  return utc.toISOString().slice(0, 10);
}

function shiftMonth(year: number, monthIndex: number, delta: number): {
  year: number;
  monthIndex: number;
} {
  const utc = new Date(Date.UTC(year, monthIndex + delta, 1));
  return { year: utc.getUTCFullYear(), monthIndex: utc.getUTCMonth() };
}

export function computeStreaks(input: {
  dailyMinutes: { day: string; minutes: number }[];
  capDayMinutes: number;
  capWeekMinutes: number;
  capMonthMinutes: number;
  timeZone: string;
  createdAt: Date;
  now?: Date;
}): Streaks {
  const now = input.now ?? new Date();
  const today = dayStringInZone(now, input.timeZone);
  const onboardDay = dayStringInZone(input.createdAt, input.timeZone);
  const byDay = new Map(input.dailyMinutes.map((row) => [row.day, row.minutes]));

  let dayStreak = 0;
  if (today >= onboardDay && (byDay.get(today) ?? 0) <= input.capDayMinutes) {
    for (
      let cursor = today;
      cursor >= onboardDay;
      cursor = addUtcDays(cursor, -1)
    ) {
      if ((byDay.get(cursor) ?? 0) > input.capDayMinutes) break;
      dayStreak += 1;
    }
  }

  let weekStreak = 0;
  const thisSunday = sundayOnOrBefore(today);
  let weekEnd = addUtcDays(thisSunday, -1);
  for (let i = 0; i < 80; i += 1) {
    if (weekEnd < onboardDay) break;
    const weekStart = addUtcDays(weekEnd, -6);
    const weekMinutes = minutesOn(byDay, weekStart, weekEnd, onboardDay);
    if (weekMinutes > input.capWeekMinutes) break;
    weekStreak += 1;
    weekEnd = addUtcDays(weekStart, -1);
  }

  let monthStreak = 0;
  const [year, month] = today.split("-").map(Number);
  let cursor = shiftMonth(year, month - 1, -1);
  for (let i = 0; i < 36; i += 1) {
    const start = `${cursor.year}-${String(cursor.monthIndex + 1).padStart(2, "0")}-01`;
    const end = lastDayOfMonth(cursor.year, cursor.monthIndex);
    if (end < onboardDay) break;
    if (minutesOn(byDay, start, end, onboardDay) > input.capMonthMinutes) break;
    monthStreak += 1;
    cursor = shiftMonth(cursor.year, cursor.monthIndex, -1);
  }

  return { day: dayStreak, week: weekStreak, month: monthStreak };
}

export async function loadStreaks(
  profile: Pick<
    Profile,
    | "id"
    | "timeZone"
    | "capDayMinutes"
    | "capWeekMinutes"
    | "capMonthMinutes"
    | "createdAt"
  >,
): Promise<Streaks> {
  if (
    profile.capDayMinutes == null ||
    profile.capWeekMinutes == null ||
    profile.capMonthMinutes == null
  ) {
    return { day: 0, week: 0, month: 0 };
  }

  const daily = await listAccountDailyMinutes(profile.id);
  return computeStreaks({
    dailyMinutes: daily,
    capDayMinutes: profile.capDayMinutes,
    capWeekMinutes: profile.capWeekMinutes,
    capMonthMinutes: profile.capMonthMinutes,
    timeZone: profile.timeZone,
    createdAt: profile.createdAt,
  });
}

export function streakTone(length: number): string {
  const stamp = "border-[#0b1020] shadow-[2px_2px_0_#0b1020]";
  if (length <= 0) return `${stamp} bg-[#ffffff] text-[#3d2bff]`;
  if (length <= 2) return `${stamp} bg-[#7dffb3] text-[#14104a]`;
  if (length <= 6) return `${stamp} bg-[#22e6ff] text-[#14104a]`;
  if (length <= 13) return `${stamp} bg-[#c77dff] text-[#fff8a8]`;
  return `border-[#0b1020] bg-[#ff2d8a] text-[#fff8a8] shadow-[3px_3px_0_#0b1020]`;
}

export function streakHover(
  kind: StreakKind,
  length: number,
  caps: {
    capDayMinutes: number;
    capWeekMinutes: number;
    capMonthMinutes: number;
  },
): string {
  if (kind === "day") {
    return length > 0
      ? `${length}-day streak — stayed under ${formatCapHours(caps.capDayMinutes)} today and the days before.`
      : `No daily streak — a day does not count if they go over ${formatCapHours(caps.capDayMinutes)}.`;
  }
  if (kind === "week") {
    return length > 0
      ? `${length}-week streak — under ${formatCapHours(caps.capWeekMinutes)} by Saturday 11:59.`
      : `No weekly streak — a week counts at Saturday 11:59 if they stay under ${formatCapHours(caps.capWeekMinutes)}.`;
  }
  return length > 0
    ? `${length}-month streak — under ${formatCapHours(caps.capMonthMinutes)} by the last day of the month.`
    : `No monthly streak — a month counts at 11:59 on the last day if they stay under ${formatCapHours(caps.capMonthMinutes)}.`;
}
