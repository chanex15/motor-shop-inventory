'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { InventoryItem, InventoryWithRelations } from '@/types/inventory';

export function useInventory() {
  const [inventory, setInventory] = useState<InventoryWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          category:categories (*),
          supplier:suppliers (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (item: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      await fetchInventory();
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
      return { success: false, error: err.message };
    }
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<InventoryItem>) => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      await fetchInventory();
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
      return { success: false, error: err.message };
    }
  }, []);

  const deleteItem = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchInventory();
      return { success: true };
    } catch (err: any) {
      setError(err.message || 'Failed to delete item');
      return { success: false, error: err.message };
    }
  }, []);

  const getLowStockItems = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          *,
          category:categories (*),
          supplier:suppliers (*)
        `)
        .lt('stock_quantity', 'low_stock_threshold')
        .order('stock_quantity', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      setError(err.message || 'Failed to fetch low stock items');
      return [];
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  return {
    inventory,
    loading,
    error,
    fetchInventory,
    addItem,
    updateItem,
    deleteItem,
    getLowStockItems,
  };
}
