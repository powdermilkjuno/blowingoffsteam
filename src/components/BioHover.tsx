"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { fontClass, nameColorClass } from "@/lib/shop-catalog";

function canHoverFine() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

export default function BioHover({
  name,
  bio,
  font,
  nameColor,
  href,
  children,
}: {
  name: string;
  bio?: string | null;
  font?: string | null;
  nameColor?: string | null;
  href?: string;
  children: ReactNode;
}) {
  const trimmed = bio?.trim() ?? "";
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, flipUp: false });
  const rootRef = useRef<HTMLSpanElement>(null);
  const id = useId();
  const type = fontClass(font);
  const tint = nameColorClass(nameColor);

  const place = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 12;
    const left = Math.min(
      Math.max(rect.left + rect.width / 2, pad),
      window.innerWidth - pad,
    );
    const below = rect.bottom + 8;
    const flipUp = below > window.innerHeight - 120;
    const top = flipUp ? Math.max(12, rect.top - 8) : below;
    setCoords({ top, left, flipUp });
  }, []);

  useEffect(() => {
    if (!open) return;
    place();
    function onScroll() {
      place();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (document.getElementById(id)?.contains(target)) return;
      setOpen(false);
    }
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, id, place]);

  if (!trimmed) {
    if (href) {
      return (
        <Link href={href} className="inline-flex min-w-0 max-w-full">
          {children}
        </Link>
      );
    }
    return children;
  }

  function onTriggerClick(event: MouseEvent) {
    if (canHoverFine()) {
      if (href) return;
      event.preventDefault();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    place();
    setOpen((value) => !value);
  }

  const triggerClass =
    "inline-flex min-w-0 max-w-full cursor-help touch-manipulation appearance-none border-0 bg-transparent p-0 text-start";

  const trigger = href ? (
    <Link href={href} className={triggerClass} onClick={onTriggerClick}>
      {children}
    </Link>
  ) : (
    <button
      type="button"
      className={triggerClass}
      aria-expanded={open}
      aria-label={`${name}'s bio`}
      onClick={onTriggerClick}
    >
      {children}
    </button>
  );

  return (
    <span
      ref={rootRef}
      className="relative inline-flex min-w-0 max-w-full"
      onMouseEnter={() => {
        if (!canHoverFine()) return;
        setOpen(true);
        place();
      }}
      onMouseLeave={() => {
        if (!canHoverFine()) return;
        setOpen(false);
      }}
    >
      {trigger}
      {open
        ? createPortal(
            <span
              id={id}
              role="tooltip"
              className={`z-50 max-w-xs rounded-sm border-2 border-[#0b1020] bg-[#fff8a8] px-2.5 py-2 text-xs leading-relaxed text-[#0b1020] shadow-[3px_3px_0_#0b1020] ${type}`}
              style={{
                position: "fixed",
                top: coords.top,
                left: coords.left,
                transform: coords.flipUp
                  ? "translate(-50%, -100%)"
                  : "translateX(-50%)",
              }}
            >
              <p className={tint || "text-[#ff2d8a]"}>{name}</p>
              <p className="mt-1 text-[#0b1020]/85">{trimmed}</p>
              {href ? (
                <Link
                  href={href}
                  className="mt-2 inline-block text-[#1a3aff] underline"
                >
                  View profile
                </Link>
              ) : null}
            </span>,
            document.body,
          )
        : null}
    </span>
  );
}
