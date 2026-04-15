'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { generatePDFReport, downloadPDF } from '@/lib/pdf/generateReport';
import { BarChart3, Download } from 'lucide-react';
import { useInventory } from '@/hooks/useInventory';

export default function StockReportPage() {
  const { inventory, loading } = useInventory();
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const filteredInventory = inventory.filter(item => {
    if (filter === 'low') return item.stock_quantity <= item.low_stock_threshold && item.stock_quantity > 0;
    if (filter === 'out') return item.stock_quantity === 0;
    return true;
  });

  const generateReport = () => {
    if (inventory.length === 0) return;

    const totalValue = inventory.reduce((sum, item) => sum + (item.stock_quantity * Number(item.selling_price)), 0);
    const lowStockCount = inventory.filter(i => i.stock_quantity <= i.low_stock_threshold).length;
    const outOfStockCount = inventory.filter(i => i.stock_quantity === 0).length;

    const headers = ['Name', 'SKU', 'Category', 'Stock', 'Price', 'Value', 'Status'];
    const rows = filteredInventory.map(item => [
      item.name,
      item.sku,
      item.category?.name || '-',
      item.stock_quantity,
      `₱${Number(item.selling_price).toFixed(2)}`,
      `₱${(item.stock_quantity * Number(item.selling_price)).toFixed(2)}`,
      item.stock_quantity === 0 ? 'Out of Stock' : item.stock_quantity <= item.low_stock_threshold ? 'Low Stock' : 'In Stock',
    ]);

    const doc = generatePDFReport({
      headers,
      rows,
      title: 'Stock Report',
      subtitle: `Generated ${new Date().toLocaleDateString()}`,
      totals: [
        { label: 'Total Products', value: inventory.length.toString() },
        { label: 'Total Stock Value', value: `₱${totalValue.toFixed(2)}` },
        { label: 'Low Stock Items', value: lowStockCount.toString() },
        { label: 'Out of Stock', value: outOfStockCount.toString() },
      ],
    });

    downloadPDF(doc, 'stock-report');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stock Report</h1>
        <p className="text-muted-foreground">Monitor inventory levels and values</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(['all', 'low', 'out'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? 'All Items' : f === 'low' ? 'Low Stock' : 'Out of Stock'}
              </Button>
            ))}
          </div>

          <Button onClick={generateReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </CardContent>
      </Card>

      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>Inventory ({filteredInventory.length} items)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">SKU</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-left p-3">Stock</th>
                    <th className="text-left p-3">Price</th>
                    <th className="text-left p-3">Value</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="p-3 font-medium">{item.name}</td>
                      <td className="p-3">{item.sku}</td>
                      <td className="p-3">{item.category?.name || '-'}</td>
                      <td className="p-3">{item.stock_quantity}</td>
                      <td className="p-3">₱{Number(item.selling_price).toFixed(2)}</td>
                      <td className="p-3">₱{(item.stock_quantity * Number(item.selling_price)).toFixed(2)}</td>
                      <td className="p-3">
                        {item.stock_quantity === 0 ? 'Out of Stock' : item.stock_quantity <= item.low_stock_threshold ? 'Low Stock' : 'In Stock'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
