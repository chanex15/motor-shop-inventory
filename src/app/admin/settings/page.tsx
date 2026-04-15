'use client';

import { useState, useEffect } from 'react';
import { useSettings } from '@/hooks/useSettings';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings, CheckCircle, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const { profile } = useAuth();
  const { settings, loading, saveSettings } = useSettings();
  const [shopName, setShopName] = useState(settings.shopName);
  const [taxRate, setTaxRate] = useState(settings.taxRate);
  const [currency, setCurrency] = useState(settings.currency);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  // Sync with hook when settings load
  useEffect(() => {
    setShopName(settings.shopName);
    setTaxRate(settings.taxRate);
    setCurrency(settings.currency);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    const result = await saveSettings({ shopName, taxRate, currency });
    setSaving(false);
    if (result.success) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setSaveError(result.error || 'Failed to save settings');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your application settings</p>
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5" />
          Settings saved successfully!
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertTriangle className="w-5 h-5" />
          {saveError}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage shop information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Shop Name</label>
            <Input value={shopName} onChange={(e) => setShopName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Tax Rate (%)</label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="PHP">PHP - Philippine Peso</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
          <CardDescription>Your profile details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <p className="text-sm font-medium">Name</p>
            <p className="text-muted-foreground">{profile?.full_name}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Email</p>
            <p className="text-muted-foreground">{profile?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Role</p>
            <p className="text-muted-foreground capitalize">{profile?.role}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Motor Shop Inventory + POS System v1.0.0
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Built with Next.js 14, Supabase, and Tailwind CSS
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
