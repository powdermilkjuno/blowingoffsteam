"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getProfileByAuthUserId, getSteamLink } from "@/lib/db/profiles";
import { syncLinkedPlaytime } from "@/lib/playtime-sync";

const COOLDOWN_MS = 30_000;

export type RefreshState = { error?: string; success?: string };

export async function refreshPlaytimeAction(
  _prev: RefreshState,
  _formData: FormData,
): Promise<RefreshState> {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const steam = await getSteamLink(profile.id);
  if (!steam) return { error: "Link Steam before refreshing playtime." };

  const waited = Date.now() - steam.syncedAt.getTime();
  if (waited < COOLDOWN_MS) {
    const seconds = Math.ceil((COOLDOWN_MS - waited) / 1000);
    return { error: `Wait ${seconds}s — Steam was just polled.` };
  }

  try {
    const playtime = await syncLinkedPlaytime({
      profileId: profile.id,
      steamId: steam.steamId,
      profileUrl: steam.profileUrl,
    });

    revalidatePath("/dashboard");
    revalidatePath("/api/me");
    revalidatePath(`/u/${profile.username}`);

    if (!playtime.isPublic) {
      return { error: "Steam says game details are private, so nothing updated." };
    }

    return {
      success: `Updated ${playtime.games.length} games from Steam.`,
    };
  } catch {
    return { error: "Steam did not respond. Try again in a moment." };
  }
}
