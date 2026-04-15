import { Profile } from '@/types/user';

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  category_id: string | null;
  supplier_id: string | null;
  name: string;
  sku: string;
  description: string | null;
  image_url?: string | null;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface InventoryWithRelations extends InventoryItem {
  category: Category | null;
  supplier: Supplier | null;
}

import { Supplier } from './supplier';
