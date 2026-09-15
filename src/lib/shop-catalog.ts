import {
  FREE_GROUP_ACCENTS,
  GROUP_ACCENT_IDS,
  GROUP_ACCENTS,
  type GroupAccent,
} from "./group-accent";

export const SITE_PACK_COOKIE = "bos-site-pack";
export const BACKDROP_COOKIE = "bos-backdrop";

export const SITE_PACK_IDS = [
  "default",
  "dusk",
  "ember",
  "terminal",
  "midnight",
  "sakura",
  "slate",
  "honey",
  "tide",
] as const;
export type SitePackId = (typeof SITE_PACK_IDS)[number];

export const BACKDROP_IDS = [
  "none",
  "garden",
  "galaxy",
  "harbor",
  "canopy",
  "dusk",
  "embers",
  "blossom",
  "fog",
  "meadow",
] as const;
export type BackdropId = (typeof BACKDROP_IDS)[number];

/** Each site pack carries one matching parallax scene. */
export const THEME_BACKDROP: Record<SitePackId, BackdropId> = {
  default: "none",
  dusk: "dusk",
  ember: "embers",
  terminal: "canopy",
  midnight: "galaxy",
  sakura: "blossom",
  slate: "fog",
  honey: "meadow",
  tide: "harbor",
};

