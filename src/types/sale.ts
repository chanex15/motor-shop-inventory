export interface Sale {
  id: string;
  cashier_id: string;
  customer_name: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amount_paid: number;
  change: number;
  payment_method: 'cash' | 'card' | 'other';
  created_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  cashier: {
    full_name: string;
  };
}

export interface CartItem {
  inventory_id: string;
  name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  stock_quantity: number;
}
