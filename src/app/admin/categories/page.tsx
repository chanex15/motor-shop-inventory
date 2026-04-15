'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Package } from 'lucide-react';
import { categorySchema, type CategoryInput } from '@/lib/validations/inventory';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<CategoryInput>({
    name: '',
    description: '',
  });
  const [error, setError] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const fetchCategories = async () => {
    const supabase = createClient();
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const toggleCategory = async (categoryId: string) => {
    if (expandedCategoryId === categoryId) {
      // Collapse
      setExpandedCategoryId(null);
      setCategoryProducts([]);
      return;
    }

    // Expand and fetch products
    setExpandedCategoryId(categoryId);
    setLoadingProducts(true);
    
    const supabase = createClient();
    const { data } = await supabase
      .from('inventory')
      .select('id, name, sku, stock_quantity, selling_price, cost_price')
      .eq('category_id', categoryId)
      .order('name');
    
    setCategoryProducts(data || []);
    setLoadingProducts(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validation = categorySchema.safeParse(formData);
    if (!validation.success) {
      const zodError = validation.error;
      setError(zodError.issues[0]?.message || 'Validation error');
      return;
    }

    const supabase = createClient();

    if (editingItem) {
      await supabase.from('categories').update({ name: formData.name, description: formData.description }).eq('id', editingItem.id);
    } else {
      await supabase.from('categories').insert({ name: formData.name, description: formData.description });
    }

    resetForm();
    fetchCategories();
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingItem(null);
    setShowForm(false);
    setError('');
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({ name: item.name, description: item.description || '' });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure? This will also remove the category from all associated products.')) {
      const supabase = createClient();
      await supabase.from('categories').delete().eq('id', id);
      fetchCategories();
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Category' : 'Add New Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded">{error}</div>}
              <div>
                <label className="text-sm font-medium">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingItem ? 'Update' : 'Create'} Category</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Categories ({categories.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {categories.map((cat) => {
              const isExpanded = expandedCategoryId === cat.id;
              return (
                <div key={cat.id} className="border rounded overflow-hidden">
                  {/* Category Header - Clickable */}
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategory(cat.id)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium">{cat.name}</p>
                        <p className="text-sm text-muted-foreground">{cat.description || 'No description'}</p>
                      </div>
                    </div>
                    {/* Action buttons - stop propagation to prevent toggle */}
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(cat.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Expanded Products Section */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      {loadingProducts ? (
                        <div className="p-8 flex justify-center">
                          <LoadingSpinner />
                        </div>
                      ) : (
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <h4 className="font-medium text-sm">
                              Products in this category ({categoryProducts.length})
                            </h4>
                          </div>
                          
                          {categoryProducts.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-4 text-center">
                              No products in this category yet.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {categoryProducts.map((product) => (
                                <div
                                  key={product.id}
                                  className="flex items-center justify-between p-3 bg-background rounded border"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Stock</p>
                                      <p className="font-medium">{product.stock_quantity}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-xs text-muted-foreground">Price</p>
                                      <p className="font-medium">₱{parseFloat(product.selling_price).toFixed(2)}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