export type ShopKind =
  | "frame"
  | "font"
  | "group_accent"
  | "site_theme"
  | "name_color";

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
  { id: "frame:inset", kind: "frame", name: "Clay inset", price: 15, blurb: "A clay inner rim." },
  { id: "frame:glow", kind: "frame", name: "Signal glow", price: 20, blurb: "Soft halo around the portrait." },
  { id: "frame:double", kind: "frame", name: "Double moss", price: 25, blurb: "Two-tone fern ring." },
  { id: "frame:spark", kind: "frame", name: "Spark", price: 35, blurb: "A breathing glow." },
  { id: "frame:prism", kind: "frame", name: "Prism", price: 40, blurb: "A slow conic ring." },
  { id: "frame:bloom", kind: "frame", name: "Bloom", price: 40, blurb: "A wide fern halo." },
  { id: "frame:orbit", kind: "frame", name: "Orbit", price: 45, blurb: "A dashed ring that turns." },

  { id: "font:mono", kind: "font", name: "Mono", price: 0, blurb: "The default typewriter face." },
  { id: "font:arcade", kind: "font", name: "Arcade", price: 12, blurb: "Soft CRT letters." },
  { id: "font:pixel", kind: "font", name: "Pixel", price: 15, blurb: "Chunky arcade letters on your name." },
  { id: "font:typewriter", kind: "font", name: "Ribbon", price: 20, blurb: "Inked special-elite keys." },
  { id: "font:sans", kind: "font", name: "Sans", price: 25, blurb: "Clean geometric sans." },
  { id: "font:grotesk", kind: "font", name: "Grotesk", price: 25, blurb: "Wide, modern grotesk." },
  { id: "font:serif", kind: "font", name: "Serif", price: 25, blurb: "A bookish display face." },
  { id: "font:display", kind: "font", name: "Display", price: 30, blurb: "Soft editorial serif." },
  { id: "font:sci", kind: "font", name: "Sci", price: 30, blurb: "Wide techno letters." },

  { id: "name:default", kind: "name_color", name: "Inherit", price: 0, blurb: "Uses the page text color." },
  { id: "name:clay", kind: "name_color", name: "Clay", price: 12, blurb: "Solid clay." },
  { id: "name:fern", kind: "name_color", name: "Fern", price: 12, blurb: "Solid fern." },
  { id: "name:signal", kind: "name_color", name: "Signal", price: 12, blurb: "Solid signal." },
  { id: "name:moss", kind: "name_color", name: "Moss", price: 12, blurb: "Solid moss." },
  { id: "name:ember", kind: "name_color", name: "Ember", price: 12, blurb: "Solid ember." },
  { id: "name:ice", kind: "name_color", name: "Ice", price: 12, blurb: "Solid ice." },
  { id: "name:violet", kind: "name_color", name: "Violet", price: 12, blurb: "Solid violet." },
  { id: "name:rose", kind: "name_color", name: "Rose", price: 12, blurb: "Solid rose." },
  { id: "name:gold", kind: "name_color", name: "Gold", price: 12, blurb: "Solid gold." },
  { id: "name:teal", kind: "name_color", name: "Teal", price: 12, blurb: "Solid teal." },
  { id: "name:indigo", kind: "name_color", name: "Indigo", price: 12, blurb: "Solid indigo." },
  { id: "name:blush", kind: "name_color", name: "Blush", price: 12, blurb: "Solid blush." },
  { id: "name:steel", kind: "name_color", name: "Steel", price: 12, blurb: "Solid steel." },
  { id: "name:sky", kind: "name_color", name: "Sky", price: 12, blurb: "Solid sky." },
  { id: "name:aurora", kind: "name_color", name: "Aurora", price: 35, blurb: "Teal to lilac wash." },
  { id: "name:sunset", kind: "name_color", name: "Sunset", price: 35, blurb: "Clay into rose." },
  { id: "name:ocean", kind: "name_color", name: "Ocean", price: 35, blurb: "Ice into fern." },
  { id: "name:honey", kind: "name_color", name: "Honey", price: 35, blurb: "Clay into signal." },
  { id: "name:twilight", kind: "name_color", name: "Twilight", price: 35, blurb: "Violet into ice." },
  { id: "name:magma", kind: "name_color", name: "Magma", price: 35, blurb: "Ember into clay." },
  { id: "name:mist", kind: "name_color", name: "Mist", price: 35, blurb: "Steel into ice." },
  { id: "name:bloom", kind: "name_color", name: "Bloom", price: 35, blurb: "Rose into gold." },
  { id: "name:drift", kind: "name_color", name: "Drift", price: 35, blurb: "Sky into teal." },
  { id: "name:grove", kind: "name_color", name: "Grove", price: 35, blurb: "Moss into fern." },
  { id: "name:nebula", kind: "name_color", name: "Nebula", price: 35, blurb: "Indigo into violet." },

  ...GROUP_ACCENT_IDS.map((id) => ({
    id: accentItemId(id),
    kind: "group_accent" as const,
    name: GROUP_ACCENTS[id].label,
    price: FREE_GROUP_ACCENTS.has(id) ? 0 : 25,
    blurb: FREE_GROUP_ACCENTS.has(id)
      ? "Starter group color."
      : "A louder group card wash.",
  })),

  { id: "theme:default", kind: "site_theme", name: "Default", price: 0, blurb: "Original clay and fern. No scene." },
  { id: "theme:slate", kind: "site_theme", name: "Slate", price: 50, blurb: "Cool gray chrome and a fog veil." },
  { id: "theme:dusk", kind: "site_theme", name: "Dusk", price: 55, blurb: "Blue evening chrome and a dusk sky." },
  { id: "theme:ember", kind: "site_theme", name: "Ember", price: 55, blurb: "Warm ember chrome and cinder motes." },
  { id: "theme:honey", kind: "site_theme", name: "Honey", price: 55, blurb: "Warm gold chrome and a meadow haze." },
  { id: "theme:sakura", kind: "site_theme", name: "Sakura", price: 60, blurb: "Dusty rose chrome and blossom drift." },
  { id: "theme:terminal", kind: "site_theme", name: "Terminal", price: 60, blurb: "Phosphor chrome and a canopy." },
  { id: "theme:tide", kind: "site_theme", name: "Tide", price: 65, blurb: "Teal chrome and a harbor horizon." },
  { id: "theme:midnight", kind: "site_theme", name: "Midnight", price: 70, blurb: "Indigo chrome and a galaxy drift." },
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

const DEFAULT_ITEM_IDS = new Set([
  "frame:none",
  "font:mono",
  "name:default",
  "theme:default",
]);

export function shopItemsOf(kind: ShopKind): ShopItem[] {
  return SHOP_ITEMS.filter((item) => item.kind === kind).sort((a, b) => {
    if (a.price !== b.price) return a.price - b.price;
    const aDefault = DEFAULT_ITEM_IDS.has(a.id) ? 0 : 1;
    const bDefault = DEFAULT_ITEM_IDS.has(b.id) ? 0 : 1;
    if (aDefault !== bDefault) return aDefault - bDefault;
    return a.name.localeCompare(b.name);
  });
}

export function isNameGradient(id: string): boolean {
  return (NAME_COLOR_CLASS[id] ?? "").includes("name-grad");
}

const FRAME_CLASS: Record<string, string> = {
  "frame:none": "",
  "frame:ring": "avatar-frame-ring",
  "frame:glow": "avatar-frame-glow",
  "frame:inset": "avatar-frame-inset",
  "frame:double": "avatar-frame-double",
  "frame:prism": "avatar-frame-prism",
  "frame:spark": "avatar-frame-spark",
  "frame:orbit": "avatar-frame-orbit",
  "frame:bloom": "avatar-frame-bloom",
};

