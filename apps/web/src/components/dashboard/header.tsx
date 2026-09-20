'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  School,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export function DashboardHeader({
  onMenuToggle,
}: {
  onMenuToggle: () => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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

        {/* Notifications */}
        <button
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
        </button>

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
