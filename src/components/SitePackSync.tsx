"use client";

import { useEffect } from "react";
import { SITE_PACK_COOKIE, sitePackAttr } from "@/lib/shop-catalog";

export default function SitePackSync({
  equippedId,
}: {
  equippedId?: string;
}) {
  useEffect(() => {
    if (!equippedId) return;
    const pack = sitePackAttr(equippedId);
    document.documentElement.setAttribute("data-site-pack", pack);
    document.cookie = `${SITE_PACK_COOKIE}=${pack}; path=/; max-age=31536000; samesite=lax`;
  }, [equippedId]);
  return null;
}