const FONT_CLASS: Record<string, string> = {
  "font:mono": "font-mono",
  "font:pixel": "font-pixel normal-case tracking-wide",
  "font:arcade": "font-arcade normal-case tracking-wide",
  "font:sans": "font-sans tracking-normal",
  "font:serif": "font-serif tracking-normal",
  "font:typewriter": "font-typewriter tracking-normal",
  "font:grotesk": "font-grotesk tracking-normal",
  "font:display": "font-display tracking-normal",
  "font:sci": "font-sci tracking-wide",
};

const NAME_COLOR_CLASS: Record<string, string> = {
  "name:default": "",
  "name:clay": "text-clay",
  "name:fern": "text-fern",
  "name:signal": "text-signal",
  "name:moss": "text-moss",
  "name:ember": "text-ember",
  "name:ice": "text-ice",
  "name:violet": "text-violet",
  "name:rose": "text-rose",
  "name:gold": "text-gold",
  "name:teal": "text-teal",
  "name:indigo": "text-indigo",
  "name:blush": "text-blush",
  "name:steel": "text-steel",
  "name:sky": "text-sky",
  "name:aurora": "name-grad name-grad-aurora",
  "name:sunset": "name-grad name-grad-sunset",
  "name:ocean": "name-grad name-grad-ocean",
  "name:honey": "name-grad name-grad-honey",
  "name:twilight": "name-grad name-grad-twilight",
  "name:magma": "name-grad name-grad-magma",
  "name:mist": "name-grad name-grad-mist",
  "name:bloom": "name-grad name-grad-bloom",
  "name:drift": "name-grad name-grad-drift",
  "name:grove": "name-grad name-grad-grove",
  "name:nebula": "name-grad name-grad-nebula",
};

const THEME_SWATCH: Record<string, { dark: string; light: string }> = {
  default: { dark: "#1c170f", light: "#f4efe2" },
  dusk: { dark: "#12151c", light: "#eef2f8" },
  ember: { dark: "#1a100e", light: "#faf3ee" },
  terminal: { dark: "#0c120e", light: "#eef6ee" },
  midnight: { dark: "#0e1020", light: "#eef0f8" },
  sakura: { dark: "#1c1216", light: "#faf2f4" },
  slate: { dark: "#14161a", light: "#eef0f2" },
  honey: { dark: "#1a150c", light: "#faf6e8" },
  tide: { dark: "#0c1818", light: "#e8f4f4" },
};

export function frameClass(id: string | null | undefined): string {
  return FRAME_CLASS[id ?? ""] ?? "";
}

export function fontClass(id: string | null | undefined): string {
  return FONT_CLASS[id ?? ""] ?? "font-mono";
}

export function nameColorClass(id: string | null | undefined): string {
  return NAME_COLOR_CLASS[id ?? ""] ?? "";
}

export function themeSwatch(id: string): { dark: string; light: string } {
  const pack = id.startsWith("theme:") ? id.slice("theme:".length) : id;
  return THEME_SWATCH[pack] ?? THEME_SWATCH.default;
}

export function isSitePackId(value: string): value is SitePackId {
  return (SITE_PACK_IDS as readonly string[]).includes(value);
}

export function sitePackAttr(equippedId: string | null | undefined): SitePackId {
  if (!equippedId?.startsWith("theme:")) return "default";
  const pack = equippedId.slice("theme:".length);
  return isSitePackId(pack) ? pack : "default";
}

export function isBackdropId(value: string): value is BackdropId {
  return (BACKDROP_IDS as readonly string[]).includes(value);
}

export function sceneForTheme(equippedId: string | null | undefined): BackdropId {
  return THEME_BACKDROP[sitePackAttr(equippedId)];
}

export function backdropAttr(equippedId: string | null | undefined): BackdropId {
  if (equippedId?.startsWith("theme:")) return sceneForTheme(equippedId);
  if (!equippedId?.startsWith("backdrop:")) return "none";
  const id = equippedId.slice("backdrop:".length);
  return isBackdropId(id) ? id : "none";
}

export function backdropItemId(scene: BackdropId): string {
  return `backdrop:${scene}`;
}

export const DEFAULT_FRAME = "frame:none";
export const DEFAULT_FONT = "font:mono";
export const DEFAULT_SITE_THEME = "theme:default";
export const DEFAULT_NAME_COLOR = "name:default";
export const DEFAULT_BACKDROP = "backdrop:none";
