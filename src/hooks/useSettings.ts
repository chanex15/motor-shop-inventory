'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchSettings as fetchSettingsAction, saveSettings as saveSettingsAction } from '@/app/settings-actions';

export interface ShopSettings {
  shopName: string;
  taxRate: string;
  currency: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Motor Shop Inventory',
    taxRate: '0',
    currency: 'PHP',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Fetching settings via server action...');
      const result = await fetchSettingsAction();
      
      console.log('Server action result:', result);
      
      if (result.success && result.data) {
        const parsed = result.data;
        setSettings({
          shopName: parsed.shopName || settings.shopName,
          taxRate: parsed.taxRate || '0',
          currency: parsed.currency || settings.currency,
        });
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveSettings = useCallback(async (newSettings: ShopSettings) => {
    setError(null);
    try {
      console.log('Saving settings via server action:', newSettings);
      const result = await saveSettingsAction(newSettings);
      
      if (result.success) {
        setSettings(newSettings);
        console.log('Settings saved successfully');
        return { success: true };
      } else {
        setError(result.error || 'Failed to save');
        return { success: false, error: result.error };
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
      setError(err.message);
      return { success: false, error: err.message };
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    error,
    saveSettings,
    refreshSettings: fetchSettings,
  };
}
