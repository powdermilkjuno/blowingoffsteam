"use client";

import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function GoogleButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({
          provider: "google",
          callbackURL: "/dashboard",
        });
      }}
      className="flex w-full items-center justify-center gap-2 rounded border border-[#2a3f5a] bg-[#16202d] px-4 py-2 text-sm text-white hover:border-[#66c0f4] disabled:opacity-60"
    >
      <span className="grid size-4 place-items-center rounded-full bg-white text-[11px] font-bold text-[#1b2838]">
        G
      </span>
      {pending ? "Redirecting…" : label}
    </button>
  );
}

export function SteamButton({
  caption,
  boxed = true,
}: {
  caption?: string;
  boxed?: boolean;
}) {
  const [pending, setPending] = useState(false);

  return (
    <div className="space-y-2">
      <a
        href="/auth/steam/login"
        aria-disabled={pending}
        onClick={(event) => {
          if (pending) {
            event.preventDefault();
            return;
          }
          setPending(true);
        }}
        className={
          boxed
            ? `flex w-full items-center justify-center rounded border py-3 transition ${
                pending
                  ? "pointer-events-none border-[#2a3f5a] bg-[#16202d] opacity-70"
                  : "border-[#66c0f4] bg-[#16202d] hover:bg-[#1f2d3d]"
              }`
            : `inline-flex items-center justify-center ${
                pending ? "pointer-events-none opacity-70" : ""
              }`
        }
      >
        {pending ? (
          <span className="flex items-center gap-2 text-sm text-[#c7d5e0]">
            <span className="size-4 animate-spin rounded-full border-2 border-[#66c0f4] border-t-transparent" />
            Connecting to Steam…
          </span>
        ) : (
          <Image
            src="/sits_02.png"
            alt="Sign in through Steam"
            width={109}
            height={66}
            priority
          />
        )}
      </a>

      {caption && !pending && (
        <p className="text-center text-xs text-[#5a6b7c]">{caption}</p>
      )}
    </div>
  );
}
