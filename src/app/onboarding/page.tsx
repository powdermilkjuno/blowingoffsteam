import Image from "next/image";
import { redirect } from "next/navigation";
import { computeArchetypeBreakdown } from "@/lib/archetypes";
import { auth } from "@/lib/auth/server";
import { getEmailForAuthUser } from "@/lib/db/auth-users";
import {
  getProfileByAuthUserId,
  isProfileComplete,
  suggestUsername,
} from "@/lib/db/profiles";
import { listTimeZones } from "@/lib/playtime-windows";
import { getSteamTicket } from "@/lib/steam-ticket";
import { AuthShell } from "../auth/_components/auth-shell";
import { ArchetypeOffer } from "./archetype-offer";
import { ArchetypeReveal } from "./archetype-reveal";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: PageProps<"/onboarding">) {
  const ticket = await getSteamTicket();
  const { data: session } = await auth.getSession();
  const profile = session?.user
    ? await getProfileByAuthUserId(session.user.id)
    : null;
  const showDiagnostic = (await searchParams).diagnostic === "1";

  if (profile?.archetype && isProfileComplete(profile)) {
    redirect("/dashboard");
  }

  if (profile) {
    const email = await getEmailForAuthUser(profile.authUserId);
    const needsCaps =
      profile.capDayMinutes == null ||
      profile.capWeekMinutes == null ||
      profile.capMonthMinutes == null;
    const locked = {
      username: profile.username,
      displayName: profile.displayName,
      email: email ?? "",
      timeZone: profile.timeZone,
    };
    const caps = {
      capDayMinutes: profile.capDayMinutes,
      capWeekMinutes: profile.capWeekMinutes,
      capMonthMinutes: profile.capMonthMinutes,
    };

    if (showDiagnostic) {
      const breakdown = await computeArchetypeBreakdown(profile);
      return (
        <AuthShell
          title="Your archetype"
          subtitle="This badge comes from how you play. Take it, or skip and stay unlabeled."
        >
          <ArchetypeReveal
            breakdown={breakdown}
            needsCaps={needsCaps}
            caps={caps}
            locked={locked}
          />
        </AuthShell>
      );
    }

    return (
      <AuthShell
        title="Play-style diagnostic"
        subtitle="Optional. We can suggest one badge from how you play, or you can skip."
      >
        <ArchetypeOffer needsCaps={needsCaps} caps={caps} locked={locked} />
      </AuthShell>
    );
  }

  if (!ticket) {
    redirect("/auth/steam/login");
  }

  return (
    <AuthShell
      title="Finish setting up"
      subtitle="Steam is connected. Pick a username, time zone, and the hours you hope not to pass."
    >
      <div className="flex items-center gap-3 rounded border border-line bg-raised p-3">
        {ticket.avatarUrl && (
          <Image
            src={ticket.avatarUrl}
            alt=""
            width={40}
            height={40}
            className="rounded"
          />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-paper">{ticket.displayName}</p>
          <p className="text-xs text-muted">Steam connected</p>
        </div>
      </div>

      <OnboardingForm
        defaultUsername={suggestUsername(ticket.displayName, ticket.steamId)}
        defaultDisplayName={ticket.displayName}
        timeZones={listTimeZones()}
      />
    </AuthShell>
  );
}
