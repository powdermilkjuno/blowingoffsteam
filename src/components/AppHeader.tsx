import Link from "next/link";
import { GearIcon } from "@radix-ui/react-icons";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { signOutAction } from "@/app/auth/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/friends", label: "Friends", key: "friends" },
  { href: "/groups", label: "Groups", key: "groups" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
] as const;

export default function AppHeader({
  active,
  displayName,
}: {
  active?: "dashboard" | "friends" | "groups" | "leaderboard" | "settings";
  displayName?: string;
}) {
  return (
    <header className="hairline border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-6">
          <span className="pointer-events-none">
            <Logo />
          </span>
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
            <GearIcon width={18} height={18} aria-hidden="true" />
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
