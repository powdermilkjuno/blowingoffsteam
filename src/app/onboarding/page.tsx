import Image from "next/image";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getProfileByAuthUserId, suggestUsername } from "@/lib/db/profiles";
import { getSteamTicket } from "@/lib/steam-ticket";
import { AuthShell } from "../auth/_components/auth-shell";
import { OnboardingForm } from "./onboarding-form";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const ticket = await getSteamTicket();
  const { data: session } = await auth.getSession();

  if (session?.user) {
    const profile = await getProfileByAuthUserId(session.user.id);
    if (profile) redirect("/dashboard");
  }

  if (!ticket) {
    redirect("/auth/steam/login");
  }

  return (
    <AuthShell
      title="Finish setting up"
      subtitle="Steam is connected. Pick a username, then add an email and password so you can sign back in."
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
      />
    </AuthShell>
  );
}
