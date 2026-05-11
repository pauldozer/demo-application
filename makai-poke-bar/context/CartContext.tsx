"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

const STORE = "makaipokebar.myshopify.com";

export type CartItem = {
  variantId: string;   // numeric ID only, e.g. "48174824784126"
  title: string;
  variantTitle?: string;
  price: string;
  quantity: number;
};

type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  updateQty: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  checkout: () => void;
  itemCount: number;
  total: string;
};

const CartContext = createContext<CartContextType | null>(null);

function numericId(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

function buildCheckoutUrl(items: CartItem[]): string {
  if (items.length === 0) return `https://${STORE}/cart`;
  const pairs = items.map((i) => `${numericId(i.variantId)}:${i.quantity}`).join(",");
  return `https://${STORE}/cart/${pairs}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === item.variantId);
      if (existing) {
        return prev.map((i) =>
          i.variantId === item.variantId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
    setIsOpen(true);
  }, []);

  const updateQty = useCallback((variantId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
  }, []);

  const checkout = useCallback(() => {
    window.open(buildCheckoutUrl(items), "_blank");
  }, [items]);

  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const total = items
    .reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0)
    .toFixed(2);

  return (
    <CartContext.Provider
      value={{
        items,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateQty,
        removeItem,
        checkout,
        itemCount,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
