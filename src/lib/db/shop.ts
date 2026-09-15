import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./index";
import { profileInventory, profiles } from "./schema";
import { toProfile, type Profile } from "./profiles";
import {
  getShopItem,
  isOwned,
  type ShopItem,
} from "../shop-catalog";

export type ShopResult<T> = { ok: true; value: T } | { ok: false; error: string };

export async function listInventoryIds(profileId: string): Promise<Set<string>> {
  const rows = await getDb()
    .select({ itemId: profileInventory.itemId })
    .from(profileInventory)
    .where(eq(profileInventory.profileId, profileId));
  return new Set(rows.map((row) => row.itemId));
}

export async function ownsItem(
  profileId: string,
  item: ShopItem,
): Promise<boolean> {
  if (item.price === 0) return true;
  const [row] = await getDb()
    .select({ itemId: profileInventory.itemId })
    .from(profileInventory)
    .where(
      and(
        eq(profileInventory.profileId, profileId),
        eq(profileInventory.itemId, item.id),
      ),
    )
    .limit(1);
  return row !== undefined;
}

export async function buyItem(
  profileId: string,
  itemId: string,
): Promise<ShopResult<Profile>> {
  const item = getShopItem(itemId);
  if (!item) return { ok: false, error: "That item is not in the shop." };
  if (item.price === 0) {
    return { ok: false, error: "That item is already free." };
  }

  const db = getDb();
  const [profileRow] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, profileId))
    .limit(1);
  if (!profileRow) return { ok: false, error: "Profile not found." };

  const inventory = await listInventoryIds(profileId);
  if (isOwned(item, inventory)) {
    return { ok: false, error: "You already own that." };
  }
  if (profileRow.walletPoints < item.price) {
    return { ok: false, error: "Not enough points." };
  }

  await db.insert(profileInventory).values({
    profileId,
    itemId: item.id,
  });
  const [updated] = await db
    .update(profiles)
    .set({
      walletPoints: sql`${profiles.walletPoints} - ${item.price}`,
    })
    .where(eq(profiles.id, profileId))
    .returning();

  if (!updated) return { ok: false, error: "Could not complete the purchase." };
  return { ok: true, value: toProfile(updated) };
}

export async function equipItem(
  profileId: string,
  itemId: string,
): Promise<ShopResult<Profile>> {
  const item = getShopItem(itemId);
  if (!item) return { ok: false, error: "That item is not in the shop." };

  const owned = await ownsItem(profileId, item);
  if (!owned) return { ok: false, error: "Buy that before you equip it." };

  const patch =
    item.kind === "frame"
      ? { equippedFrame: item.id }
      : item.kind === "font"
        ? { equippedFont: item.id }
        : item.kind === "site_theme"
          ? { equippedSiteTheme: item.id }
          : null;

  if (!patch) {
    return {
      ok: false,
      error: "Group colors are equipped on the group page, not here.",
    };
  }

  const [updated] = await getDb()
    .update(profiles)
    .set(patch)
    .where(eq(profiles.id, profileId))
    .returning();

  if (!updated) return { ok: false, error: "Could not equip that." };
  return { ok: true, value: toProfile(updated) };
}
