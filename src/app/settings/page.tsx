import { redirect } from "next/navigation";
import { getLinkedAccounts } from "@/lib/auth/accounts";
import { auth } from "@/lib/auth/server";
import { getProfileByAuthUserId } from "@/lib/db/profiles";
import { AppNav } from "../_components/app-nav";
import {
  ChangePasswordForm,
  ProfileSettingsForm,
  SetPasswordPrompt,
} from "./settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/auth/sign-in");

  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile) redirect("/onboarding");

  const { hasPassword, providers } = await getLinkedAccounts();

  return (
    <div className="flex flex-1 flex-col bg-[#1b2838] font-sans text-[#c7d5e0]">
      <AppNav displayName={profile.displayName} />

      <main className="mx-auto w-full max-w-xl space-y-6 px-6 py-8">
        <h1 className="text-xl font-semibold text-white">Account settings</h1>

        <Card title="Profile">
          <ProfileSettingsForm
            username={profile.username}
            displayName={profile.displayName}
          />
        </Card>

        <Card title={hasPassword ? "Password" : "Set a password"}>
          {hasPassword ? (
            <ChangePasswordForm />
          ) : (
            <SetPasswordPrompt email={session.user.email ?? ""} />
          )}
        </Card>

        <Card title="Sign-in methods">
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between">
              <span>Email and password</span>
              <span className={hasPassword ? "text-[#8fdc8f]" : "text-[#5a6b7c]"}>
                {hasPassword ? "Enabled" : "Not set up"}
              </span>
            </li>
            <li className="flex justify-between">
              <span>Google</span>
              <span
                className={
                  providers.includes("google")
                    ? "text-[#8fdc8f]"
                    : "text-[#5a6b7c]"
                }
              >
                {providers.includes("google") ? "Connected" : "Not connected"}
              </span>
            </li>
          </ul>
        </Card>
      </main>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded border border-[#2a3f5a] bg-[#16202d] p-5">
      <h2 className="text-sm font-medium uppercase tracking-wide text-[#8f98a0]">
        {title}
      </h2>
      {children}
    </section>
  );
}
