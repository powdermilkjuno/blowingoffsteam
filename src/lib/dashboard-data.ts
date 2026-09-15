import { listFriends } from "./db/friends";
import {
  listAcceptedMembers,
  listGroupsForProfile,
  type GroupListItem,
} from "./db/groups";
import type { GroupAccent } from "./group-accent";
import {
  getProfileGames,
  getSteamLink,
  isStale,
  type Archetype,
  type Profile,
  type SteamLink,
} from "./db/profiles";
import {
  getPlaytimePeriods,
  lastHeldDayByApp,
  seedMissingDailyFromSteamWindow,
  sumDailyMinutesByApp,
  type PlaytimePeriods,
} from "./db/daily";
import { syncLinkedPlaytime } from "./playtime-sync";
import {
  dayStringInZone,
  resolveTimeZone,
  rollingStartDay,
  PERIOD_DAYS,
} from "./playtime-windows";
import { loadStreaks, type Streaks } from "./streaks";
import type { GamePlaytime } from "./steam-api";

export type DashboardGame = GamePlaytime & {
  todayMinutes: number;
  weekMinutes: number;
  lastHeldDay: string | null;
};

export type DashboardData = {
  profile: Profile;
  steam: SteamLink | null;
  games: DashboardGame[];
  periods: PlaytimePeriods;
  displayTimeZone: string;
  streaks: Streaks;
};

export async function loadDashboard(
  profile: Profile,
  opts?: { displayTimeZone?: string },
): Promise<DashboardData> {
  let steam = await getSteamLink(profile.id);
  const timeZone = resolveTimeZone(profile.timeZone);
  const displayTimeZone = resolveTimeZone(
    opts?.displayTimeZone ?? profile.timeZone,
  );

  if (steam && isStale(steam.syncedAt)) {
    try {
      await syncLinkedPlaytime({
        profileId: profile.id,
        steamId: steam.steamId,
        profileUrl: steam.profileUrl,
      });
      steam = await getSteamLink(profile.id);
    } catch {
      // Serve the last held totals if Steam is unreachable.
    }
  }

  const now = new Date();
  const today = dayStringInZone(now, timeZone);
  const library = steam ? await getProfileGames(profile.id) : [];

  if (steam?.playtimePublic && library.length > 0) {
    await seedMissingDailyFromSteamWindow({
      profileId: profile.id,
      games: library,
      at: now,
      timeZone,
    });
  }

  const steamTwoWeeks = library.reduce(
    (sum, game) => sum + game.playtimeTwoWeeksMinutes,
    0,
  );
  const periods = steam
    ? await getPlaytimePeriods(profile.id, now, {
        twoWeeks: steamTwoWeeks,
        timeZone,
      })
    : {
        sampledFrom: null,
        snapshotCount: 0,
        twoWeeks: null,
        today: null,
        week: null,
        month: null,
      };

  const weekStart = rollingStartDay(today, PERIOD_DAYS.week);
  const [todayByApp, weekByApp, heldDayByApp] = await Promise.all([
    sumDailyMinutesByApp({ profileId: profile.id, fromDay: today, toDay: today }),
    sumDailyMinutesByApp({
      profileId: profile.id,
      fromDay: weekStart,
      toDay: today,
    }),
    lastHeldDayByApp(profile.id),
  ]);

  const games = library.map((game) => ({
    ...game,
    todayMinutes: todayByApp.get(game.appId) ?? 0,
    weekMinutes: weekByApp.get(game.appId) ?? 0,
    lastHeldDay: heldDayByApp.get(game.appId) ?? null,
  }));

  return {
    profile,
    steam,
    games,
    periods,
    displayTimeZone,
    streaks: await loadStreaks(profile),
  };
}

export type LeaderboardEntry = {
  name: string;
  hours: number;
  avatarUrl?: string;
  isUser?: boolean;
  bio?: string;
  archetype?: Archetype | null;
  streaks?: Streaks;
  caps?: {
    capDayMinutes: number | null;
    capWeekMinutes: number | null;
    capMonthMinutes: number | null;
  };
  frame?: string;
  font?: string;
};

export type LeaderboardBoards = {
  today: LeaderboardEntry[];
  week: LeaderboardEntry[];
  month: LeaderboardEntry[];
  all: LeaderboardEntry[];
};

export type LeaderboardGroupBoard = {
  id: string;
  name: string;
  starred: boolean;
  description: string;
  accent: GroupAccent;
  boards: LeaderboardBoards;
};

