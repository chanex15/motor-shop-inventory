import { z } from 'zod';

export const inventorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  category_id: z.string().uuid().optional().nullable(),
  supplier_id: z.string().uuid().optional().nullable(),
  cost_price: z.union([z.string(), z.number()]).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, { message: 'Cost price must be 0 or greater' }),
  selling_price: z.union([z.string(), z.number()]).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && num >= 0;
  }, { message: 'Selling price must be 0 or greater' }),
  stock_quantity: z.union([z.string(), z.number()]).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }, { message: 'Stock must be 0 or greater' }),
  low_stock_threshold: z.union([z.string(), z.number()]).refine((val) => {
    const num = Number(val);
    return !isNaN(num) && Number.isInteger(num) && num >= 0;
  }, { message: 'Threshold must be 0 or greater' }).optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export type InventoryInput = z.infer<typeof inventorySchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type SupplierInput = z.infer<typeof supplierSchema>;
