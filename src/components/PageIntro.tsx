import type { ReactNode } from "react";

export default function PageIntro({
  kicker,
  title,
  aside,
  children,
}: {
  kicker?: string;
  title: ReactNode;
  aside?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      {kicker ? <p className="kicker">{kicker}</p> : null}
      <div className="mt-2 flex min-w-0 flex-wrap items-center gap-3">
        <h1 className="min-w-0 truncate text-2xl tracking-tight text-paper">
          {title}
        </h1>
        {aside ? <div className="shrink-0">{aside}</div> : null}
      </div>
      {children ? (
        <div className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {children}
        </div>
      ) : null}
    </div>
  );
}
