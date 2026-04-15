'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import NotificationDropdown from './NotificationDropdown';

export default function AdminTopNav() {
  const { profile, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-64 h-16 bg-card border-b border-border flex items-center justify-between px-6 z-30">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <div className="relative">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {showNotifications && (
            <NotificationDropdown onClose={() => setShowNotifications(false)} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{profile?.full_name}</span>
        </div>
      </div>
    </header>
  );
}
