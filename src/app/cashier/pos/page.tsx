'use client';

import { useState, useEffect } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { usePOS } from '@/hooks/usePOS';
import { useSales } from '@/hooks/useSales';
import { useSettings } from '@/hooks/useSettings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Receipt from '@/components/cashier/Receipt';
import { Search, Plus, Minus, Trash2, ShoppingCart, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function POSPage() {
  const { inventory, loading: inventoryLoading } = useInventory();
  const { settings, loading: settingsLoading } = useSettings();
  const {
    cart,
    selectedCategory,
    searchQuery,
    setSelectedCategory,
    setSearchQuery,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    cartCount,
  } = usePOS();
  const { processSale, processing } = useSales();

  const [categories, setCategories] = useState<any[]>([]);
  const [amountPaid, setAmountPaid] = useState('');
  const [tax, setTax] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'other'>('cash');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('categories').select('*').order('name');
      setCategories(data || []);
    };
    fetchCategories();
  }, []);

  // Apply tax rate from settings
  useEffect(() => {
    if (settings.taxRate) {
      const rate = parseFloat(settings.taxRate);
      setTax(subtotal * (rate / 100));
    }
  }, [settings.taxRate, subtotal]);

  const filteredInventory = inventory.filter(item => {
    const matchesCategory = !selectedCategory || item.category_id === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.stock_quantity > 0;
  });

  const total = subtotal + tax - discount;
  const change = amountPaid ? parseFloat(amountPaid) - total : 0;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;

    const paid = parseFloat(amountPaid) || 0;
    if (paymentMethod === 'cash' && paid < total) {
      alert('Insufficient payment amount');
      return;
    }

    const result = await processSale(cart, paid || total, paymentMethod, customerName || null, tax, discount);

    if (result.success) {
      setLastSale(result.sale);
      setShowSuccess(true);
      clearCart();
      setAmountPaid('');
      setCustomerName('');
      setTax(0);
      setDiscount(0);
    } else {
      alert(result.error || 'Failed to process sale');
    }
  };

  if (inventoryLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">POS Counter</h1>
        <p className="text-muted-foreground">Process customer sales</p>
      </div>

      {/* Success Modal with Receipt */}
      {showSuccess && lastSale && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <CardTitle>Sale Completed!</CardTitle>
            </CardHeader>
            <CardContent>
              <Receipt
                items={lastSale.items.map((item: any) => ({
                  name: inventory.find(i => i.id === item.inventory_id)?.name || 'Unknown',
                  sku: inventory.find(i => i.id === item.inventory_id)?.sku || '',
                  quantity: item.quantity,
                  unit_price: item.unit_price,
                  total_price: item.total_price,
                }))}
                subtotal={Number(lastSale.subtotal)}
                tax={Number(lastSale.tax)}
                discount={Number(lastSale.discount)}
                total={Number(lastSale.total)}
                amountPaid={Number(lastSale.amount_paid)}
                change={Number(lastSale.change)}
                paymentMethod={lastSale.payment_method}
                customerName={lastSale.customer_name}
                saleId={lastSale.id}
                createdAt={lastSale.created_at}
                onClose={() => setShowSuccess(false)}
                shopName={settings.shopName}
              />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search and Category Filter */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={!selectedCategory ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((cat) => (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                  >
                    {cat.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredInventory.map((item) => (
              <Card
                key={item.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  addToCart({
                    inventory_id: item.id,
                    name: item.name,
                    sku: item.sku,
                    unit_price: Number(item.selling_price) || 0,
                    stock_quantity: Number(item.stock_quantity) || 0,
                  })
                }
              >
                <CardContent className="p-4">
                    {item.image_url && (
                      <div className="mb-3 flex justify-center">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="h-32 w-32 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                    <p className="font-medium truncate">{item.name}</p>
                    
                    {/* SKU */}
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-lg font-bold text-primary">₱{Number(item.selling_price).toFixed(2)}</p>
                      <Badge variant={Number(item.stock_quantity) <= Number(item.low_stock_threshold) ? 'destructive' : 'default'}>
                        {Number(item.stock_quantity) || 0} left
                      </Badge>
                    </div>
                  </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cart Section */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" />
                Cart ({cartCount})
              </CardTitle>
              {cart.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearCart}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cart Items */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Cart is empty</p>
                ) : (
                  cart.map((item) => (
                    <div key={item.inventory_id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">₱{item.unit_price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => updateQuantity(item.inventory_id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-6 h-6"
                          onClick={() => removeFromCart(item.inventory_id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals Section - Clean & Simple */}
              <div className="space-y-3 border-t pt-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₱{subtotal.toFixed(2)}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Tax ({settings.taxRate}%)</span>
                    <span>₱{tax.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-2xl font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-orange-500">₱{total.toFixed(2)}</span>
                </div>
              </div>

              {/* Amount Received */}
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Amount Received</label>
                <Input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="text-lg h-12 border-orange-500 focus-visible:ring-orange-500"
                />
                {change >= 0 && amountPaid && (
                  <p className="text-sm text-green-600 mt-2">Change: ₱{change.toFixed(2)}</p>
                )}
                {change < 0 && amountPaid && (
                  <p className="text-sm text-red-500 mt-2">Insufficient: ₱{Math.abs(change).toFixed(2)}</p>
                )}
              </div>

              {/* Complete Sale Button */}
              <Button
                className="w-full h-12 text-lg bg-orange-600 hover:bg-orange-700"
                size="lg"
                disabled={cart.length === 0 || processing || (paymentMethod === 'cash' && change < 0)}
                onClick={handleCompleteSale}
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                {processing ? 'Processing...' : 'Complete Sale'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
