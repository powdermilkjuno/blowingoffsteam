import Link from "next/link";
import { AuthShell } from "../_components/auth-shell";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: PageProps<"/auth/reset-password">) {
  const { token, error } = await searchParams;
  const resetToken = typeof token === "string" ? token : "";

  if (!resetToken || error) {
    return (
      <AuthShell
        title="Link expired"
        subtitle="Reset links are single use and last one hour."
      >
        <Link
          href="/auth/forgot-password"
          className="block rounded bg-signal px-4 py-2 text-center text-sm font-medium text-ink hover:bg-signal2"
        >
          Send a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose a password"
      subtitle="You will be able to sign in with your email and this password."
    >
      <ResetPasswordForm token={resetToken} />
    </AuthShell>
  );
}
