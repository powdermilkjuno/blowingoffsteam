import Link from "next/link";
import Logo from "@/components/Logo";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ThemeToggle from "@/components/ThemeToggle";

const requires = [
  "Your public Steam profile",
  "Game details & playtime (read-only)",
];

export default function OnboardingPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]" />

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <div className="mb-6 flex items-center gap-2" aria-label="Step 2 of 2">
        <span className="h-1.5 w-6 rounded-full bg-moss" />
        <span className="h-1.5 w-6 rounded-full bg-signal" />
      </div>

      <Card className="w-full max-w-sm p-7 text-center animate-rise">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded border border-line bg-raised">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="rgb(var(--color-clay))" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="3" stroke="rgb(var(--color-clay))" strokeWidth="1.6" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke="rgb(var(--color-clay))" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="text-xl text-paper">Connect your Steam account</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          uptime reads your playtime from Steam to build your dashboard and
          keep your leaderboard rank current.
        </p>

        <ul className="mt-6 space-y-2 text-left text-sm text-fern">
          {requires.map((r) => (
            <li key={r} className="flex items-start gap-2.5">
              <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-fern" />
              {r}
            </li>
          ))}
        </ul>

        <Button variant="primary" className="mt-7 w-full" href="/dashboard">
          Connect Steam account
        </Button>

        <Link
          href="/dashboard"
          className="mt-4 block text-xs text-muted hover:text-signal"
        >
          Skip for now
        </Link>
      </Card>

      <p className="mt-6 max-w-sm text-center text-xs leading-relaxed text-muted">
        We never post to your profile or change your privacy settings.
        Disconnect anytime from account settings.
      </p>
    </div>
  );
}
