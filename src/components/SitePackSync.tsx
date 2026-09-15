"use client";

import { useEffect } from "react";
import {
  BACKDROP_COOKIE,
  SITE_PACK_COOKIE,
  sceneForTheme,
  sitePackAttr,
} from "@/lib/shop-catalog";

export default function SitePackSync({
  equippedId,
  persist = true,
}: {
  equippedId?: string;
  persist?: boolean;
}) {
  useEffect(() => {
    if (!equippedId) return;
    const pack = sitePackAttr(equippedId);
    const scene = sceneForTheme(equippedId);
    document.documentElement.setAttribute("data-site-pack", pack);
    document.documentElement.setAttribute("data-backdrop", scene);
    if (!persist) return;
    document.cookie = `${SITE_PACK_COOKIE}=${pack}; path=/; max-age=31536000; samesite=lax`;
    document.cookie = `${BACKDROP_COOKIE}=${scene}; path=/; max-age=31536000; samesite=lax`;
  }, [equippedId, persist]);
  return null;
}
