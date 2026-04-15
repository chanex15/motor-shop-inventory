'use server';

import { createClient } from '@supabase/supabase-js';

interface ShopSettings {
  shopName: string;
  taxRate: string;
  currency: string;
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log('=== Server Action Init ===');
  console.log('Supabase URL:', url);
  console.log('Service key length:', key?.length);
  return createClient(url!, key!);
}

export async function fetchSettings() {
  const supabase = getAdminClient();
  
  console.log('=== Fetching Settings ===');
  
  const { data, error } = await supabase
    .from('settings')
    .select('*');

  console.log('Query error:', error);
  console.log('Query data:', JSON.stringify(data));
  console.log('Query data length:', data?.length);

  if (error) {
    return { success: false, error: error.message, data: null };
  }

  const parsed: Partial<ShopSettings> = {};
  if (data) {
    for (const row of data) {
      console.log(`Setting [${row.key}] = "${row.value}"`);
    }
    
    const taxRow = data.find(r => r.key === 'tax_rate');
    const shopRow = data.find(r => r.key === 'shop_name');
    const currRow = data.find(r => r.key === 'currency');
    
    if (taxRow) parsed.taxRate = taxRow.value;
    if (shopRow) parsed.shopName = shopRow.value;
    if (currRow) parsed.currency = currRow.value;
  }

  console.log('Parsed:', parsed);
  return { success: true, data: parsed };
}

export async function ensureSettingsTable() {
  const supabase = getAdminClient();
  console.log('=== Ensuring Settings Table Exists ===');

  // Try to insert default values - if table doesn't exist, this will fail
  // and we can handle it
  const { error } = await supabase
    .from('settings')
    .upsert([
      { key: 'shop_name', value: 'Motor Shop Inventory' },
      { key: 'tax_rate', value: '0' },
      { key: 'currency', value: 'PHP' },
    ], { onConflict: 'key' });

  if (error) {
    console.error('Table access error:', error);
    return { 
      success: false, 
      error: error.message,
      hint: 'Please run the SQL migration from database/003_create_settings_table.sql in your Supabase dashboard'
    };
  }
  
  return { success: true };
}

export async function saveSettings(newSettings: ShopSettings) {
  const supabase = getAdminClient();

  console.log('=== Saving Settings ===');
  console.log('Input:', JSON.stringify(newSettings));

  const updates = [
    { key: 'shop_name', value: newSettings.shopName },
    { key: 'tax_rate', value: newSettings.taxRate },
    { key: 'currency', value: newSettings.currency },
  ];

  for (const update of updates) {
    console.log(`Upserting ${update.key} to "${update.value}"...`);

    const { data: result, error } = await supabase
      .from('settings')
      .upsert(
        { key: update.key, value: update.value, updated_at: new Date().toISOString() },
        { onConflict: 'key', count: 'exact' }
      )
      .select();

    console.log(`Upsert result for ${update.key}:`, { 
      data: JSON.stringify(result), 
      error: error ? JSON.stringify(error) : null 
    });

    if (error) {
      console.error(`Failed to upsert ${update.key}:`, error);
      return { success: false, error: error.message };
    }
  }

  console.log('All settings saved');
  return { success: true };
}
