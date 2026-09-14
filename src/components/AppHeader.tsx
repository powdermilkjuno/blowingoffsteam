import Link from "next/link";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { signOutAction } from "@/app/auth/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/friends", label: "Friends", key: "friends" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
] as const;

export default function AppHeader({
  active,
  displayName,
}: {
  active?: "dashboard" | "friends" | "leaderboard" | "settings";
  displayName?: string;
}) {
  return (
    <header className="hairline border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-6">
          <Logo />
          <nav className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${
                  active === link.key
                    ? "bg-signal text-ink"
                    : "text-paper hover:bg-raised hover:text-signal"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {displayName ? (
            <span className="hidden max-w-32 truncate text-xs text-muted sm:inline">
              {displayName}
            </span>
          ) : null}
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className={`flex h-9 w-9 items-center justify-center rounded-sm border transition-colors ${
              active === "settings"
                ? "border-signal bg-signal text-ink"
                : "border-line text-fern hover:border-fern hover:text-signal"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="M19.4 13.5c.04-.33.06-.66.06-1s-.02-.67-.06-1l2.02-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.60-.22l-2.38.96a7.4 7.4 0 0 0-1.73-1l-.36-2.53a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.53c-.63.24-1.21.58-1.73 1l-2.38-.96a.5.5 0 0 0-.6.22L2.7 9.28a.5.5 0 0 0 .12.64L4.84 11.5c-.04.33-.06.66-.06 1s.02.67.06 1L2.82 15.08a.5.5 0 0 0-.12.64l1.92 3.32c.13.22.4.3.6.22l2.38-.96c.52.42 1.1.76 1.73 1l.36 2.53c.05.24.26.42.5.42h-3.84c.24 0 .45-.18.5-.42l.36-2.53c.63-.24 1.21-.58 1.73-1l2.38.96c.22.08.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64L19.4 13.5Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-sm border border-line px-3 py-1.5 text-xs text-paper hover:border-fern hover:text-signal"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
