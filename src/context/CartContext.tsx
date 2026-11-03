"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
};

type CartItem = CartProduct & { quantity: number };

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addToCart: (product: CartProduct, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  removeFromCart: (id: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "chitranya-shopping-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setItems(parsed);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (ready) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  function addToCart(product: CartProduct, quantity = 1) {
    setItems((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...current, { ...product, quantity }];
    });
  }

  function updateQuantity(id: number, quantity: number) {
    if (quantity < 1) return;
    setItems((current) =>
      current.map((item) => item.id === id ? { ...item, quantity } : item)
    );
  }

  function removeFromCart(id: number) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addToCart, updateQuantity, removeFromCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
