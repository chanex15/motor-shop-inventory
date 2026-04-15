import { z } from 'zod';

export const saleSchema = z.object({
  customer_name: z.string().optional().nullable(),
  items: z.array(z.object({
    inventory_id: z.string().uuid(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
    unit_price: z.number().min(0, 'Price must be 0 or greater'),
  })).min(1, 'At least one item is required'),
  tax: z.number().min(0).default(0),
  discount: z.number().min(0).default(0),
  amount_paid: z.number().min(0, 'Amount paid must be 0 or greater'),
  payment_method: z.enum(['cash', 'card', 'other']).default('cash'),
});

export const reportFiltersSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('daily'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export type SaleInput = z.infer<typeof saleSchema>;
export type ReportFilters = z.infer<typeof reportFiltersSchema>;
