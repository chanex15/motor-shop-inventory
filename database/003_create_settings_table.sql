-- Create settings table for shop configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow admins to do everything
CREATE POLICY "Admins full access on settings"
  ON settings
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can read settings"
  ON settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Insert default settings if they don't exist
INSERT INTO settings (key, value) VALUES
  ('shop_name', 'Motor Shop Inventory'),
  ('tax_rate', '0'),
  ('currency', 'PHP')
ON CONFLICT (key) DO NOTHING;
