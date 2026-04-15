import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(url!, key!);

    console.log('Creating settings table...');

    // Create the table
    const { error: tableError } = await supabase.rpc('create_settings_table_if_not_exists');
    
    if (tableError) {
      console.log('RPC not available, trying direct SQL...');
      
      // Direct SQL execution
      const sql = `
        CREATE TABLE IF NOT EXISTS settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Insert default settings if they don't exist
        INSERT INTO settings (key, value) 
        VALUES 
          ('shop_name', 'Motor Shop Inventory'),
          ('tax_rate', '0'),
          ('currency', 'PHP')
        ON CONFLICT (key) DO NOTHING;
      `;
      
      // Use the Supabase REST API to execute raw SQL
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': key!,
          'Authorization': `Bearer ${key!}`,
          'Prefer': 'params=single-object'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        return NextResponse.json({ 
          error: 'Failed to create table. Please run the SQL migration manually.',
          details: await response.text()
        }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true, message: 'Settings table created' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
