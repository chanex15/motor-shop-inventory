'use client';

import { useState, useCallback } from 'react';
import { CartItem } from '@/types/sale';

export function usePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const addToCart = useCallback((item: Omit<CartItem, 'quantity' | 'total_price'>) => {
    setCart(prev => {
      const existingItem = prev.find(cartItem => cartItem.inventory_id === item.inventory_id);
      
      if (existingItem) {
        // Check if adding more would exceed stock
        if (existingItem.quantity >= item.stock_quantity) {
          return prev;
        }
        return prev.map(cartItem =>
          cartItem.inventory_id === item.inventory_id
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
                total_price: (cartItem.quantity + 1) * cartItem.unit_price,
              }
            : cartItem
        );
      }

      return [...prev, { ...item, quantity: 1, total_price: item.unit_price }];
    });
  }, []);

  const updateQuantity = useCallback((inventoryId: string, quantity: number) => {
    setCart(prev => {
      if (quantity <= 0) {
        return prev.filter(item => item.inventory_id !== inventoryId);
      }

      return prev.map(item => {
        if (item.inventory_id === inventoryId) {
          const newQuantity = Math.min(quantity, item.stock_quantity);
          return {
            ...item,
            quantity: newQuantity,
            total_price: newQuantity * item.unit_price,
          };
        }
        return item;
      });
    });
  }, []);

  const removeFromCart = useCallback((inventoryId: string) => {
    setCart(prev => prev.filter(item => item.inventory_id !== inventoryId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    cartCount,
  };
}
