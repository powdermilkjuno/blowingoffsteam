import { redirect } from "next/navigation";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { auth } from "@/lib/auth/server";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import { listTimeZones } from "@/lib/playtime-windows";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import {
  ChangePasswordForm,
  ProfileSettingsForm,
  SetPasswordPrompt,
} from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const { hasPassword, providers } = await getLinkedAccounts();

  return (
    <AppShell active="settings" displayName={profile.displayName}>
      <div>
        <p className="text-sm text-fern">Account</p>
        <h1 className="mt-1 text-2xl tracking-tight text-paper">Settings</h1>
      </div>

      <Card className="corners space-y-3 p-6">
        <h2 className="text-sm text-paper">Profile</h2>
        <ProfileSettingsForm
          username={profile.username}
          displayName={profile.displayName}
          timeZone={profile.timeZone}
          timeZones={listTimeZones()}
        />
      </Card>

      <Card className="space-y-3 p-6">
        <h2 className="text-sm text-paper">
          {hasPassword ? "Password" : "Set a password"}
        </h2>
        {hasPassword ? (
          <ChangePasswordForm />
        ) : (
          <SetPasswordPrompt email={session.user.email ?? ""} />
        )}
      </Card>

      <Card className="space-y-3 p-6">
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
