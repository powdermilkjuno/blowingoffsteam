import { requireCompleteProfile } from "@/lib/require-profile";
import { listInventoryIds } from "@/lib/db/shop";
import { shopItemsOf } from "@/lib/shop-catalog";
import { ShopStudio } from "./shop-studio";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const profile = await requireCompleteProfile();
  const inventory = await listInventoryIds(profile.id);
  const ownedIds = [...inventory];

  return (
    <ShopStudio
      profile={{
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        walletPoints: profile.walletPoints,
        equippedFrame: profile.equippedFrame,
        equippedFont: profile.equippedFont,
        equippedNameColor: profile.equippedNameColor,
        equippedSiteTheme: profile.equippedSiteTheme,
      }}
      ownedIds={ownedIds}
      frames={shopItemsOf("frame")}
      fonts={shopItemsOf("font")}
      nameColors={shopItemsOf("name_color")}
      accents={shopItemsOf("group_accent")}
      themes={shopItemsOf("site_theme")}
    />
  );
}
