"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import {
  Cart,
  createCart,
  getCart,
  addCartLines,
  updateCartLines,
  removeCartLines,
} from "@/lib/shopify";

const CART_KEY = "makai_cart_id";

type CartContextType = {
  cart: Cart | null;
  isOpen: boolean;
  isLoading: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  itemCount: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const id = localStorage.getItem(CART_KEY);
    if (!id) return;
    getCart(id)
      .then(setCart)
      .catch(() => localStorage.removeItem(CART_KEY));
  }, []);

  const getOrCreate = useCallback(async (): Promise<Cart> => {
    if (cart) return cart;
    const id = localStorage.getItem(CART_KEY);
    if (id) {
      try {
        const existing = await getCart(id);
        setCart(existing);
        return existing;
      } catch {
        localStorage.removeItem(CART_KEY);
      }
    }
    const fresh = await createCart();
    localStorage.setItem(CART_KEY, fresh.id);
    setCart(fresh);
    return fresh;
  }, [cart]);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        const c = await getOrCreate();
        const updated = await addCartLines(c.id, [{ merchandiseId: variantId, quantity }]);
        setCart(updated);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [getOrCreate]
  );

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return;
      setIsLoading(true);
      try {
        const updated = await updateCartLines(cart.id, [{ id: lineId, quantity }]);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return;
      setIsLoading(true);
      try {
        const updated = await removeCartLines(cart.id, [lineId]);
        setCart(updated);
      } finally {
        setIsLoading(false);
      }
    },
    [cart]
  );

  const itemCount = cart?.lines.reduce((s, l) => s + l.quantity, 0) ?? 0;

  return (
    <CartContext.Provider
      value={{
        cart,
        isOpen,
        isLoading,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateItem,
        removeItem,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
