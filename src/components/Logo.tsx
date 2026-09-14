import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 ${sizes[size]} font-semibold tracking-tight text-paper transition-colors hover:text-signal`}
    >
      <span className="inline-block h-2.5 w-2.5 bg-signal" aria-hidden="true" />
      <span>
        uptime
        <span className="animate-blink text-signal">_</span>
      </span>
    </Link>
  );
}
