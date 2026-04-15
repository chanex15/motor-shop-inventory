'use client';

import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

interface ReceiptItem {
  name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface ReceiptProps {
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  amountPaid: number;
  change: number;
  paymentMethod: string;
  customerName: string | null;
  saleId?: string;
  createdAt?: string;
  onClose?: () => void;
  shopName?: string;
}

export default function Receipt({
  items,
  subtotal,
  tax,
  discount,
  total,
  amountPaid,
  change,
  paymentMethod,
  customerName,
  saleId,
  createdAt,
  onClose,
  shopName = 'Motor Shop',
}: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print receipts');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${saleId || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace; 
              font-size: 12px; 
              padding: 10px;
              max-width: 80mm;
              margin: 0 auto;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header h1 { font-size: 18px; margin-bottom: 5px; }
            .divider { border-top: 1px dashed #000; margin: 10px 0; }
            .items { margin: 10px 0; }
            .item { margin-bottom: 8px; }
            .item-name { font-weight: bold; }
            .item-details { display: flex; justify-content: space-between; margin-top: 2px; }
            .totals { margin: 10px 0; }
            .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total-row.grand-total { font-size: 16px; font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 10px; }
            @media print {
              body { padding: 0; }
              @page { margin: 5mm; size: 80mm auto; }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-4">
      <div ref={receiptRef} className="bg-white p-6 rounded-lg font-mono text-sm max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">{shopName}</h2>
          <p className="text-xs text-muted-foreground">Inventory & POS System</p>
          {createdAt && (
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(createdAt).toLocaleString()}
            </p>
          )}
          {saleId && (
            <p className="text-xs text-muted-foreground">Sale ID: {saleId.slice(0, 8)}</p>
          )}
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        {/* Customer */}
        {customerName && (
          <div className="mb-2">
            <p className="text-xs text-muted-foreground">Customer: {customerName}</p>
          </div>
        )}

        <div className="border-t border-dashed border-gray-300 my-2" />

        {/* Items */}
        <div className="space-y-2 my-3">
          {items.map((item, index) => (
            <div key={index} className="space-y-1">
              <p className="font-medium">{item.name}</p>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{item.quantity} x ₱{item.unit_price.toFixed(2)}</span>
                <span>₱{item.total_price.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        {/* Totals */}
        <div className="space-y-1 my-3">
          <div className="flex justify-between text-sm">
            <span>Subtotal</span>
            <span>₱{subtotal.toFixed(2)}</span>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm">
              <span>Tax</span>
              <span>₱{tax.toFixed(2)}</span>
            </div>
          )}
          {discount > 0 && (
            <div className="flex justify-between text-sm">
              <span>Discount</span>
              <span>-₱{discount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t border-dashed border-gray-300 pt-2 mt-2">
            <span>Total</span>
            <span>₱{total.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        {/* Payment */}
        <div className="space-y-1 my-3">
          <div className="flex justify-between text-sm">
            <span>Payment Method</span>
            <span className="capitalize">{paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Amount Paid</span>
            <span>₱{amountPaid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Change</span>
            <span>₱{change.toFixed(2)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-gray-300 my-2" />

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-sm font-medium">Thank you for your purchase!</p>
          <p className="text-xs text-muted-foreground mt-1">Please keep this receipt for your records</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <Button onClick={handlePrint} className="flex-1" variant="outline">
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </Button>
        {onClose && (
          <Button onClick={onClose} variant="destructive" className="px-4">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
