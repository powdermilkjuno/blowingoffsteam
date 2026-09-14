import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getSteamTicket } from "@/lib/steam-ticket";
import { AuthShell } from "../auth/_components/auth-shell";
import { AuthDivider, SteamButton } from "../auth/_components/social-buttons";
import { SignUpForm } from "../auth/sign-up/sign-up-form";

export const dynamic = "force-dynamic";

export default async function SignupPage() {
  const { data: session } = await auth.getSession();
  if (session?.user) redirect("/dashboard");

  const ticket = await getSteamTicket();
  if (ticket) redirect("/onboarding");

  return (
    <AuthShell
      title="Create your account"
      subtitle="Connect Steam so we can read your library. Email is optional backup."
    >
      <SteamButton caption="Sign up through Steam. Official button, official OpenID." />
      <AuthDivider label="or email" />
      <SignUpForm />

      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-signal hover:text-signal2">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}
