"use client";

import Image from "next/image";
import * as Tooltip from "@radix-ui/react-tooltip";

function initials(name: string): string {
  return name
    .split(/[_\s.]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function AvatarWithBio({
  name,
  bio,
  avatarUrl,
  size = 32,
  className = "",
}: {
  name: string;
  bio?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const trimmed = bio?.trim() ?? "";
  const box = {
    width: size,
    height: size,
  } as const;

  const avatar = avatarUrl ? (
    <Image
      src={avatarUrl}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded object-cover ${className}`}
      style={box}
    />
  ) : (
    <span
      className={`flex shrink-0 items-center justify-center rounded bg-moss/70 font-mono tracking-normal text-paper ${
        size >= 48 ? "text-lg" : "text-[10px]"
      } ${className}`}
      style={box}
    >
      {initials(name)}
    </span>
  );

  if (!trimmed) {
    return <span className="inline-flex shrink-0">{avatar}</span>;
  }

  return (
    <Tooltip.Provider delayDuration={200}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <span className="inline-flex shrink-0 cursor-help">{avatar}</span>
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
