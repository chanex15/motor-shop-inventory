'use client';

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import AdminSidebar from '@/components/admin/Sidebar';
import AdminTopNav from '@/components/admin/TopNav';
import { NotificationsProvider } from '@/hooks/useNotifications';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!profile) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/cashier/pos');
      }
    }
  }, [profile, loading, isAdmin, router]);

  if (loading || !profile || !isAdmin) {
    return <LoadingSpinner />;
  }

  return (
    <NotificationsProvider>
      <div className="min-h-screen bg-background">
        <AdminSidebar />
        <AdminTopNav />
        <div className="pl-64 pt-16">
          <main className="p-6">{children}</main>
        </div>
      </div>
    </NotificationsProvider>
  );
}
