// User types and roles
export type UserRole = 'admin' | 'cashier';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

// Database types - using generic any for Supabase typed client
// For full type safety, generate types via: npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/db.ts
export type Database = any;
