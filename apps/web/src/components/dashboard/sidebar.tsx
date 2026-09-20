'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  UserCheck,
  FolderTree,
  BookOpen,
  CalendarCheck,
  Radio,
  CreditCard,
  Settings,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Sparkles,
  Building2,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'RFID Attendance', href: '/dashboard/attendance', icon: CalendarCheck, badge: 'Live' },
      { title: 'RFID Gate Devices', href: '/dashboard/devices', icon: Radio },
    ],
  },
  {
    label: 'Academic Records',
    items: [
      { title: 'Students Roster', href: '/dashboard/students', icon: Users },
      { title: 'Faculty & Teachers', href: '/dashboard/teachers', icon: UserCheck },
      { title: 'Sections & Rosters', href: '/dashboard/sections', icon: FolderTree },
      { title: 'Subjects & Schedules', href: '/dashboard/subjects', icon: BookOpen },
    ],
  },
  {
    label: 'Management',
    items: [
      { title: 'Parent Billing', href: '/dashboard/transactions', icon: CreditCard },
      { title: 'Users & Staff', href: '/dashboard/users', icon: ShieldCheck },
      { title: 'School Settings', href: '/dashboard/settings', icon: Settings },
    ],
  },
];

export function DashboardSidebar({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const navGroups: NavGroup[] = [
    ...(isSuperAdmin
      ? [
          {
            label: 'Platform Administration',
            items: [
              {
                title: 'All Schools / Tenants',
                href: '/dashboard/tenants',
                icon: Building2,
                badge: 'Root',
              },
            ],
          },
        ]
      : []),
    ...NAV_GROUPS,
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80">
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 p-0.5 shadow-sm shadow-emerald-600/20 shrink-0">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          {!isCollapsed && (
            <div className="leading-tight truncate">
              <span className="font-bold text-slate-900 text-base tracking-tight block">
                EdVance
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold truncate block">
                {user?.tenantName || 'School OS'}
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                {group.label}
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.title : undefined}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-semibold shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 shrink-0 ${
                        isActive ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    {!isCollapsed && (
                      <div className="flex-1 flex items-center justify-between truncate">
                        <span className="truncate">{item.title}</span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* User Profile & Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-200/80 space-y-2">
        {/* Current User Pill */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-200/70 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.firstName?.[0] || 'U'}
            {user?.lastName?.[0] || ''}
          </div>
          {!isCollapsed && (
            <div className="flex-1 truncate">
              <div className="text-xs font-semibold text-slate-900 truncate">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-[10px] text-emerald-700 font-mono uppercase font-bold">
                {user?.role}
              </div>
            </div>
          )}
          {!isCollapsed && (
            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full py-1.5 px-2 rounded-lg text-xs text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span>Collapse Menu</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
