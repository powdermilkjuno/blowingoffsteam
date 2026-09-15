"use client";

import { useMemo, useState } from "react";
import type { ShopItem } from "@/lib/shop-catalog";
import {
  getShopItem,
  isOwned,
} from "@/lib/shop-catalog";
import {
  GROUP_ACCENTS,
  isGroupAccent,
  type GroupAccent,
} from "@/lib/group-accent";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import AvatarWithBio from "@/components/AvatarWithBio";
import NameWithBio from "@/components/NameWithBio";
import HighScoreRow from "@/components/HighScoreRow";
import { ShopAisle, ShopSection } from "./shop-grid";
import { ShopTryOnContext, type ShopCart } from "./shop-try-on";

type Equipped = {
  displayName: string;
  avatarUrl: string;
  bio: string;
  walletPoints: number;
  equippedFrame: string;
  equippedFont: string;
  equippedNameColor: string;
  equippedSiteTheme: string;
};

function cartFromEquipped(profile: Equipped): ShopCart {
  return {
    frame: profile.equippedFrame,
    font: profile.equippedFont,
    nameColor: profile.equippedNameColor,
    theme: profile.equippedSiteTheme,
    accent: null,
  };
}

function slotLabel(id: string | null): string {
  if (!id) return "—";
  return getShopItem(id)?.name ?? id;
}

function missingLook(cart: ShopCart, ownedIds: string[]): ShopItem[] {
  const owned = new Set(ownedIds);
  const ids = [cart.frame, cart.font, cart.nameColor, cart.theme];
  if (cart.accent) ids.push(cart.accent);
  return ids
    .map((id) => getShopItem(id))
    .filter((item): item is ShopItem => Boolean(item) && !isOwned(item, owned));
}

