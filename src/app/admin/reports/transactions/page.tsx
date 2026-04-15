'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { generatePDFReport, downloadPDF } from '@/lib/pdf/generateReport';
import { BarChart3, Download } from 'lucide-react';

export default function TransactionsReportPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from('sales')
      .select(`
        *,
        profiles!sales_cashier_id_fkey (full_name),
        sale_items (
          *,
          inventory:inventory (name, sku)
        )
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', new Date(startDate).toISOString());
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query = query.lte('created_at', end.toISOString());
    }

    const { data } = await query.limit(100);
    setTransactions(data || []);
    setLoading(false);
  };

  const generateReport = () => {
    if (transactions.length === 0) {
      alert('No data available. Please fetch data first.');
      return;
    }

    const totalRevenue = transactions.reduce((sum, t) => sum + Number(t.total), 0);

    const headers = ['Date', 'Transaction ID', 'Cashier', 'Customer', 'Payment', 'Total'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.id.substring(0, 8),
      t.profiles?.full_name || 'Unknown',
      t.customer_name || 'Walk-in',
      t.payment_method,
      `₱${Number(t.total).toFixed(2)}`,
    ]);

    const doc = generatePDFReport({
      headers,
      rows,
      title: 'Transaction Report',
      subtitle: `Generated ${new Date().toLocaleDateString()}`,
      totals: [
        { label: 'Total Transactions', value: transactions.length.toString() },
        { label: 'Total Revenue', value: `₱${totalRevenue.toFixed(2)}` },
      ],
    });

    downloadPDF(doc, 'transaction-report');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transaction Report</h1>
        <p className="text-muted-foreground">View and export all transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchTransactions} disabled={loading}>
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

      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transactions ({transactions.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Cashier</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Payment</th>
                    <th className="text-left p-3">Items</th>
                    <th className="text-left p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.id} className="border-b">
                      <td className="p-3">{new Date(t.created_at).toLocaleString()}</td>
                      <td className="p-3">{t.profiles?.full_name || 'Unknown'}</td>
                      <td className="p-3">{t.customer_name || 'Walk-in'}</td>
                      <td className="p-3 capitalize">{t.payment_method}</td>
                      <td className="p-3">{t.sale_items?.length || 0}</td>
                      <td className="p-3 font-medium">₱{Number(t.total).toFixed(2)}</td>
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
