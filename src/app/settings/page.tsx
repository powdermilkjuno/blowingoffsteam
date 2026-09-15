import Link from "next/link";
import { getEmailForAuthUser } from "@/lib/db/auth-users";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { listTimeZones } from "@/lib/playtime-windows";
import { minutesToHoursInput } from "@/lib/hours";
import { requireCompleteProfile } from "@/lib/require-profile";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import {
  ChangePasswordForm,
  ProfileSettingsForm,
  SetPasswordPrompt,
} from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profile = await requireCompleteProfile();
  const [{ hasPassword, providers }, email] = await Promise.all([
    getLinkedAccounts(),
    getEmailForAuthUser(profile.authUserId),
  ]);

  return (
    <AppShell active="settings" displayName={profile.displayName} walletPoints={profile.walletPoints} sitePack={profile.equippedSiteTheme}>
      <PageIntro kicker="Account" title="Settings" />

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Profile</h2>
        <ProfileSettingsForm
          username={profile.username}
          displayName={profile.displayName}
          bio={profile.bio}
          timeZone={profile.timeZone}
          timeZones={listTimeZones()}
          capDayHours={minutesToHoursInput(profile.capDayMinutes)}
          capWeekHours={minutesToHoursInput(profile.capWeekMinutes)}
          capMonthHours={minutesToHoursInput(profile.capMonthMinutes)}
        />
      </Card>

      {!profile.archetype ? (
        <Card className="corners space-y-3 p-6">
          <h2 className="text-sm text-paper">Play-style diagnostic</h2>
          <p className="text-sm text-muted">
            Optional. We can suggest one archetype badge from your recent
            last-played times.
          </p>
          <Link
            href="/onboarding?diagnostic=1"
            className="inline-block text-sm text-signal hover:text-signal2"
          >
            See my archetype
          </Link>
        </Card>
      ) : null}

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">
          {hasPassword ? "Password" : "Set a password"}
        </h2>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <SetPasswordPrompt email={email ?? ""} />
        )}
      </Card>

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Sign-in methods</h2>
        <ul className="space-y-2 text-sm">
          <li className="flex justify-between">
            <span className="text-muted">Email and password</span>
            <span className={hasPassword ? "text-signal" : "text-muted"}>
              {hasPassword ? "Enabled" : "Not set up"}
            </span>
          </li>
          <li className="flex justify-between">
            <span className="text-muted">Google</span>
            <span
              className={
                providers.includes("google") ? "text-signal" : "text-muted"
              }
            >
              {providers.includes("google") ? "Connected" : "Not connected"}
            </span>
          </li>
        </ul>
      </Card>
    </AppShell>
  );
}
