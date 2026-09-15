import { requireCompleteProfile } from "@/lib/require-profile";
import { listInventoryIds } from "@/lib/db/shop";
import { SHOP_ITEMS } from "@/lib/shop-catalog";
import AppShell from "@/components/AppShell";
import Card from "@/components/Card";
import PageIntro from "@/components/PageIntro";
import { ShopSection } from "./shop-grid";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const profile = await requireCompleteProfile();
  const inventory = await listInventoryIds(profile.id);
  const ownedIds = [...inventory];

  const frames = SHOP_ITEMS.filter((item) => item.kind === "frame");
  const fonts = SHOP_ITEMS.filter((item) => item.kind === "font");
  const accents = SHOP_ITEMS.filter((item) => item.kind === "group_accent");
  const themes = SHOP_ITEMS.filter((item) => item.kind === "site_theme");

  return (
    <AppShell
      active="shop"
      displayName={profile.displayName}
      walletPoints={profile.walletPoints}
      sitePack={profile.equippedSiteTheme}
    >
      <PageIntro kicker="Spend" title="Shop">
        Daily group awards also credit this wallet. Group scoreboards stay
        untouched. Frames and fonts are public; site colors are only for you.
      </PageIntro>

      <Card className="corners p-5" radius="sm">
        <p className="text-sm text-paper">
          Balance{" "}
          <span className="text-signal">{profile.walletPoints} pts</span>
        </p>
      </Card>

      <ShopSection
        title="Frames"
        items={frames}
        ownedIds={ownedIds}
        equippedId={profile.equippedFrame}
      />
      <ShopSection
        title="Fonts"
        note="Shows on your name everywhere."
        items={fonts}
        ownedIds={ownedIds}
        equippedId={profile.equippedFont}
      />
      <ShopSection
        title="Group colors"
        note="Unlock here, then set them on a group you own or co-own."
        items={accents}
        ownedIds={ownedIds}
      />
      <ShopSection
        title="Site colors"
        note="Changes your chrome in light and dark. Nobody else sees this pack."
        items={themes}
        ownedIds={ownedIds}
        equippedId={profile.equippedSiteTheme}
      />
    </AppShell>
  );
}
