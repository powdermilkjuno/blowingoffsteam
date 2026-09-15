"use client";

import { useEffect, useRef } from "react";
import { sceneForTheme, type BackdropId } from "@/lib/shop-catalog";

export default function ParallaxBackdrop({
  themeId,
}: {
  themeId?: string;
}) {
  const scene = sceneForTheme(themeId);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scene === "none") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const node = root.current;
    if (!node) return;

    function set(x: number, y: number) {
      node!.style.setProperty("--parx", String(x));
      node!.style.setProperty("--pary", String(y));
    }

    function onPointer(event: PointerEvent) {
      const nx = (event.clientX / window.innerWidth) * 2 - 1;
      const ny = (event.clientY / window.innerHeight) * 2 - 1;
      set(nx, ny);
    }

    function onScroll() {
      const y = window.scrollY / Math.max(window.innerHeight, 1);
      node!.style.setProperty("--pary", String(Math.min(y, 1.4)));
    }

    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [scene]);

  if (scene === "none") return null;

  return (
    <div
      ref={root}
      className={`bos-parallax bos-parallax-${scene as Exclude<BackdropId, "none">}`}
      aria-hidden
    >
      <div className="bos-parallax-layer bos-layer-a" />
      <div className="bos-parallax-layer bos-layer-b" />
      <div className="bos-parallax-layer bos-layer-c" />
    </div>
  );
}
