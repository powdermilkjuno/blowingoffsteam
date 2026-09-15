import {
  GROUP_ACCENT_IDS,
  GROUP_ACCENTS,
  type GroupAccent,
} from "./group-accent";

export const SITE_PACK_COOKIE = "bos-site-pack";
export const SITE_PACK_IDS = ["default", "dusk", "ember", "terminal"] as const;
export type SitePackId = (typeof SITE_PACK_IDS)[number];

export type ShopKind = "frame" | "font" | "group_accent" | "site_theme";

export type ShopItem = {
  id: string;
  kind: ShopKind;
  name: string;
  price: number;
  blurb: string;
};

export const SHOP_ITEMS: ShopItem[] = [
  { id: "frame:none", kind: "frame", name: "None", price: 0, blurb: "Bare avatar." },
  { id: "frame:ring", kind: "frame", name: "Thin ring", price: 0, blurb: "A signal outline." },
  { id: "frame:glow", kind: "frame", name: "Signal glow", price: 20, blurb: "Soft halo around the portrait." },
  { id: "frame:inset", kind: "frame", name: "Clay inset", price: 15, blurb: "A clay inner rim." },
  { id: "frame:double", kind: "frame", name: "Double moss", price: 25, blurb: "Two-tone fern ring." },
  { id: "font:mono", kind: "font", name: "Mono", price: 0, blurb: "The default typewriter face." },
  { id: "font:pixel", kind: "font", name: "Pixel", price: 15, blurb: "Chunky arcade letters on your name." },
  { id: "font:sans", kind: "font", name: "Sans", price: 25, blurb: "Clean geometric sans." },
  { id: "font:serif", kind: "font", name: "Serif", price: 25, blurb: "A bookish display face." },
  ...GROUP_ACCENT_IDS.map((id) => ({
    id: accentItemId(id),
    kind: "group_accent" as const,
    name: GROUP_ACCENTS[id].label,
    price: id === "clay" || id === "fern" || id === "signal" || id === "moss" || id === "paper" ? 0 : 25,
    blurb:
      id === "clay" || id === "fern" || id === "signal" || id === "moss" || id === "paper"
        ? "Starter group color."
        : "A louder group card wash.",
  })),
  { id: "theme:default", kind: "site_theme", name: "Default", price: 0, blurb: "The original clay and fern chrome. Only you see this." },
  { id: "theme:dusk", kind: "site_theme", name: "Dusk", price: 40, blurb: "Cool blue chrome. Only you see this." },
  { id: "theme:ember", kind: "site_theme", name: "Ember", price: 40, blurb: "Warm ember chrome. Only you see this." },
  { id: "theme:terminal", kind: "site_theme", name: "Terminal", price: 40, blurb: "Green phosphor chrome. Only you see this." },
];

const BY_ID = new Map(SHOP_ITEMS.map((item) => [item.id, item]));

export function getShopItem(id: string): ShopItem | undefined {
  return BY_ID.get(id);
}

export function accentItemId(accent: GroupAccent): string {
  return `accent:${accent}`;
}

export function isOwned(item: ShopItem, inventory: ReadonlySet<string>): boolean {
  return item.price === 0 || inventory.has(item.id);
}

export function ownedGroupAccents(inventory: ReadonlySet<string>): GroupAccent[] {
  return GROUP_ACCENT_IDS.filter((id) => {
    const item = getShopItem(accentItemId(id));
    return item ? isOwned(item, inventory) : false;
  });
}

const FRAME_CLASS: Record<string, string> = {
  "frame:none": "",
  "frame:ring": "avatar-frame-ring",
  "frame:glow": "avatar-frame-glow",
  "frame:inset": "avatar-frame-inset",
  "frame:double": "avatar-frame-double",
};

const FONT_CLASS: Record<string, string> = {
  "font:mono": "font-mono",
  "font:pixel": "font-pixel normal-case tracking-wide",
  "font:sans": "font-sans tracking-normal",
  "font:serif": "font-serif tracking-normal",
};

export function frameClass(id: string | null | undefined): string {
  return FRAME_CLASS[id ?? ""] ?? "";
}

export function fontClass(id: string | null | undefined): string {
  return FONT_CLASS[id ?? ""] ?? "font-mono";
}

export function isSitePackId(value: string): value is SitePackId {
  return (SITE_PACK_IDS as readonly string[]).includes(value);
}

export function sitePackAttr(equippedId: string | null | undefined): SitePackId {
  if (!equippedId?.startsWith("theme:")) return "default";
  const pack = equippedId.slice("theme:".length);
  return isSitePackId(pack) ? pack : "default";
}

export const DEFAULT_FRAME = "frame:none";
export const DEFAULT_FONT = "font:mono";
export const DEFAULT_SITE_THEME = "theme:default";
