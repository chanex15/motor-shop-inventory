'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import CashierSidebar from '@/components/cashier/Sidebar';

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, isCashier, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && profile) {
      // Admin can access admin pages, cashier can only access cashier pages
      if (isAdmin) {
        router.push('/admin/dashboard');
      }
    } else if (!loading && !profile) {
      router.push('/login');
    }
  }, [profile, loading, isAdmin, router]);

  if (loading || !profile) {
    return <LoadingSpinner />;
  }

  if (isAdmin) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CashierSidebar />
      <div className="pl-64 pt-16">
        <header className="fixed top-0 right-0 left-64 h-16 bg-card border-b border-border flex items-center justify-end px-6 z-30">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-medium">{profile?.full_name}</span>
            </div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
