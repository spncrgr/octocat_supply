import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Product } from '../types/product';

const CART_STORAGE_KEY = 'octocat-supply-cart';
const DISCOUNT_RATE = 0.05;
const SHIPPING_FEE = 10;

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shipping: number;
  grandTotal: number;
  addItem: (product: Product, quantity: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

function isValidProduct(product: unknown): product is Product {
  if (!isObject(product)) {
    return false;
  }

  return (
    typeof product.productId === 'number' &&
    typeof product.name === 'string' &&
    typeof product.description === 'string' &&
    typeof product.price === 'number' &&
    typeof product.imgName === 'string' &&
    typeof product.sku === 'string' &&
    typeof product.unit === 'string' &&
    typeof product.supplierId === 'number' &&
    (product.discount === undefined || typeof product.discount === 'number')
  );
}

function isValidCartItem(item: unknown): item is CartItem {
  if (!isObject(item)) {
    return false;
  }

  return isValidProduct(item.product) && typeof item.quantity === 'number' && item.quantity > 0;
}

function getUnitPrice(product: Product): number {
  if (product.discount === undefined || product.discount <= 0) {
    return product.price;
  }

  return product.price * (1 - product.discount);
}

function loadInitialCartItems(): CartItem[] {
  const storedValue = localStorage.getItem(CART_STORAGE_KEY);
  if (!storedValue) {
    return [];
  }

  try {
    const parsedValue: unknown = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      console.error('Cart storage did not contain an array.');
      return [];
    }

    return parsedValue.filter((entry) => {
      const isValid = isValidCartItem(entry);
      if (!isValid) {
        console.error('Ignoring invalid cart entry from localStorage.', entry);
      }
      return isValid;
    });
  } catch (error) {
    console.error('Failed to parse cart state from localStorage.', error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCartItems);

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: Product, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Cart quantity must be a positive integer.');
    }

    setItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.product.productId === product.productId);
      if (!existingItem) {
        return [...prevItems, { product, quantity }];
      }

      return prevItems.map((item) =>
        item.product.productId === product.productId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      );
    });
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error('Cart quantity must be at least 1.');
    }

    setItems((prevItems) =>
      prevItems.map((item) =>
        item.product.productId === productId ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prevItems) => prevItems.filter((item) => item.product.productId !== productId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(() => {
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const subtotal = items.reduce(
      (total, item) => total + getUnitPrice(item.product) * item.quantity,
      0,
    );
    const discountAmount = subtotal * DISCOUNT_RATE;
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const grandTotal = subtotal - discountAmount + shipping;

    return {
      items,
      itemCount,
      subtotal,
      discountAmount,
      shipping,
      grandTotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [addItem, clearCart, items, removeItem, updateQuantity]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside a CartProvider.');
  }

  return context;
}
