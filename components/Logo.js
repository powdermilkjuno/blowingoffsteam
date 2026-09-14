import Link from "next/link";

export default function Logo({ size = "md" }) {
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-2xl",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2 ${sizes[size]} font-semibold tracking-tight text-paper hover:text-signal transition-colors`}
    >
      <span className="inline-block h-2.5 w-2.5 bg-signal" aria-hidden="true" />
      <span>
        uptime
        <span className="text-signal animate-blink">_</span>
      </span>
    </Link>
  );
}
