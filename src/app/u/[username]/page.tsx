import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { loadDashboard } from "@/lib/dashboard-data";
import { areFriends } from "@/lib/db/friends";
import { getProfileByAuthUserId, getProfileByUsername } from "@/lib/db/profiles";
import { AppNav } from "../../_components/app-nav";
import { PlaytimeView } from "../../_components/playtime-view";

export const dynamic = "force-dynamic";

export default async function FriendProfilePage({
  params,
}: PageProps<"/u/[username]">) {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const viewer = await getProfileByAuthUserId(session.user.id);
  if (!viewer) redirect("/onboarding");

  const { username } = await params;
  const target = await getProfileByUsername(username);
  if (!target) notFound();

  if (target.id === viewer.id) redirect("/dashboard");

  // Playtime is only visible to accepted friends.
  if (!(await areFriends(viewer.id, target.id))) {
    return (
      <div className="flex flex-1 flex-col bg-[#1b2838] font-sans text-[#c7d5e0]">
        <AppNav displayName={viewer.displayName} />
        <main className="mx-auto w-full max-w-3xl px-6 py-8">
          <section className="space-y-3 rounded border border-[#2a3f5a] bg-[#16202d] p-5">
            <h1 className="text-sm font-medium text-white">
              You are not friends with @{target.username}
            </h1>
            <p className="text-sm text-[#8f98a0]">
              Ask them for their friend code to send a request.
            </p>
            <Link
              href="/friends"
              className="inline-block rounded bg-[#66c0f4] px-4 py-2 text-sm font-medium text-[#1b2838] hover:bg-white"
            >
              Go to friends
            </Link>
          </section>
        </main>
      </div>
    );
  }

  const data = await loadDashboard(target);

  return (
    <div className="flex flex-1 flex-col bg-[#1b2838] font-sans text-[#c7d5e0]">
      <AppNav displayName={viewer.displayName} />

      <main className="mx-auto w-full max-w-3xl space-y-6 px-6 py-8">
        <Link href="/friends" className="text-xs text-[#66c0f4] hover:text-white">
          ← Back to friends
        </Link>
        <PlaytimeView data={data} viewerIsOwner={false} />
      </main>
    </div>
  );
}
