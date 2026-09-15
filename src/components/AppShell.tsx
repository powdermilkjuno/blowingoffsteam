"use client";

import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";
import SitePackSync from "@/components/SitePackSync";
import ParallaxBackdrop from "@/components/ParallaxBackdrop";

export default function AppShell({
  active,
  displayName,
  children,
  wide = false,
  walletPoints,
  sitePack,
  persistSitePack = true,
}: {
  active?: "dashboard" | "friends" | "groups" | "leaderboard" | "settings" | "shop";
  displayName?: string;
  children: ReactNode;
  wide?: boolean;
  walletPoints?: number;
  sitePack?: string;
  persistSitePack?: boolean;
}) {
  return (
    <div className="relative min-h-screen">
      <SitePackSync equippedId={sitePack} persist={persistSitePack} />
      <ParallaxBackdrop themeId={sitePack} />
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-64" />
      <div className="relative z-10">
        <AppHeader
          active={active}
          displayName={displayName}
          walletPoints={walletPoints}
        />
      </div>
      <main
        className={`relative z-10 mx-auto w-full space-y-6 px-6 py-10 ${
          wide ? "max-w-6xl" : "max-w-3xl"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
