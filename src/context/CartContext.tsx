"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type {
  Product,
  ProductSize,
} from "@/data/products";

export interface CartItem {
  product: Product;
  size: ProductSize;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (
    product: Product,
    size: ProductSize,
    quantity?: number
  ) => void;
  removeFromCart: (
    productId: string,
    size: ProductSize
  ) => void;
  updateQuantity: (
    productId: string,
    size: ProductSize,
    quantity: number
  ) => void;
  clearCart: () => void;
}

const CartContext =
  createContext<CartContextValue | null>(null);

const STORAGE_KEY = "rhythm_cart_v1";

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(
        STORAGE_KEY
      );

      if (stored) {
        const parsed = JSON.parse(stored);

        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch {
      setItems([]);
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // Ignore local storage errors.
    }
  }, [items, loaded]);

  const addToCart = (
    product: Product,
    size: ProductSize,
    quantity = 1
  ) => {
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === size
      );

      if (existingIndex === -1) {
        return [
          ...current,
          {
            product,
            size,
            quantity: Math.max(1, quantity),
          },
        ];
      }

      return current.map((item, index) =>
        index === existingIndex
          ? {
              ...item,
              quantity: Math.min(
                10,
                item.quantity +
                  Math.max(1, quantity)
              ),
            }
          : item
      );
    });
  };

  const removeFromCart = (
    productId: string,
    size: ProductSize
  ) => {
    setItems((current) =>
      current.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.size === size
          )
      )
    );
  };

  const updateQuantity = (
    productId: string,
    size: ProductSize,
    quantity: number
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, size);
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.product.id === productId &&
        item.size === size
          ? {
              ...item,
              quantity: Math.min(
                10,
                Math.max(1, quantity)
              ),
            }
          : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const itemCount = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total + item.quantity,
        0
      ),
    [items]
  );

  const subtotal = useMemo(
    () =>
      items.reduce(
        (total, item) =>
          total +
          item.product.price *
            item.quantity,
        0
      ),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      subtotal,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider."
    );
  }

  return context;
}