-- =====================================================
-- FIX: Cashier inventory update issue
-- Issue: Cashiers cannot complete sales because RLS blocks inventory updates
-- Run this SQL in your Supabase SQL Editor
-- =====================================================

-- 1. Drop the old overly restrictive policy
DROP POLICY IF EXISTS "Admins can manage inventory" ON inventory;

-- 2. Create separate policies:
--    - Admins retain full access
--    - Cashiers can now UPDATE inventory (for stock decrements during sales)

CREATE POLICY "Admins can manage inventory"
  ON inventory FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Allow authenticated users (cashiers) to UPDATE inventory
-- Application logic ensures they only decrement stock during sales
CREATE POLICY "Authenticated users can update inventory stock"
  ON inventory FOR UPDATE
  USING (auth.role() = 'authenticated');

-- =====================================================
-- VERIFICATION: Run this to check your policies
-- =====================================================
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename = 'inventory';
