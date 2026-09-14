import Link from "next/link";

export default function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "text-xs",
    md: "text-[13px] sm:text-sm",
    lg: "text-xl",
  };

  return (
    <Link
      href="/"
      className={`inline-flex items-center gap-2.5 ${sizes[size]} font-semibold tracking-tight text-paper transition-colors hover:text-signal`}
    >
      <span
        className="relative grid h-6 w-6 shrink-0 place-items-center border border-signal/80 bg-raised"
        aria-hidden="true"
      >
        <span className="h-2 w-2 bg-clay" />
        <span className="absolute -top-1 left-1/2 h-1.5 w-px -translate-x-1/2 bg-signal/80" />
        <span className="absolute -top-0.5 left-[7px] h-1 w-px rotate-[-28deg] bg-fern/80" />
        <span className="absolute -top-0.5 right-[7px] h-1 w-px rotate-[28deg] bg-fern/80" />
      </span>
      <span className="whitespace-nowrap">
        Blowing Off Steam
        <span className="animate-blink text-signal">_</span>
      </span>
    </Link>
  );
}
