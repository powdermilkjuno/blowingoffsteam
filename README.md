# uptime — frontend

A Steam playtime tracker & friends leaderboard. Next.js (App Router) +
Tailwind CSS + Recharts, styled with a Game Boy–inspired green-on-black
palette and a monospace typeface throughout.

## Pages

| Route            | Description                                               |
|-------------------|-------------------------------------------------------------|
| `/`               | Landing page                                               |
| `/login`          | Log in with username + password, link to sign up           |
| `/signup`         | Create account: username, email, password                  |
| `/onboarding`     | Connect Steam account step after signup                    |
| `/dashboard`      | Playtime stats + weekly chart (left), leaderboard (right)  |
| `/settings`       | Profile, password, connected accounts, notifications       |
| `/leaderboard`    | Full leaderboard with week / month / all-time tabs          |

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Structure

```
app/                 routes (App Router)
components/           shared UI: Button, Card, Field, Logo, AppHeader,
                       PlaytimeChart, LeaderboardRow, LeaderboardTabs, Toggle
tailwind.config.js    color tokens + font mapping
app/globals.css       base styles, scrollbar, background grid
```

## Design tokens

Colors are defined as CSS variables in `app/globals.css` (dark theme on `:root`/`html.dark`, light theme on `html.light`) and mapped into Tailwind in `tailwind.config.js`, so every `bg-signal`, `text-clay`, etc. class automatically adapts to the active theme:

- `bg` — page background
- `surface` — card background
- `raised` — hover / active surface
- `line` — borders & dividers
- `moss` / `fern` — secondary greens (icons, secondary text)
- `signal` / `signal2` — primary accent (grass/sage green) + hover state
- `clay` / `clay2` — secondary accent (terracotta) + hover state
- `paper` — primary text
- `muted` — secondary text
- `danger` — rust red
- `ink` — a fixed dark "screen" color that does **not** switch with theme, used for the arcade-style leaderboard panels and button text so they keep their contrast in both modes

The theme toggle (top right of every page) writes to `localStorage` under the key `uptime-theme`, falls back to the OS `prefers-color-scheme` on first visit, and is applied via an inline script in `app/layout.js` before hydration to avoid a flash of the wrong theme.

Font: [JetBrains Mono](https://www.jetbrains.com/lp/mono/) loaded via
`next/font/google`, used for every element on the page. A secondary pixel
face (Press Start 2P) is used sparingly on the leaderboard rows.

All data on the dashboard, leaderboard, and settings pages is mock data
wired up for the UI — connect it to your API/auth backend as needed.