function PeekSkeleton({
  profile,
  cart,
  onShowShop,
}: {
  profile: Equipped;
  cart: ShopCart;
  onShowShop: () => void;
}) {
  const accentKey = cart.accent?.slice("accent:".length) ?? "";
  const accent: GroupAccent | undefined = isGroupAccent(accentKey)
    ? accentKey
    : undefined;
  const tint = accent ? GROUP_ACCENTS[accent] : null;

  return (
    <div className="space-y-6">
      <PageIntro
        kicker="Preview"
        title="Lorem dashboard"
        aside={
          <button
            type="button"
            onClick={onShowShop}
            className="rounded-sm bg-signal px-3 py-1.5 text-xs font-medium text-ink hover:bg-signal2"
          >
            Show shop
          </button>
        }
      >
        The shop is hidden. This is filler, so you can read the chrome, the
        pack, and your name without the catalog in the way.
      </PageIntro>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="corners flex flex-col p-6" radius="lg">
          <div className="flex items-start gap-4">
            <AvatarWithBio
              name={profile.displayName}
              bio={profile.bio}
              avatarUrl={profile.avatarUrl}
              size={56}
              frame={cart.frame}
              font={cart.font}
              nameColor={cart.nameColor}
            />
            <div className="min-w-0 flex-1">
              <NameWithBio
                name={profile.displayName}
                bio={profile.bio}
                className="truncate text-sm text-paper"
                font={cart.font}
                nameColor={cart.nameColor}
              />
              <p className="mt-1 text-xs text-muted">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit.
              </p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Today", value: "1.4h" },
              { label: "Week", value: "8.2h" },
              { label: "Month", value: "31h" },
            ].map((stat) => (
              <div key={stat.label} className="rounded-sm border border-line bg-raised/60 px-3 py-2">
                <p className="text-[10px] text-muted">{stat.label}</p>
                <p className="mt-1 text-sm text-signal">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card
          tone={tint ? "plain" : "panel"}
          className={`corners flex flex-col p-5 ${tint?.card ?? ""}`}
          radius="lg"
        >
          <h2 className={`text-sm ${tint?.title ?? "text-paper"}`}>
            {tint ? `${tint.label} circle` : "Friends"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            Sed do eiusmod tempor incididunt ut labore.
          </p>
          <div className="scanlines -mx-5 -mb-5 mt-4 overflow-visible border-t border-line bg-raised pb-2 pt-3">
            <HighScoreRow
              rank={1}
              name={profile.displayName}
              hours={4.2}
              avatarUrl={profile.avatarUrl}
              isUser
              bio={profile.bio}
              frame={cart.frame}
              font={cart.font}
              nameColor={cart.nameColor}
            />
            <HighScoreRow rank={2} name="Aenean gravida" hours={3.1} />
            <HighScoreRow rank={3} name="Vestibulum nisi" hours={2.8} />
          </div>
        </Card>
      </div>

      <Card className="corners space-y-4 p-6" radius="sm">
        <h2 className="text-sm text-paper">Library</h2>
        <ul className="space-y-3">
          {[
            { name: "Lorem Ipsum: Aftermath", bar: "72%" },
            { name: "Dolor Sit Simulator", bar: "44%" },
            { name: "Consectetur Nights", bar: "18%" },
          ].map((game) => (
            <li key={game.name} className="flex items-center gap-3">
              <span className="h-10 w-10 shrink-0 rounded-sm bg-moss/50" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-paper">{game.name}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-sm bg-line/60">
                  <div
                    className="h-full bg-signal"
                    style={{ width: game.bar }}
                  />
                </div>
              </div>
              <span className="text-xs text-muted">ut labore</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

function PreviewRail({
  profile,
  cart,
  equipped,
  ownedIds,
  onPeek,
  onReset,
}: {
  profile: Equipped;
  cart: ShopCart;
  equipped: ShopCart;
  ownedIds: string[];
  onPeek: () => void;
  onReset: () => void;
}) {
  const missing = missingLook(cart, ownedIds);
  const total = missing.reduce((sum, item) => sum + item.price, 0);
  const dirty =
    cart.frame !== equipped.frame ||
    cart.font !== equipped.font ||
    cart.nameColor !== equipped.nameColor ||
    cart.theme !== equipped.theme ||
    cart.accent !== equipped.accent;

  const slots = [
    { label: "Frame", id: cart.frame },
    { label: "Font", id: cart.font },
    { label: "Name", id: cart.nameColor },
    { label: "Pack", id: cart.theme },
  ];

  return (
    <Card className="corners space-y-5 p-5" radius="sm">
      <div>
        <p className="kicker">Try on</p>
        <p className="mt-2 text-xs text-muted">
          Click a shop item to load it here. Nothing is bought until you hit
          Buy.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <AvatarWithBio
          name={profile.displayName}
          bio={profile.bio}
          avatarUrl={profile.avatarUrl}
          size={52}
          frame={cart.frame}
          font={cart.font}
          nameColor={cart.nameColor}
        />
        <div className="min-w-0">
          <NameWithBio
            name={profile.displayName}
            bio={profile.bio}
            className="block truncate text-sm text-paper"
            font={cart.font}
            nameColor={cart.nameColor}
          />
          <p className="mt-0.5 text-xs text-muted">On a board</p>
        </div>
      </div>

      <div className="scanlines -mx-5 overflow-hidden border-y border-line bg-raised py-1">
        <HighScoreRow
          rank={2}
          name={profile.displayName}
          hours={4.2}
          avatarUrl={profile.avatarUrl}
          isUser
          bio={profile.bio}
          frame={cart.frame}
          font={cart.font}
          nameColor={cart.nameColor}
        />
      </div>

      <ul className="space-y-1.5 text-xs">
        {slots.map((slot) => (
          <li key={slot.label} className="flex justify-between gap-2">
            <span className="text-muted">{slot.label}</span>
            <span className="truncate text-paper">{slotLabel(slot.id)}</span>
          </li>
        ))}
        {cart.accent ? (
          <li className="flex justify-between gap-2">
            <span className="text-muted">Group</span>
            <span className="truncate text-paper">{slotLabel(cart.accent)}</span>
          </li>
        ) : null}
      </ul>

      {missing.length > 0 ? (
        <p className="text-xs text-signal">
          To own this look {total} pts
        </p>
      ) : (
        <p className="text-xs text-muted">You already own this look.</p>
      )}

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={onPeek}
          className="rounded-sm bg-signal px-3 py-2 text-xs font-medium text-ink hover:bg-signal2"
        >
          Hide shop
        </button>
        {dirty ? (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-fern hover:text-signal"
          >
            Reset to equipped
          </button>
        ) : null}
      </div>
    </Card>
  );
}

export function ShopStudio({
  profile,
  ownedIds,
  frames,
  fonts,
  nameColors,
  accents,
  themes,
}: {
  profile: Equipped;
  ownedIds: string[];
  frames: ShopItem[];
  fonts: ShopItem[];
  nameColors: ShopItem[];
  accents: ShopItem[];
  themes: ShopItem[];
}) {
  const equipped = useMemo(() => cartFromEquipped(profile), [profile]);
  const [cart, setCart] = useState<ShopCart>(equipped);
  const [peek, setPeek] = useState(false);

  function tryItem(item: ShopItem) {
    setCart((current) => {
      if (item.kind === "frame") return { ...current, frame: item.id };
      if (item.kind === "font") return { ...current, font: item.id };
      if (item.kind === "name_color") return { ...current, nameColor: item.id };
      if (item.kind === "site_theme") return { ...current, theme: item.id };
      if (item.kind === "group_accent") return { ...current, accent: item.id };
      return current;
    });
  }

  return (
    <ShopTryOnContext.Provider value={{ cart, tryItem }}>
      <AppShell
        active="shop"
        displayName={profile.displayName}
        walletPoints={profile.walletPoints}
        sitePack={cart.theme}
        persistSitePack={false}
        wide
      >
        {peek ? (
          <PeekSkeleton
            profile={profile}
            cart={cart}
            onShowShop={() => setPeek(false)}
          />
        ) : (
          <>
            <PageIntro
              kicker="Spend"
              title="Shop"
              aside={
                <p className="rounded-sm border border-line bg-surface px-3 py-1.5 text-sm text-paper">
                  <span className="text-muted">Balance</span>{" "}
                  <span className="text-signal">{profile.walletPoints} pts</span>
                </p>
              }
            >
              Daily group awards credit this wallet. Scoreboards stay untouched.
              Click an item to try it on — Buy still spends.
            </PageIntro>

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="order-2 space-y-6 lg:order-1">
                <ShopAisle
                  kicker="On you"
                  note="Everyone sees these. Click to try on. Sorted cheap to dear."
                >
                  <ShopSection
                    title="Frames"
                    items={frames}
                    ownedIds={ownedIds}
                    equippedId={profile.equippedFrame}
                  />
                  <ShopSection
                    title="Fonts"
                    items={fonts}
                    ownedIds={ownedIds}
                    equippedId={profile.equippedFont}
                  />
                  <ShopSection
                    title="Name colors"
                    note="Solids, then washes. Same slot — washes just cost more."
                    items={nameColors}
                    ownedIds={ownedIds}
                    equippedId={profile.equippedNameColor}
                  />
                </ShopAisle>
                <ShopAisle
                  kicker="Groups"
                  note="Unlock here, then set it on a group you own or co-own."
                >
                  <ShopSection
                    title="Colors"
                    items={accents}
                    ownedIds={ownedIds}
                  />
                </ShopAisle>
                <ShopAisle
                  kicker="Just you"
                  note="A palette plus its matching parallax. Light and dark. Nobody else sees this."
                >
                  <ShopSection
                    title="Site packs"
                    items={themes}
                    ownedIds={ownedIds}
                    equippedId={profile.equippedSiteTheme}
                  />
                </ShopAisle>
              </div>

              <aside className="order-1 lg:sticky lg:top-24 lg:order-2">
                <PreviewRail
                  profile={profile}
                  cart={cart}
                  equipped={equipped}
                  ownedIds={ownedIds}
                  onPeek={() => setPeek(true)}
                  onReset={() => setCart(equipped)}
                />
              </aside>
            </div>
          </>
        )}
      </AppShell>
    </ShopTryOnContext.Provider>
  );
}
