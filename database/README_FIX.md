# Fix: Cashier Sales Not Updating Inventory

## Problem
When a cashier completes a sale:
- Stock levels don't decrease in the inventory
- Sales don't appear in the admin reports

## Root Cause
The database Row Level Security (RLS) policy only allowed **admins** to UPDATE the `inventory` table. When cashiers tried to complete a sale, the stock update was blocked by RLS.

## Solution

### Step 1: Apply Database Migration

1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `002_fix_cashier_inventory_update.sql`
4. Click **Run**

This will:
- Add a new RLS policy allowing authenticated users (cashiers) to UPDATE inventory
- Keep admin full access intact

### Step 2: Restart Your Development Server

Stop and restart your Next.js dev server to pick up the code changes.

### Step 3: Test the Fix

1. Log in as the cashier (`zircon@gmail.com`)
2. Go to POS page
3. Add a product to cart
4. Complete the sale
5. Check the inventory - stock should now decrease
6. Log in as admin
7. Go to Reports → Sales/Transactions
8. Click "Fetch Data" - the sale should appear

## What Changed

### Database (RLS Policy)
- **Before**: Only admins could UPDATE inventory
- **After**: Both admins and cashiers can UPDATE inventory (cashiers only decrement stock during sales)

### Code (useSales.ts)
- **Before**: Used stale cart stock values, no validation
- **After**: Fetches current stock, validates sufficient quantity, provides better error messages

## Files Modified
- `database/002_fix_cashier_inventory_update.sql` (new)
- `src/hooks/useSales.ts` (updated)
