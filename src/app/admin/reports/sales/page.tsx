'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { generatePDFReport, downloadPDF } from '@/lib/pdf/generateReport';
import { BarChart3, Download } from 'lucide-react';

export default function SalesReportPage() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);

  const fetchSalesData = async () => {
    setLoading(true);
    const supabase = createClient();
    const now = new Date();
    let startDate = new Date();

    if (period === 'daily') {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      startDate.setDate(now.getDate() - 7);
    } else {
      startDate.setMonth(now.getMonth() - 1);
    }

    const { data } = await supabase
      .from('sales')
      .select(`
        *,
        profiles!sales_cashier_id_fkey (full_name),
        sale_items (*)
      `)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });

    setSalesData(data || []);
    setLoading(false);
  };

  const generateReport = () => {
    if (salesData.length === 0) {
      alert('No data available. Please fetch data first.');
      return;
    }

    const totalRevenue = salesData.reduce((sum, sale) => sum + Number(sale.total), 0);
    const totalTransactions = salesData.length;
    const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

    const headers = ['Date', 'Cashier', 'Customer', 'Items', 'Total'];
    const rows = salesData.map(sale => [
      new Date(sale.created_at).toLocaleString(),
      sale.profiles?.full_name || 'Unknown',
      sale.customer_name || 'Walk-in',
      sale.sale_items?.length || 0,
      `₱${Number(sale.total).toFixed(2)}`,
    ]);

    const doc = generatePDFReport({
      headers,
      rows,
      title: 'Sales Report',
      subtitle: `${period.charAt(0).toUpperCase() + period.slice(1)} Report - Generated ${new Date().toLocaleDateString()}`,
      totals: [
        { label: 'Total Revenue', value: `₱${totalRevenue.toFixed(2)}` },
        { label: 'Total Transactions', value: totalTransactions.toString() },
        { label: 'Average Sale', value: `₱${averageSale.toFixed(2)}` },
      ],
    });

    downloadPDF(doc, `sales-report-${period}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sales Report</h1>
        <p className="text-muted-foreground">Generate and download sales reports</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'default' : 'outline'}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchSalesData} disabled={loading}>
              <BarChart3 className="w-4 h-4 mr-2" />
              {loading ? 'Loading...' : 'Fetch Data'}
            </Button>
            <Button onClick={generateReport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {salesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sales ({salesData.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Cashier</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((sale) => (
                    <tr key={sale.id} className="border-b">
                      <td className="p-3">{new Date(sale.created_at).toLocaleString()}</td>
                      <td className="p-3">{sale.profiles?.full_name || 'Unknown'}</td>
                      <td className="p-3">{sale.customer_name || 'Walk-in'}</td>
                      <td className="p-3">{sale.sale_items?.length || 0}</td>
                      <td className="p-3 font-medium">₱{Number(sale.total).toFixed(2)}</td>
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
