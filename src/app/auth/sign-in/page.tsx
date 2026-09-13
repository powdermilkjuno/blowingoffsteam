import Image from "next/image";
import Link from "next/link";
import { getEmailForAuthUser } from "@/lib/db/auth-users";
import { getProfileBySteamId } from "@/lib/db/profiles";
import { getSteamTicket } from "@/lib/steam-ticket";
import { AuthShell } from "../_components/auth-shell";
import { GoogleButton, SteamButton } from "../_components/social-buttons";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";

const ERRORS: Record<string, string> = {
  steam: "Steam sign-in did not complete. Try again.",
};

export default async function SignInPage({
  searchParams,
}: PageProps<"/auth/sign-in">) {
  const { error, reset } = await searchParams;
  const initialError = typeof error === "string" ? ERRORS[error] : undefined;

  // Steam verified this browser and the account already exists, so greet them
  // by name and prefill the email rather than showing a bare error.
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
        <div className="flex items-center gap-3 rounded border border-[#2a3f5a] bg-[#16202d] p-3">
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
            <p className="truncate text-sm text-white">@{returning.username}</p>
            <p className="truncate text-xs text-[#8f98a0]">
              {returningEmail ?? "Linked Steam account"}
            </p>
          </div>
        </div>

        <SignInForm
          initialError={initialError}
          defaultEmail={returningEmail ?? ""}
          lockEmail
        />

        <div className="flex items-center gap-3 text-xs text-[#5a6b7c]">
          <span className="h-px flex-1 bg-[#2a3f5a]" />
          or
          <span className="h-px flex-1 bg-[#2a3f5a]" />
        </div>

        <GoogleButton label="Continue with Google" />

        <p className="text-center text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-[#66c0f4] hover:text-white"
          >
            Forgot your password?
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back.">
      {reset === "1" && (
        <p className="rounded border border-[#2a5a2a] bg-[#1b2d1b] px-3 py-2 text-sm text-[#8fdc8f]">
          Password set. Sign in with it below.
        </p>
      )}

      <SteamButton />

      <div className="flex items-center gap-3 text-xs text-[#5a6b7c]">
        <span className="h-px flex-1 bg-[#2a3f5a]" />
        or
        <span className="h-px flex-1 bg-[#2a3f5a]" />
      </div>

      <SignInForm initialError={initialError} />

      <GoogleButton label="Continue with Google" />

      <p className="text-center text-sm">
        <Link
          href="/auth/forgot-password"
          className="text-[#66c0f4] hover:text-white"
        >
          Forgot your password?
        </Link>
      </p>

      <p className="text-center text-sm text-[#8f98a0]">
        New here?{" "}
        <Link
          href="/auth/steam/login"
          className="text-[#66c0f4] hover:text-white"
        >
          Start with Steam
        </Link>
      </p>
    </AuthShell>
  );
}
