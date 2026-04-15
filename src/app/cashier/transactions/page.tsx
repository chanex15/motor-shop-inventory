'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

export default function CashierTransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    async function fetchTransactions() {
      if (!profile) return;

      const supabase = createClient();
      const { data } = await supabase
        .from('sales')
        .select(`
          *,
          sale_items (
            *,
            inventory:inventory (name, sku)
          )
        `)
        .eq('cashier_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(100);

      setTransactions(data || []);
      setLoading(false);
    }

    fetchTransactions();
  }, [profile]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Transactions</h1>
        <p className="text-muted-foreground">View your sales history</p>
      </div>

      {transactions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No transactions yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.map((sale) => (
            <Card key={sale.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base">
                  Transaction #{sale.id.substring(0, 8)}
                </CardTitle>
                <Badge variant="default">
                  {sale.payment_method}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">{new Date(sale.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{sale.customer_name || 'Walk-in'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">₱{Number(sale.total).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Items</p>
                    <p className="font-medium">{sale.sale_items?.length || 0}</p>
                  </div>
                </div>

                {/* Sale Items */}
                {sale.sale_items && sale.sale_items.length > 0 && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Items Sold:</p>
                    <div className="space-y-1">
                      {sale.sale_items.map((item: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                          <span>{item.inventory?.name || 'Unknown'}</span>
                          <span>{item.quantity} x ₱{Number(item.unit_price).toFixed(2)} = ₱{Number(item.total_price).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
