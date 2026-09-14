import { JetBrains_Mono, Press_Start_2P } from "next/font/google";
import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-mono",
  display: "swap",
});

// Used sparingly for small, game-flavored accents (e.g. leaderboard rows) —
// not the app's primary typeface.
const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

export const metadata = {
  title: "uptime — track your playtime",
  description: "Track your Steam playtime, see your weekly patterns, and see how you rank against friends.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("uptime-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "light";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  } catch (err) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`light ${jetbrainsMono.variable} ${pressStart.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="font-mono antialiased">{children}</body>
    </html>
  );
}
