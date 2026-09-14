import Link from "next/link";
import { AuthShell } from "../_components/auth-shell";
import { ForgotPasswordForm } from "./forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="We will email you a link. This also works if you signed up with Google and never set a password."
    >
      <ForgotPasswordForm />

      <p className="text-center text-sm text-muted">
        <Link href="/login" className="text-signal hover:text-signal2">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
