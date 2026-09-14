import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function AppShell({
  active,
  displayName,
  children,
  wide = false,
}: {
  active?: "dashboard" | "friends" | "leaderboard" | "settings";
  displayName?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen">
      <AppHeader active={active} displayName={displayName} />
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
