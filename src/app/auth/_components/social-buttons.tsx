"use client";

import Image from "next/image";
import { useState } from "react";
import { authClient } from "@/lib/auth/client";

export function GoogleButton({
  label,
  callbackURL = "/dashboard",
}: {
  label: string;
  callbackURL?: string;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await authClient.signIn.social({
          provider: "google",
          callbackURL,
        });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-sm border border-line bg-surface px-4 py-2 text-sm text-paper hover:border-fern hover:bg-raised disabled:opacity-60"
    >
      <span className="grid size-4 place-items-center rounded-full bg-paper text-[11px] font-bold text-ink">
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
                  ? "pointer-events-none border-line bg-surface opacity-70"
                  : "border-signal/50 bg-surface hover:border-signal hover:bg-raised"
              }`
            : `inline-flex items-center justify-center ${
                pending ? "pointer-events-none opacity-70" : ""
              }`
        }
      >
        {pending ? (
          <span className="flex items-center gap-2 text-sm text-muted">
            <span className="size-4 animate-spin rounded-full border-2 border-signal border-t-transparent" />
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
        <p className="text-center text-xs text-muted">{caption}</p>
      )}
    </div>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-xs text-muted">
      <span className="h-px flex-1 bg-line" />
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}
