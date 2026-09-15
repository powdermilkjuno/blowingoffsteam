"use client";

import { createContext, useContext } from "react";
import type { ShopItem } from "@/lib/shop-catalog";

export type ShopCart = {
  frame: string;
  font: string;
  nameColor: string;
  theme: string;
  accent: string | null;
};

export const ShopTryOnContext = createContext<{
  cart: ShopCart;
  tryItem: (item: ShopItem) => void;
} | null>(null);

export function useShopTryOn() {
  return useContext(ShopTryOnContext);
}
