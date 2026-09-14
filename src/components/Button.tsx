import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

const base =
  "inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-sm font-medium tracking-tight transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary: "bg-signal text-ink hover:bg-signal2",
  accent: "bg-clay text-ink hover:bg-clay2",
  outline:
    "border border-line bg-transparent text-paper hover:border-fern hover:text-signal",
  ghost: "bg-transparent text-fern hover:text-signal",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: keyof typeof variants;
  href?: string;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  href,
  className = "",
  type = "button",
  ...props
}: ButtonProps) {
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
