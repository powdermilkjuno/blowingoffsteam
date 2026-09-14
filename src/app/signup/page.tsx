import Link from "next/link";
import Logo from "@/components/Logo";
import Field from "@/components/Field";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ThemeToggle from "@/components/ThemeToggle";

export default function SignupPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="grid-fade pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px]" />

      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>

      <div className="mb-8">
        <Logo size="lg" />
      </div>

      <Card className="w-full max-w-sm animate-rise p-7">
        <h1 className="text-xl text-paper">Create your account</h1>
        <p className="mt-1.5 text-sm text-muted">
          Takes about a minute. You&apos;ll connect Steam right after.
        </p>

        <form className="mt-7 space-y-4">
          <Field
            id="username"
            label="Username"
            placeholder="yourname"
            autoComplete="username"
          />
          <Field
            id="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />

          <Button variant="primary" className="mt-2 w-full" href="/auth/sign-up">
            Create account
          </Button>
        </form>

        <p className="mt-5 text-xs leading-relaxed text-muted">
          By continuing you agree to the terms of service and acknowledge the
          privacy policy.
        </p>
      </Card>

      <p className="mt-6 text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-signal hover:text-signal2">
          Log in
        </Link>
      </p>
    </div>
  );
}
