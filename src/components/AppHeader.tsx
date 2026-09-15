"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Cross1Icon,
  GearIcon,
  HamburgerMenuIcon,
} from "@radix-ui/react-icons";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import { signOutAction } from "@/app/auth/actions";

const links = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/friends", label: "Friends", key: "friends" },
  { href: "/groups", label: "Groups", key: "groups" },
  { href: "/leaderboard", label: "Leaderboard", key: "leaderboard" },
  { href: "/shop", label: "Shop", key: "shop" },
] as const;

type ActiveKey =
  | "dashboard"
  | "friends"
  | "groups"
  | "leaderboard"
  | "settings"
  | "shop";

export default function AppHeader({
  active,
  displayName,
  walletPoints,
}: {
  active?: ActiveKey;
  displayName?: string;
  walletPoints?: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="hairline relative border-b border-line bg-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex min-w-0 items-center gap-6">
          <span className="pointer-events-none">
            <Logo />
          </span>
          <nav
            aria-label="Primary"
            className="hidden items-center gap-1 overflow-x-auto sm:flex"
          >
            {links.map((link) => (
              <Link
                key={link.key}
                href={link.href}
                aria-current={active === link.key ? "page" : undefined}
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
            <span className="hidden max-w-40 truncate text-xs text-muted sm:inline">
              {displayName}
              {walletPoints != null ? ` · ${walletPoints} pts` : ""}
            </span>
          ) : null}
          <ThemeToggle />

          <Link
            href="/settings"
            aria-label="Settings"
            className={`hidden h-9 w-9 items-center justify-center rounded-sm border transition-colors sm:flex ${
              active === "settings"
                ? "border-signal bg-signal text-ink"
                : "border-line text-fern hover:border-fern hover:text-signal"
            }`}
          >
            <GearIcon width={18} height={18} aria-hidden="true" />
          </Link>

          <form action={signOutAction} className="hidden sm:block">
            <button
              type="submit"
              className="rounded-sm border border-line px-3 py-1.5 text-xs text-paper hover:border-fern hover:text-signal"
            >
              Sign out
            </button>
          </form>

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-line text-paper transition-colors hover:border-fern hover:text-signal sm:hidden"
          >
            {menuOpen ? (
              <Cross1Icon width={18} height={18} aria-hidden="true" />
            ) : (
              <HamburgerMenuIcon width={18} height={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t border-line bg-bg px-6 py-4 sm:hidden"
        >
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.key}>
                <Link
                  href={link.href}
                  aria-current={active === link.key ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`block rounded-sm px-3 py-2.5 text-sm transition-colors ${
                    active === link.key
                      ? "bg-signal text-ink"
                      : "text-paper hover:bg-raised hover:text-signal"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/settings"
                aria-current={active === "settings" ? "page" : undefined}
                onClick={() => setMenuOpen(false)}
                className={`block rounded-sm px-3 py-2.5 text-sm transition-colors ${
                  active === "settings"
                    ? "bg-signal text-ink"
                    : "text-paper hover:bg-raised hover:text-signal"
                }`}
              >
                Settings
              </Link>
            </li>
          </ul>

          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            {displayName ? (
              <span className="truncate text-xs text-muted">
                {displayName}
                {walletPoints != null ? ` · ${walletPoints} pts` : ""}
              </span>
            ) : (
              <span />
            )}
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-sm border border-line px-3 py-1.5 text-xs text-paper hover:border-fern hover:text-signal"
              >
                Sign out
              </button>
            </form>
          </div>
        </nav>
      )}
    </header>
  );
}

