import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import SitePackSync from "@/components/SitePackSync";

export default function AppShell({
  active,
  displayName,
  children,
  wide = false,
  walletPoints,
  sitePack,
}: {
  active?: "dashboard" | "friends" | "groups" | "leaderboard" | "settings" | "shop";
  displayName?: string;
  children: ReactNode;
  wide?: boolean;
  walletPoints?: number;
  sitePack?: string;
}) {
  return (
    <div className="relative min-h-screen">
      <SitePackSync equippedId={sitePack} />
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-64" />
      <AppHeader
        active={active}
        displayName={displayName}
        walletPoints={walletPoints}
      />
      <main
        className={`mx-auto w-full space-y-6 px-6 py-10 ${
          wide ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
