import type { ReactNode } from "react";

export default function PageIntro({
  kicker,
  title,
  children,
}: {
  kicker: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="kicker">{kicker}</p>
      <h1 className="mt-2 truncate text-2xl tracking-tight text-paper">{title}</h1>
      {children ? (
        <div className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
          {children}
        </div>
      ) : null}
    </div>
  );
}
