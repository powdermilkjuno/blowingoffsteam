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

      <p className="text-center text-sm text-[#8f98a0]">
        <Link href="/auth/sign-in" className="text-[#66c0f4] hover:text-white">
          Back to sign in
        </Link>
      </p>
    </AuthShell>
  );
}
