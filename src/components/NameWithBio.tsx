"use client";

import Link from "next/link";
import BioHover from "@/components/BioHover";

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
  const label = href ? (
    <Link href={href} className={className}>
      {name}
    </Link>
  ) : (
    <span className={className}>{name}</span>
  );

  return (
    <BioHover name={name} bio={bio}>
      {label}
    </BioHover>
  );
}
