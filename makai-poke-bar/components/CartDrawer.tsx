"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartDrawer() {
  const { items, isOpen, total, closeCart, updateQty, removeItem, checkout } = useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={closeCart}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-black/8">
              <h2 className="font-heading font-bold text-lg text-text flex items-center gap-2">
                <ShoppingBag size={20} className="text-accent" />
                Your Order
              </h2>
              <button
                onClick={closeCart}
                className="text-text/40 hover:text-text transition-colors p-1"
                aria-label="Close cart"
              >
                <X size={22} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
                  <ShoppingBag size={44} className="text-text/15" />
                  <p className="font-body text-text/40 text-sm">Your order is empty</p>
                  <button
                    onClick={closeCart}
                    className="font-body text-sm font-semibold text-accent hover:text-accent-dark transition-colors"
                  >
                    Browse the menu →
                  </button>
                </div>
              ) : (
                <ul className="space-y-1">
                  {items.map((item) => (
                    <li
                      key={item.variantId}
                      className="flex items-start gap-3 py-3.5 border-b border-black/5 last:border-0"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-body font-semibold text-sm text-text leading-snug">
                          {item.title}
                        </p>
                        {item.variantTitle && item.variantTitle !== "Default Title" && (
                          <p className="font-body text-xs text-text/45 mt-0.5">
                            {item.variantTitle}
                          </p>
                        )}
                        <p className="font-body text-sm font-bold text-accent mt-1">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? removeItem(item.variantId)
                              : updateQty(item.variantId, item.quantity - 1)
                          }
                          className="w-7 h-7 rounded-full bg-light flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-body text-sm font-semibold w-5 text-center tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 rounded-full bg-light flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-5 border-t border-black/8 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm text-text/55">Subtotal</span>
                  <span className="font-body font-black text-xl text-text">${total}</span>
                </div>
                <button
                  onClick={checkout}
                  className="flex items-center justify-center w-full bg-accent text-white py-3.5 rounded-full font-body font-semibold text-base hover:bg-accent-dark active:scale-95 transition-all duration-200"
                >
                  Checkout via Shopify →
                </button>
                <p className="font-body text-[11px] text-text/35 text-center">
                  Secure checkout powered by Shopify
                </p>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
