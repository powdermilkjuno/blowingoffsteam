"use client";

import { useActionState, type ReactNode } from "react";
import type { ShopItem } from "@/lib/shop-catalog";
import {
  GROUP_ACCENTS,
  type GroupAccent,
} from "@/lib/group-accent";
import {
  fontClass,
  frameClass,
  isNameGradient,
  nameColorClass,
  sceneForTheme,
  themeSwatch,
} from "@/lib/shop-catalog";
import {
  buyShopItemAction,
  equipShopItemAction,
  type ShopFormState,
} from "./actions";
import Card from "@/components/Card";
import { useShopTryOn } from "./shop-try-on";

function Feedback({ state }: { state: ShopFormState }) {
  if (state.error) {
    return <p className="text-xs text-danger">{state.error}</p>;
  }
  if (state.success) {
    return <p className="text-xs text-signal">{state.success}</p>;
  }
  return null;
}

function BuyButton({ itemId }: { itemId: string }) {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    buyShopItemAction,
    {},
  );
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-sm bg-signal px-3 py-1 text-xs font-medium text-ink hover:bg-signal2 disabled:opacity-60"
      >
        {pending ? "Buying…" : "Buy"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function EquipButton({ itemId, equipped }: { itemId: string; equipped: boolean }) {
  const [state, action, pending] = useActionState<ShopFormState, FormData>(
    equipShopItemAction,
    {},
  );
  if (equipped) {
    return <p className="text-xs text-signal">On</p>;
  }
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="itemId" value={itemId} />
      <button
        type="submit"
        disabled={pending}
        className="text-xs text-fern hover:text-signal disabled:opacity-60"
      >
        {pending ? "Equipping…" : "Equip"}
      </button>
      <Feedback state={state} />
    </form>
  );
}

function Preview({ item }: { item: ShopItem }) {
  if (item.kind === "frame") {
    return (
      <span
        className={`flex h-12 w-12 items-center justify-center rounded bg-moss/70 text-[10px] text-paper ${frameClass(item.id)}`}
      >
        Aa
      </span>
    );
  }
  if (item.kind === "font") {
    return (
      <span className={`flex h-12 w-12 items-center justify-center text-sm text-paper ${fontClass(item.id)}`}>
        Aa
      </span>
    );
  }
  if (item.kind === "name_color") {
    return (
      <span
        className={`flex h-12 w-12 items-center justify-center text-sm font-medium ${nameColorClass(item.id) || "text-paper"}`}
      >
        Aa
      </span>
    );
  }
  if (item.kind === "group_accent") {
    const accent = item.id.slice("accent:".length) as GroupAccent;
    const tint = GROUP_ACCENTS[accent];
    return (
      <span className={`h-12 w-12 rounded-sm ${tint?.swatch ?? "bg-clay"}`} />
    );
  }
  const swatch = themeSwatch(item.id);
  const scene = sceneForTheme(item.id);
  return (
    <span className="relative flex h-12 w-12 overflow-hidden rounded-sm border border-line">
      <span className="h-full w-1/2" style={{ background: swatch.dark }} />
      <span className="h-full w-1/2" style={{ background: swatch.light }} />
      {scene !== "none" ? (
        <span
          className={`pointer-events-none absolute inset-0 bos-parallax-${scene}`}
          style={{ opacity: 0.75 }}
        >
          <span className="bos-layer-a absolute inset-0" />
          <span className="bos-layer-b absolute inset-0" />
        </span>
      ) : null}
    </span>
  );
}

function itemBlurb(item: ShopItem): string | null {
  if (item.kind === "group_accent") return null;
  if (item.kind === "name_color" && item.id !== "name:default" && !isNameGradient(item.id)) {
    return null;
  }
  return item.blurb;
}

export function ShopAisle({
  kicker,
  note,
  children,
}: {
  kicker: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <Card className="corners space-y-8 p-6" radius="sm">
      <div>
        <p className="kicker">{kicker}</p>
        {note ? <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{note}</p> : null}
      </div>
      {children}
    </Card>
  );
}

export function ShopSection({
  title,
  note,
  items,
  ownedIds,
  equippedId,
}: {
  title: string;
  note?: string;
  items: ShopItem[];
  ownedIds: string[];
  equippedId?: string;
}) {
  const owned = new Set(ownedIds);
  const tryOn = useShopTryOn();

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm text-paper">{title}</h2>
        {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
      </div>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const has = item.price === 0 || owned.has(item.id);
          const on = equippedId === item.id;
          const trying =
            tryOn != null &&
            (item.kind === "frame"
              ? tryOn.cart.frame === item.id
              : item.kind === "font"
                ? tryOn.cart.font === item.id
                : item.kind === "name_color"
                  ? tryOn.cart.nameColor === item.id
                  : item.kind === "site_theme"
                    ? tryOn.cart.theme === item.id
                    : tryOn.cart.accent === item.id);
          const blurb = itemBlurb(item);
          return (
            <li
              key={item.id}
              className={`flex items-center gap-3 rounded-sm border p-3 ${
                on
                  ? "border-signal bg-signal/5"
                  : trying
                    ? "border-clay bg-clay/10"
                    : "border-line bg-raised/50"
              }`}
            >
              <button
                type="button"
                onClick={() => tryOn?.tryItem(item)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Preview item={item} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm text-paper">{item.name}</p>
                    <p className="shrink-0 text-xs text-signal">
                      {item.price === 0 ? "Free" : `${item.price} pts`}
                    </p>
                  </div>
                  {blurb ? <p className="mt-0.5 text-xs text-muted">{blurb}</p> : null}
                  {trying && !on ? (
                    <p className="mt-0.5 text-[10px] text-clay">Trying on</p>
                  ) : null}
                </div>
              </button>
              <div className="shrink-0">
                {item.kind === "group_accent" ? (
                  has ? (
                    <p className="text-xs text-muted">Owned</p>
                  ) : (
                    <BuyButton itemId={item.id} />
                  )
                ) : has ? (
                  <EquipButton itemId={item.id} equipped={on} />
                ) : (
                  <BuyButton itemId={item.id} />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
