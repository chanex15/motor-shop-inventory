'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supplierSchema, type SupplierInput } from '@/lib/validations/inventory';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<SupplierInput>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });
  const [error, setError] = useState('');

  const fetchSuppliers = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('suppliers').select('*').order('name');
    setSuppliers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = supplierSchema.safeParse(formData);
    if (!validation.success) {
      const zodError = validation.error;
      setError(zodError.issues[0]?.message || 'Validation error');
      return;
    }

    const supabase = createClient();

    if (editingItem) {
      await supabase.from('suppliers').update({
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      }).eq('id', editingItem.id);
    } else {
      await supabase.from('suppliers').insert({
        name: formData.name,
        contact_person: formData.contact_person || null,
        email: formData.email || null,
        phone: formData.phone || null,
        address: formData.address || null,
      });
    }

    resetForm();
    fetchSuppliers();
  };

  const resetForm = () => {
    setFormData({ name: '', contact_person: '', email: '', phone: '', address: '' });
    setEditingItem(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      contact_person: item.contact_person || '',
      email: item.email || '',
      phone: item.phone || '',
      address: item.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this supplier?')) {
      const supabase = createClient();
      await supabase.from('suppliers').delete().eq('id', id);
      fetchSuppliers();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier information</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Supplier' : 'Add New Supplier'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">{error}</div>}
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium">Contact Person</label>
                <Input value={formData.contact_person || ''} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Address</label>
                <Input value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingItem ? 'Update' : 'Create'} Supplier</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({suppliers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {suppliers.map((sup) => (
              <div key={sup.id} className="flex items-center justify-between p-4 border rounded">
                <div>
                  <p className="font-medium">{sup.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {sup.contact_person && `${sup.contact_person} • `}
                    {sup.email || sup.phone || 'No contact info'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(sup)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(sup.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
