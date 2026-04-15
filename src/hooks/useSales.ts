'use client';

import { useState, useCallback } from 'react';
import { CartItem, SaleWithItems } from '@/types/sale';
import { createClient } from '@/lib/supabase/client';

export function useSales() {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const processSale = useCallback(async (
    cart: CartItem[],
    amountPaid: number,
    paymentMethod: 'cash' | 'card' | 'other',
    customerName: string | null,
    tax: number = 0,
    discount: number = 0
  ) => {
    setProcessing(true);
    setError(null);

    try {
      const subtotal = cart.reduce((sum, item) => sum + item.total_price, 0);
      const total = subtotal + tax - discount;
      const change = amountPaid - total;

      if (change < 0 && paymentMethod === 'cash') {
        throw new Error('Insufficient payment amount');
      }

      // Get current user (cashier)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          cashier_id: user.id,
          customer_name: customerName,
          subtotal,
          tax,
          discount,
          total,
          amount_paid: amountPaid,
          change,
          payment_method: paymentMethod,
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        inventory_id: item.inventory_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update inventory stock (RLS now allows authenticated users to update)
      for (const item of cart) {
        const { data: currentStock, error: fetchError } = await supabase
          .from('inventory')
          .select('stock_quantity')
          .eq('id', item.inventory_id)
          .single();

        if (fetchError) throw new Error(`Failed to fetch stock for ${item.name}: ${fetchError.message}`);
        
        if (currentStock.stock_quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${item.name}. Available: ${currentStock.stock_quantity}, Requested: ${item.quantity}`);
        }

        const { error: updateError } = await supabase
          .from('inventory')
          .update({ stock_quantity: currentStock.stock_quantity - item.quantity })
          .eq('id', item.inventory_id);

        if (updateError) {
          throw new Error(`Failed to update inventory for ${item.name}: ${updateError.message}`);
        }
      }

      return {
        success: true,
        sale: { ...sale, items: saleItems, change },
      };
    } catch (err: any) {
      setError(err.message || 'Failed to process sale');
      return { success: false, error: err.message };
    } finally {
      setProcessing(false);
    }
  }, []);

  const getSalesHistory = useCallback(async (
    limit: number = 50,
    offset: number = 0
  ) => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          *,
          profiles!sales_cashier_id_fkey (full_name),
          sale_items (*)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return { success: true, data };
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales');
      return { success: false, error: err.message };
    }
  }, []);

  return {
    processSale,
    getSalesHistory,
    processing,
    error,
  };
}
