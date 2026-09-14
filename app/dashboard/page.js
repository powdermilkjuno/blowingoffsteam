import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import Card from "@/components/Card";
import PlaytimeChart from "@/components/PlaytimeChart";
import HighScoreRow from "@/components/HighScoreRow";

function initials(name) {
  return name
    .split(/[_\s]/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

const weekData = [
  { day: "Mon", hours: 1.2 },
  { day: "Tue", hours: 2.4 },
  { day: "Wed", hours: 0.6 },
  { day: "Thu", hours: 3.1 },
  { day: "Fri", hours: 4.8 },
  { day: "Sat", hours: 5.6 },
  { day: "Sun", hours: 3.9 },
];

const leaders = [
  { rank: 1, name: "mira_kwon", hours: 34.2, delta: 1 },
  { rank: 2, name: "devon_r", hours: 29.8, delta: -1 },
  { rank: 3, name: "alex_chen", hours: 21.6, delta: 2, isUser: true },
  { rank: 4, name: "priya.s", hours: 18.4, delta: 0 },
  { rank: 5, name: "tomas_lg", hours: 15.1, delta: -1 },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <AppHeader active="dashboard" />

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-fern">Welcome back</p>
          <h1 className="mt-1 text-2xl tracking-tight text-paper">alex_chen</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="space-y-6 lg:col-span-3">
            <Card className="p-6" radius="lg">
              <div className="flex flex-col items-start">
                <span className="flex h-14 w-14 items-center justify-center rounded-md bg-clay/25 text-lg text-clay">
                  {initials("alex_chen")}
                </span>
                <p className="mt-3 text-sm text-paper">alex_chen</p>
              </div>

              <div className="mt-6 grid grid-cols-3 divide-x divide-line border-t border-line pt-5">
                <div>
                  <p className="text-xs text-fern">This week</p>
                  <p className="mt-1.5 text-xl tracking-tight text-paper">21.6h</p>
                  <p className="mt-1 text-xs text-muted">+2.4h vs last week</p>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-fern">Daily average</p>
                  <p className="mt-1.5 text-xl tracking-tight text-paper">3.1h</p>
                </div>
                <div className="pl-4">
                  <p className="text-xs text-fern">Current streak</p>
                  <p className="mt-1.5 text-xl tracking-tight text-paper">6 days</p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm text-paper">Hours played per day</h2>
                <span className="text-xs text-muted">Last 7 days</span>
              </div>
              <div className="mt-4">
                <PlaytimeChart data={weekData} />
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="overflow-hidden p-0" radius="sm">
              <div className="flex items-center justify-between px-5 py-4">
                <h2 className="text-sm text-paper">Leaderboard</h2>
                <Link href="/leaderboard" className="text-xs text-fern hover:text-signal">
                  View all
                </Link>
              </div>

              <div className="border-t border-line bg-raised px-4 pb-5 pt-6">
                <h3 className="text-center font-pixel text-base tracking-wide text-clay">
                  High Scores
                </h3>

                <div className="mt-6 flex items-center gap-3 px-4 pb-2 font-pixel text-[10px] tracking-wide text-fern">
                  <span className="w-14 flex-shrink-0">Rank</span>
                  <span className="w-7 flex-shrink-0" />
                  <span className="flex-1">Name</span>
                  <span className="w-24 flex-shrink-0 text-right">Hours</span>
                </div>

                <div className="space-y-0.5">
                  {leaders.map((l) => (
                    <HighScoreRow key={l.name} {...l} />
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
