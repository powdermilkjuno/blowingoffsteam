"use client";

import type { ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { fontClass, nameColorClass } from "@/lib/shop-catalog";

export default function BioHover({
  name,
  bio,
  font,
  nameColor,
  children,
}: {
  name: string;
  bio?: string | null;
  font?: string | null;
  nameColor?: string | null;
  children: ReactNode;
}) {
  const trimmed = bio?.trim() ?? "";
  if (!trimmed) return children;
  const type = fontClass(font);
  const tint = nameColorClass(nameColor);

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex min-w-0 max-w-full cursor-help">
            {children}
          </span>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            sideOffset={8}
            className={`z-50 max-w-xs rounded-sm border-2 border-[#0b1020] bg-[#fff8a8] px-2.5 py-2 text-xs leading-relaxed text-[#0b1020] shadow-[3px_3px_0_#0b1020] ${type}`}
          >
            <p className={tint || "text-[#ff2d8a]"}>{name}</p>
            <p className="mt-1 text-[#0b1020]/85">{trimmed}</p>
            <Tooltip.Arrow className="fill-[#fff8a8]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
