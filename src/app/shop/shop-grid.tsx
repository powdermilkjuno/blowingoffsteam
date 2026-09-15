"use client";

import { useActionState } from "react";
import type { ShopItem } from "@/lib/shop-catalog";
import {
  GROUP_ACCENTS,
  type GroupAccent,
} from "@/lib/group-accent";
import { fontClass, frameClass } from "@/lib/shop-catalog";
import {
  buyShopItemAction,
  equipShopItemAction,
  type ShopFormState,
} from "./actions";

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
    return <p className="text-xs text-signal">Equipped</p>;
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
        className={`flex h-10 w-10 items-center justify-center rounded bg-moss/70 text-[10px] text-paper ${frameClass(item.id)}`}
      >
        Aa
      </span>
    );
  }
  if (item.kind === "font") {
    return (
      <span className={`text-sm text-paper ${fontClass(item.id)}`}>Name</span>
    );
  }
  if (item.kind === "group_accent") {
    const accent = item.id.slice("accent:".length) as GroupAccent;
    const tint = GROUP_ACCENTS[accent];
    return (
      <span className={`h-8 w-12 rounded-sm ${tint?.swatch ?? "bg-clay"}`} />
    );
  }
  const pack = item.id.slice("theme:".length);
  return (
    <span className="flex overflow-hidden rounded-sm border border-line">
      <span
        className="h-8 w-6"
        style={{
          background:
            pack === "dusk"
              ? "#12151c"
              : pack === "ember"
                ? "#1a100e"
                : pack === "terminal"
                  ? "#0c120e"
                  : "#1c170f",
        }}
      />
      <span
        className="h-8 w-6"
        style={{
          background:
            pack === "dusk"
              ? "#eef2f8"
              : pack === "ember"
                ? "#faf3ee"
                : pack === "terminal"
                  ? "#eef6ee"
                  : "#f4efe2",
        }}
      />
    </span>
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

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm text-paper">{title}</h2>
        {note ? <p className="mt-1 text-xs text-muted">{note}</p> : null}
      </div>
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((item) => {
          const has = item.price === 0 || owned.has(item.id);
          return (
            <li
              key={item.id}
              className="flex items-center gap-3 rounded-sm border border-line bg-surface p-3"
            >
              <Preview item={item} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-paper">{item.name}</p>
                <p className="text-xs text-muted">{item.blurb}</p>
                <p className="mt-0.5 text-xs text-signal">
                  {item.price === 0 ? "Free" : `${item.price} pts`}
                </p>
              </div>
              {item.kind === "group_accent" ? (
                has ? (
                  <p className="shrink-0 text-xs text-muted">Owned</p>
                ) : (
                  <BuyButton itemId={item.id} />
                )
              ) : has ? (
                <EquipButton
                  itemId={item.id}
                  equipped={equippedId === item.id}
                />
              ) : (
                <BuyButton itemId={item.id} />
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
