import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import TerminalWindow from "@/components/TerminalWindow";
import ThemeToggle from "@/components/ThemeToggle";
import { auth } from "@/lib/auth/server";
import { SteamButton } from "./auth/_components/social-buttons";

export const dynamic = "force-dynamic";

const leaderboard = [
  { rank: "1ST", name: "kingofthepirates99", hours: "2.5h" },
  { rank: "2ND", name: "sunmoonstars", hours: "6.3h" },
  { rank: "3RD", name: "gregathome", hours: "12.2h" },
  { rank: "4TH", name: "simonthexcavator", hours: "20.5h" },
];

export default async function LandingPage() {
  const { data: session } = await auth.getSession();
  const signedIn = Boolean(session?.user);

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
        <div className="grid-fade pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px]" />
        <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-105" />
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
          >

            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-sm bg-raised/80 px-2 py-1.5 text-xs text-muted">
                <span>Rank</span>
                <span>Name</span>
                <span>Hours</span>
              </div>
              <div className="space-y-1">
                {leaderboard.map((row, i) => (
                  <div
                    key={row.name}
                    className={`flex items-center justify-between rounded-sm px-2 py-1.5 ${
                      i === 0 ? "bg-raised/80" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-8 text-xs ${
                          i === 0 ? "text-clay" : "text-muted"
                        }`}
                      >
                        {row.rank}
                      </span>
                      <span className="cursor-pointer text-sm text-paper transition-colors hover:text-signal hover:underline hover:underline-offset-2">
                        {row.name}
                      </span>
                    </div>
                    <span className="text-sm text-signal">{row.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </TerminalWindow>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl items-center justify-between border-t border-line px-6 py-8 text-xs text-muted">
        <span>Blowing Off Steam — not affiliated with Valve or Steam.</span>
      </footer>
    </div>
  );
}

