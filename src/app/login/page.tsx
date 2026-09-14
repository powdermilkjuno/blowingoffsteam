import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getEmailForAuthUser } from "@/lib/db/auth-users";
import { getProfileBySteamId } from "@/lib/db/profiles";
import { getSteamTicket } from "@/lib/steam-ticket";
import { auth } from "@/lib/auth/server";
import { AuthShell } from "../auth/_components/auth-shell";
import {
  AuthDivider,
  GoogleButton,
  SteamButton,
} from "../auth/_components/social-buttons";
import { SignInForm } from "../auth/sign-in/sign-in-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  steam: "Steam sign-in did not complete. Try again.",
  steam_taken: "That Steam account is already linked to another account.",
  account_not_linked: "That Google account is not linked yet. Use Steam or email.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { data: session } = await auth.getSession();
  if (session?.user) redirect("/dashboard");

  const params = await searchParams;
  const errorKey = typeof params.error === "string" ? params.error : "";
  const initialError = ERRORS[errorKey];
  const reset = params.reset === "1";

  const ticket = await getSteamTicket();
  const returning = ticket ? await getProfileBySteamId(ticket.steamId) : null;
  const returningEmail = returning
    ? await getEmailForAuthUser(returning.authUserId)
    : null;

  if (returning) {
    return (
      <AuthShell
        title={`Welcome back, ${returning.displayName}`}
        subtitle="Steam recognised you. Enter your password to finish signing in."
      >
        <div className="flex items-center gap-3 rounded border border-line bg-raised p-3">
          {ticket?.avatarUrl && (
            <Image
              src={ticket.avatarUrl}
              alt=""
              width={40}
              height={40}
              className="rounded"
            />
          )}
          <div className="min-w-0">
            <p className="truncate text-sm text-paper">@{returning.username}</p>
            <p className="truncate text-xs text-muted">
              {returningEmail ?? "Linked Steam account"}
            </p>
          </div>
        </div>

        <SignInForm
          initialError={initialError}
          defaultEmail={returningEmail ?? ""}
          lockEmail
        />

        <AuthDivider />
        <GoogleButton label="Continue with Google" />

        <p className="text-center text-sm text-muted">
          <Link
            href="/auth/forgot-password"
            className="text-fern hover:text-signal"
          >
            Forgot your password?
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Log in"
    >
      {reset && (
        <p className="rounded border border-signal/30 bg-signal/10 px-3 py-2 text-sm text-signal">
          Password set. Sign in with it below.
        </p>
      )}

      <SteamButton />
      <AuthDivider label="or email" />
      <SignInForm initialError={initialError} />
      <GoogleButton label="Continue with Google" />

      <p className="text-center text-xs text-muted">
        <Link
          href="/auth/forgot-password"
          className="text-fern hover:text-signal"
        >
          Forgot password?
        </Link>
      </p>

      <p className="text-center text-sm text-muted">
        New here?{" "}
        <Link href="/signup" className="text-signal hover:text-signal2">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}
