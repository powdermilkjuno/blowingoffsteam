import Link from "next/link";
import Logo from "@/components/Logo";
import Field from "@/components/Field";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
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
        <h1 className="text-xl text-paper">Log in</h1>
        <p className="mt-1.5 text-sm text-muted">
          Welcome back. Your stats picked up right where you left them.
        </p>

        <form className="mt-7 space-y-4">
          <Field
            id="username"
            label="Username"
            placeholder="yourname"
            autoComplete="username"
          />
          <Field
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
          />

          <div className="flex items-center justify-between pt-1 text-xs">
            <label className="flex items-center gap-2 text-muted">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded-sm border-line bg-surface accent-signal"
              />
              Stay signed in
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-fern hover:text-signal"
            >
              Forgot password?
            </Link>
          </div>

          <Button variant="primary" className="mt-2 w-full" href="/auth/sign-in">
            Log in
          </Button>
        </form>
      </Card>

      <p className="mt-6 text-sm text-muted">
        New to uptime?{" "}
        <Link href="/signup" className="text-signal hover:text-signal2">
          Create an account
        </Link>
      </p>
    </div>
  );
}
