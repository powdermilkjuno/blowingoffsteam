"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/server";
import { getProfileByAuthUserId, isProfileComplete } from "@/lib/db/profiles";
import { buyItem, equipItem } from "@/lib/db/shop";
import {
  BACKDROP_COOKIE,
  SITE_PACK_COOKIE,
  getShopItem,
  sceneForTheme,
  sitePackAttr,
} from "@/lib/shop-catalog";

export type ShopFormState = { error?: string; success?: string };

async function requireProfile() {
  const { data: session } = await auth.getSession();
  if (!session?.user) redirect("/login");
  const profile = await getProfileByAuthUserId(session.user.id);
  if (!profile || !isProfileComplete(profile)) redirect("/onboarding");
  return profile;
}

function revalidateShop() {
  revalidatePath("/shop");
  revalidatePath("/dashboard");
  revalidatePath("/groups");
  revalidatePath("/leaderboard");
  revalidatePath("/friends");
  revalidatePath("/settings");
}

export async function buyShopItemAction(
  _prev: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const itemId = String(formData.get("itemId") ?? "");
  const profile = await requireProfile();
  const result = await buyItem(profile.id, itemId);
  if (!result.ok) return { error: result.error };
  revalidateShop();
  return { success: "Purchased." };
}

export async function equipShopItemAction(
  _prev: ShopFormState,
  formData: FormData,
): Promise<ShopFormState> {
  const itemId = String(formData.get("itemId") ?? "");
  const profile = await requireProfile();
  const result = await equipItem(profile.id, itemId);
  if (!result.ok) return { error: result.error };

  const item = getShopItem(itemId);
  if (item?.kind === "site_theme") {
    const store = await cookies();
    store.set(SITE_PACK_COOKIE, sitePackAttr(item.id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
    store.set(BACKDROP_COOKIE, sceneForTheme(item.id), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidateShop();
  return { success: "Equipped." };
}
