import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import TerminalWindow from "@/components/TerminalWindow";
import ThemeToggle from "@/components/ThemeToggle";
import { auth } from "@/lib/auth/server";
import { SteamButton } from "./auth/_components/social-buttons";

const week = [
  { d: "M", h: 1.2 },
  { d: "T", h: 2.4 },
  { d: "W", h: 0.6 },
  { d: "T", h: 3.1 },
  { d: "F", h: 4.8 },
  { d: "S", h: 5.6 },
  { d: "S", h: 3.9 },
];
const maxH = Math.max(...week.map((w) => w.h));

function barTone(h: number): string {
  const ratio = h / maxH;
  if (ratio > 0.75) return "bg-clay";
  if (ratio > 0.4) return "bg-signal";
  return "bg-moss";
}

const streak = [true, true, false, true, true, true, true];

const features = [
  {
    title: "Weekly patterns",
    body: "See which days you actually play, not just a lifetime total. Spot the streaks and the slow weeks before they become one and the same.",
    accent: "bg-clay",
    lead: true,
  },
  {
    title: "Automatic tracking",
    body: "Connect Steam once. Blowing Off Steam logs playtime in the background — nothing to enter, nothing to forget.",
    accent: "bg-signal",
  },
  {
    title: "Friend leaderboard",
    body: "Compare total hours and weekly rank against people you know.",
    accent: "bg-fern",
  },
];

export default async function LandingPage() {
  const { data: session } = await auth.getSession();
  const signedIn = Boolean(session?.user);
  const [hero, ...rest] = features;

  return (
    <div className="min-h-screen">
      <header className="hairline mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <ThemeToggle />
          {signedIn ? (
            <Button href="/dashboard" variant="primary">
              Dashboard
            </Button>
          ) : (
            <>
              <Button href="/login" variant="ghost">
                Log in
              </Button>
              <Button href="/signup" variant="primary">
                Create account
              </Button>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto max-w-6xl px-6 pb-20 pt-10 md:pt-16">
        <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]" />
        <div className="steam-field -z-10" />

        <div className="grid items-center gap-14 md:grid-cols-2">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full border border-line bg-raised/80 px-3 py-1 text-xs text-fern">
              <span className="h-1.5 w-1.5 rounded-full bg-clay shadow-[0_0_8px_var(--bos-clay)]" />
              Built for Steam players
            </span>
            <h1 className="mt-5 text-4xl leading-[1.1] tracking-tight text-paper sm:text-5xl">
              Know where your hours go.
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Blowing Off Steam tracks your Steam playtime automatically, shows
              you how your week actually looked, and ranks you against the
              friends who dare to check.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <SteamButton boxed={false} />
              <Button href="/login" variant="outline">
                Email or Google
              </Button>
            </div>
            <p className="mt-6 text-xs text-muted">
              Free to use. Steam game details need to be public.
            </p>
          </div>

          <TerminalWindow
            title="dashboard.preview"
            className="animate-rise [animation-delay:120ms]"
          >
            <div className="space-y-1.5 text-sm">
              <p className="text-muted">
                <span className="text-clay">$</span> bos status
              </p>
              <p className="text-paper">
                tracking: <span className="text-signal">connected</span>
              </p>
              <p className="text-paper">
                this week: <span className="text-clay">21h 46m</span>
              </p>
              <p className="text-paper">
                rank: <span className="text-signal">#3</span> of 12 friends
              </p>
            </div>

            <div className="mt-6 flex items-end gap-2.5 border-t border-line pt-5">
              {week.map((w, index) => (
                <div
                  key={`${w.d}-${index}`}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-24 w-full items-end">
                    <div
                      className={`w-full rounded-sm ${barTone(w.h)}`}
                      style={{ height: `${(w.h / maxH) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-muted">{w.d}</span>
                </div>
              ))}
            </div>
          </TerminalWindow>
        </div>
      </section>

      <section className="mx-auto max-w-6xl border-t border-line px-6 py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="corners border border-line bg-surface/80 p-6 md:col-span-3">
            <span className={`mb-4 block h-1.5 w-6 ${hero.accent}`} />
            <h3 className="text-lg text-paper">{hero.title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
              {hero.body}
            </p>

            <div className="mt-6 flex items-center gap-1.5">
              {streak.map((played, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-sm ${played ? "bg-clay" : "bg-line"}`}
                  aria-hidden="true"
                />
              ))}
              <span className="ml-2 text-xs text-muted">
                6-day streak this week
              </span>
            </div>
          </div>

          <div className="space-y-4 md:col-span-2">
            {rest.map((f) => (
              <div
                key={f.title}
                className="border border-line bg-surface/70 p-5"
              >
                <span className={`mb-4 block h-1.5 w-6 ${f.accent}`} />
                <h3 className="text-base text-paper">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-line px-6 py-8 text-xs text-muted">
        <span>Blowing Off Steam — not affiliated with Valve or Steam.</span>
        <Link href={signedIn ? "/dashboard" : "/login"} className="hover:text-signal">
          {signedIn ? "Dashboard" : "Log in"}
        </Link>
      </footer>
    </div>
  );
}
