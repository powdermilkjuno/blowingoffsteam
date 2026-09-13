import Link from "next/link";
import { redirect } from "next/navigation";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { auth } from "@/lib/auth/server";
import { loadDashboard } from "@/lib/dashboard-data";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import { AppNav } from "../_components/app-nav";
import { PlaytimeView } from "../_components/playtime-view";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  steam_taken: "That Steam account is already linked to another account.",
};

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERRORS[error] : undefined;
  const [data, { hasPassword }] = await Promise.all([
    loadDashboard(profile),
    getLinkedAccounts(),
  ]);

  return (
    <div className="flex flex-1 flex-col bg-[#1b2838] font-sans text-[#c7d5e0]">
      <AppNav displayName={profile.displayName} />

      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        {errorMessage && (
          <p className="rounded border border-[#5a2a2a] bg-[#2d1b1b] px-3 py-2 text-sm text-[#ff8f8f]">
            {errorMessage}
          </p>
        )}

        {!hasPassword && (
          <p className="rounded border border-[#2a3f5a] bg-[#16202d] px-4 py-3 text-sm text-[#8f98a0]">
            This account has no password, so Google is the only way back in.{" "}
            <Link href="/settings" className="text-[#66c0f4] hover:text-white">
              Set one in settings
            </Link>
            .
          </p>
        )}

        <PlaytimeView data={data} viewerIsOwner />
      </main>
    </div>
  );
}
