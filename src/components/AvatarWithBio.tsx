"use client";

import Image from "next/image";
import BioHover from "@/components/BioHover";

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

  return (
    <BioHover name={name} bio={bio}>
      <span className="inline-flex shrink-0">{avatar}</span>
    </BioHover>
  );
}
