import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, TrendingDown, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  sessionId?: string;
}

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/v1/notifications');
      if (res.ok) {
        const json = await res.json();
        const items = json.data?.notifications || [];
        setNotifications(items);
        setUnreadCount(json.data?.unreadCount || items.filter((n: NotificationItem) => !n.read).length);
      }
    } catch {
      // Graceful fallback for offline / mock
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/v1/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignored
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'STALENESS_DETECTED':
        return <AlertTriangle size={15} className="text-amber-500 shrink-0" />;
      case 'SCORE_CHANGED':
        return <TrendingDown size={15} className="text-rose-500 shrink-0" />;
      case 'CONTRADICTION_APPEARED':
        return <ShieldAlert size={15} className="text-red-500 shrink-0" />;
      default:
        return <CheckCircle2 size={15} className="text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        aria-label="Freshness notifications"
        aria-expanded={isOpen}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Freshness Alerts</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-medium rounded-full bg-blue-100 text-blue-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-800 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1" />
                <p className="font-medium text-slate-600">All assertions verified fresh</p>
                <p>No drift alerts reported from your active watches.</p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 flex items-start gap-3 transition hover:bg-slate-50 ${
                    !item.read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5">{getAlertIcon(item.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 truncate">{item.title}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Link
                        to="/watches"
                        onClick={() => setIsOpen(false)}
                        className="text-[11px] font-medium text-blue-600 hover:text-blue-700"
                      >
                        View Watch →
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2 border-t border-slate-100 bg-slate-50 text-center">
            <Link
              to="/watches"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 transition block py-1"
            >
              Manage Monitoring Schedules
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
