"use client";

import BioHover from "@/components/BioHover";
import { fontClass, nameColorClass } from "@/lib/shop-catalog";

export default function NameWithBio({
  name,
  bio,
  href,
  className = "",
  font,
  nameColor,
}: {
  name: string;
  bio?: string | null;
  href?: string;
  className?: string;
  font?: string | null;
  nameColor?: string | null;
}) {
  const type = fontClass(font);
  const tint = nameColorClass(nameColor);

  return (
    <BioHover name={name} bio={bio} font={font} nameColor={nameColor} href={href}>
      <span className={`${type} ${tint} ${className}`}>{name}</span>
    </BioHover>
  );
}
