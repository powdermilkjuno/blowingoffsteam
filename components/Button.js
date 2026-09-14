import Link from "next/link";

const base =
  "inline-flex items-center justify-center gap-2 rounded px-5 py-3 text-sm font-medium tracking-tight transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed";

const variants = {
  primary: "bg-signal text-ink hover:bg-signal2",
  accent: "bg-clay text-ink hover:bg-clay2",
  outline: "border border-line text-paper hover:border-fern hover:text-signal bg-transparent",
  ghost: "text-fern hover:text-signal bg-transparent",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};

export default function Button({
  children,
  variant = "primary",
  href,
  className = "",
  type = "button",
  ...props
}) {
  const cls = `${base} ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
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
