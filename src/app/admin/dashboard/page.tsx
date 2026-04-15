'use client';

import { useEffect, useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Package, AlertTriangle, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const { inventory, loading: inventoryLoading, getLowStockItems } = useInventory();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalStock: 0,
    lowStock: 0,
    todaySales: 0,
    todayRevenue: 0,
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const supabase = createClient();

      // Get low stock items
      const lowStock = await getLowStockItems();
      setLowStockItems(lowStock);

      // Get today's sales
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todaySales } = await supabase
        .from('sales')
        .select('total, created_at')
        .gte('created_at', today.toISOString());

      const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total), 0) || 0;

      setStats({
        totalProducts: inventory.length,
        totalStock: inventory.reduce((sum, item) => sum + item.stock_quantity, 0),
        lowStock: lowStock.length,
        todaySales: todaySales?.length || 0,
        todayRevenue: todayRevenue,
      });

      setLoading(false);
    }

    if (!inventoryLoading) {
      fetchStats();
    }
  }, [inventory, inventoryLoading]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your motor shop inventory</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          icon={Package}
          description="Active inventory items"
        />
        <StatCard
          title="Total Stock"
          value={stats.totalStock}
          icon={TrendingUp}
          description="Units in inventory"
        />
        <StatCard
          title="Today's Sales"
          value={stats.todaySales}
          icon={ShoppingCart}
          description="Transactions today"
        />
        <StatCard
          title="Today's Revenue"
          value={`₱${stats.todayRevenue.toFixed(2)}`}
          icon={DollarSign}
          description="Revenue today"
        />
      </div>

      {/* Low Stock Alert */}
      {stats.lowStock > 0 && (
        <Card className="border-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Low Stock Alert
            </CardTitle>
            <Badge variant="destructive">{stats.lowStock} items</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-muted rounded">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-destructive">{item.stock_quantity} units</p>
                    <p className="text-sm text-muted-foreground">Threshold: {item.low_stock_threshold}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/admin/inventory">
              <Button variant="outline" className="mt-4">View All Inventory</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <QuickActionCard
          title="Add New Product"
          description="Add motor parts to inventory"
          href="/admin/inventory"
        />
        <QuickActionCard
          title="View Reports"
          description="Sales and stock reports"
          href="/admin/reports/sales"
        />
        <QuickActionCard
          title="Manage Suppliers"
          description="Update supplier information"
          href="/admin/suppliers"
        />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: any;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function QuickActionCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:bg-accent transition-colors cursor-pointer">
        <CardHeader>
          <CardTitle className="text-base">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </CardHeader>
      </Card>
    </Link>
  );
}
