"use client";

import Link from "next/link";
import * as Tooltip from "@radix-ui/react-tooltip";

export default function NameWithBio({
  name,
  bio,
  href,
  className = "",
}: {
  name: string;
  bio?: string | null;
  href?: string;
  className?: string;
}) {
  const trimmed = bio?.trim() ?? "";
  const label = href ? (
    <Link href={href} className={className}>
      {name}
    </Link>
  ) : (
    <span className={className}>{name}</span>
  );

  if (!trimmed) return label;

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          {href ? (
            <Link href={href} className={`cursor-help ${className}`}>
              {name}
            </Link>
          ) : (
            <span className={`cursor-help ${className}`}>{name}</span>
          )}
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            className="z-50 max-w-xs rounded-sm border-2 border-[#0b1020] bg-[#fff8a8] px-2.5 py-2 text-xs leading-relaxed text-[#0b1020] shadow-[3px_3px_0_#0b1020]"
          >
            <p className="font-pixel text-[10px] tracking-wide text-[#ff2d8a]">
              {name}
            </p>
            <p className="mt-1 text-[#0b1020]/85">{trimmed}</p>
            <Tooltip.Arrow className="fill-[#fff8a8]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
