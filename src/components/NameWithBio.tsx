"use client";

import Link from "next/link";
import BioHover from "@/components/BioHover";
import { fontClass } from "@/lib/shop-catalog";

export default function NameWithBio({
  name,
  bio,
  href,
  className = "",
  font,
}: {
  name: string;
  bio?: string | null;
  href?: string;
  className?: string;
  font?: string | null;
}) {
  const type = fontClass(font);
  const label = href ? (
    <Link href={href} className={`${type} ${className}`}>
      {name}
    </Link>
  ) : (
    <span className={`${type} ${className}`}>{name}</span>
  );

  return (
    <BioHover name={name} bio={bio} font={font}>
      {label}
    </BioHover>
  );
}
