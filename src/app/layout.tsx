import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  JetBrains_Mono,
  Libre_Baskerville,
  Press_Start_2P,
} from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const pressStart = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-pixel",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Blowing Off Steam — track your playtime",
  description:
    "Track your Steam playtime, see your weekly patterns, and see how you rank against friends.",
};

const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("bos-theme") || localStorage.getItem("uptime-theme");
    var theme = stored === "light" || stored === "dark" ? stored : "dark";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    var match = document.cookie.match(/(?:^|; )bos-site-pack=([^;]*)/);
    var pack = match ? decodeURIComponent(match[1]) : "default";
    if (pack !== "dusk" && pack !== "ember" && pack !== "terminal") pack = "default";
    document.documentElement.setAttribute("data-site-pack", pack);
  } catch (err) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} ${jetbrainsMono.variable} ${pressStart.variable} ${libreBaskerville.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col font-mono antialiased">
        {children}
      </body>
    </html>
  );
}