export type LeaderboardView = {
  group: LeaderboardGroupBoard | null;
  friends: LeaderboardBoards;
};

function hoursFromMinutes(minutes: number): number {
  return Math.round((minutes / 60) * 10) / 10;
}

function pickLeaderboardGroup(groups: GroupListItem[]): GroupListItem | null {
  const starred = groups.find((group) => group.favorited);
  if (starred) return starred;
  if (groups.length === 1) return groups[0];
  return null;
}

type ScoredPerson = {
  name: string;
  avatarUrl: string;
  isUser: boolean;
  bio: string;
  archetype: Archetype | null;
  streaks: Streaks;
  caps: LeaderboardEntry["caps"];
  frame: string;
  font: string;
  today: number;
  week: number;
  month: number;
  all: number;
};

function rankBoard(
  rows: {
    name: string;
    minutes: number;
    avatarUrl: string;
    isUser: boolean;
    bio: string;
    archetype: Archetype | null;
    streaks: Streaks;
    caps: LeaderboardEntry["caps"];
    frame?: string;
    font?: string;
  }[],
): LeaderboardEntry[] {
  return [...rows]
    .sort((a, b) => a.minutes - b.minutes)
    .map((row) => ({
      name: row.name,
      hours: hoursFromMinutes(row.minutes),
      avatarUrl: row.avatarUrl || undefined,
      isUser: row.isUser,
      bio: row.bio,
      archetype: row.archetype,
      streaks: row.streaks,
      caps: row.caps,
      frame: row.frame,
      font: row.font,
    }));
}

function boardsFromScored(scored: ScoredPerson[]): LeaderboardBoards {
  const extras = (row: ScoredPerson) => ({
    name: row.name,
    avatarUrl: row.avatarUrl,
    isUser: row.isUser,
    bio: row.bio,
    archetype: row.archetype,
    streaks: row.streaks,
    caps: row.caps,
    frame: row.frame,
    font: row.font,
  });

  return {
    today: rankBoard(
      scored.map((row) => ({ ...extras(row), minutes: row.today })),
    ),
    week: rankBoard(
      scored.map((row) => ({ ...extras(row), minutes: row.week })),
    ),
    month: rankBoard(
      scored.map((row) => ({ ...extras(row), minutes: row.month })),
    ),
    all: rankBoard(
      scored.map((row) => ({ ...extras(row), minutes: row.all })),
    ),
  };
}

async function scorePeople(
  viewer: Profile,
  people: Profile[],
): Promise<ScoredPerson[]> {
  const now = new Date();
  return Promise.all(
    people.map(async (person) => {
      const steam = await getSteamLink(person.id);
      const [periods, streaks] = await Promise.all([
        steam
          ? getPlaytimePeriods(person.id, now, {
              timeZone: person.timeZone,
            })
          : Promise.resolve(null),
        loadStreaks(person),
      ]);
      return {
        name: person.displayName,
        avatarUrl: person.avatarUrl,
        isUser: person.id === viewer.id,
        bio: person.bio,
        today: periods?.today?.minutes ?? 0,
        week: periods?.week?.minutes ?? 0,
        month: periods?.month?.minutes ?? 0,
        all: steam?.playtimeMinutes ?? 0,
        archetype: person.archetype,
        streaks,
        caps: {
          capDayMinutes: person.capDayMinutes,
          capWeekMinutes: person.capWeekMinutes,
          capMonthMinutes: person.capMonthMinutes,
        },
        frame: person.equippedFrame,
        font: person.equippedFont,
      };
    }),
  );
}

export async function loadLeaderboard(
  viewer: Profile,
): Promise<LeaderboardView> {
  const [friends, groups] = await Promise.all([
    listFriends(viewer.id),
    listGroupsForProfile(viewer.id),
  ]);
  const group = pickLeaderboardGroup(groups);

  const [friendScores, groupScores] = await Promise.all([
    scorePeople(viewer, [viewer, ...friends]),
    group
      ? listAcceptedMembers(group.id).then((members) =>
          scorePeople(
            viewer,
            members.map((member) => member.profile),
          ),
        )
      : Promise.resolve(null),
  ]);

  return {
    group:
      group && groupScores
        ? {
            id: group.id,
            name: group.name,
            starred: group.favorited,
            description: group.description,
            accent: group.accent,
            boards: boardsFromScored(groupScores),
          }
        : null,
    friends: boardsFromScored(friendScores),
  };
}
