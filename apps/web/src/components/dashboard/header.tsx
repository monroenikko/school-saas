'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { apiClient } from '@/lib/api';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  School,
  LogOut,
  ChevronRight,
  CheckCheck,
  Radio,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface TenantOption {
  id: string;
  name: string;
  slug: string;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export function DashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [schools, setSchools] = useState<TenantOption[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>('');
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSelectedTenantId(apiClient.getActiveTenantId() || '');
    }

    if (user?.role === 'SUPER_ADMIN') {
      apiClient
        .request<TenantOption[]>('/api/tenants')
        .then((res) => {
          if (res.data) {
            setSchools(res.data);
          }
        })
        .catch(() => {
          // fallback silent
        });
    }

    // Fetch initial notification stats & recent alerts
    apiClient
      .request<{ unreadCount: number }>('/api/notifications/stats')
      .then((res) => {
        if (res.data?.unreadCount !== undefined) {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch(() => {});

    apiClient
      .request<{ data: NotificationItem[] }>('/api/notifications?limit=4')
      .then((res) => {
        if (res.data?.data) {
          setRecentNotifs(res.data.data);
        }
      })
      .catch(() => {});
  }, [user?.role]);

  const handleSwitchSchool = (tenantId: string) => {
    setSelectedTenantId(tenantId);
    apiClient.setActiveTenantId(tenantId || null);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await apiClient.request('/api/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setRecentNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // fallback silent
    }
  };

  // Generate breadcrumb items
  const pathParts = pathname.split('/').filter(Boolean);
  const breadcrumb = pathParts.map((part) =>
    part.charAt(0).toUpperCase() + part.slice(1).replace('-', ' ')
  );

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 md:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="font-semibold text-slate-700">EdVance</span>
          {breadcrumb.map((crumb, idx) => (
            <React.Fragment key={crumb}>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              <span
                className={`${
                  idx === breadcrumb.length - 1
                    ? 'font-bold text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right: Academic Context, Search & Notifications */}
      <div className="flex items-center gap-3">
        {/* Super Admin School Switcher */}
        {user?.role === 'SUPER_ADMIN' ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-xs">
            <School className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="text-emerald-700 font-bold hidden md:inline">School:</span>
            <select
              aria-label="Select School"
              value={selectedTenantId}
              onChange={(e) => handleSwitchSchool(e.target.value)}
              className="bg-transparent text-emerald-950 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="">🌐 All Schools (Global)</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  🏫 {s.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
            <School className="w-3.5 h-3.5 text-emerald-600" />
            <span>{user?.tenantName || 'St. Jude Academy'}</span>
          </div>
        )}

        {/* Academic Year Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-emerald-600" />
          <span>SY 2026-2027 • 1st Sem</span>
        </div>

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search students, classes... (⌘K)"
            className="w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
          />
        </div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown((prev) => !prev)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notifications"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 ? (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200/90 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 pb-2.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full">
                      {unreadCount} unread
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {recentNotifs.length > 0 ? (
                  recentNotifs.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3.5 hover:bg-slate-50 transition-colors ${
                        !n.isRead ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            n.type === 'ATTENDANCE_TAP'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {n.type === 'ATTENDANCE_TAP' ? (
                            <Radio className="w-3.5 h-3.5" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {n.title}
                          </p>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No recent notifications
                  </div>
                )}
              </div>

              <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
                <Link
                  href="/dashboard/notifications"
                  onClick={() => setShowDropdown(false)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold inline-flex items-center gap-1.5"
                >
                  <span>View All Notifications & Dispatch Logs</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Logout Quick Action */}
        <button
          onClick={() => logout()}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
