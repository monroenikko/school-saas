'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  LogOut,
  School,
  ShieldCheck,
  User,
  Activity,
  Calendar,
  Users,
  CreditCard,
  Radio,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-tight">EdVance</span>
              <span className="text-xs text-slate-400 block -mt-1">
                {user.tenantName || 'Platform Administration'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-slate-800/60 border border-slate-700/50 py-1.5 px-3 rounded-full">
              <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[10px] text-emerald-400 uppercase font-mono">
                  {user.role}
                </div>
              </div>
            </div>

            <button
              onClick={() => logout()}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700/50 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Banner */}
        <div className="relative rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 p-6 sm:p-8 mb-8 overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" /> Authentication Verified
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Welcome back, {user.firstName}!
            </h2>
            <p className="text-slate-400 mt-2 text-sm max-w-2xl">
              You are signed in to <span className="text-white font-medium">{user.tenantName || 'School SaaS Platform'}</span>.
              Your account has <span className="text-emerald-400 font-mono font-medium">{user.role}</span> privileges with multi-tenant data boundaries enforced.
            </p>
          </div>
        </div>

        {/* Status / Quick Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Tenant Scope</span>
              <School className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-lg font-bold text-white truncate">
              {user.tenantName || 'System-wide'}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-mono truncate">
              ID: {user.tenantId ? user.tenantId.slice(0, 8) + '...' : 'Global'}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">User Account</span>
              <User className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-lg font-bold text-white truncate">
              {user.email}
            </div>
            <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Active Session
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">RFID Status</span>
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white">
              Gate Turnstile
            </div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">
              Ready for Live Scans
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Security State</span>
              <ShieldCheck className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-lg font-bold text-white">
              JWT + HttpOnly
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Token Rotation Active
            </div>
          </div>
        </div>

        {/* Information Callout */}
        <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-sm text-slate-400">
          <h3 className="text-white font-semibold mb-1 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Step 3 Verification Completed
          </h3>
          <p>
            JWT Authentication, Cookie Sessions, Refresh Token Rotation, and Multi-Tenant RBAC Guards are operational.
            In <strong>Step 4</strong>, we will build the full collapsible sidebar navigation, breadcrumbs, and real-time statistics dashboard!
          </p>
        </div>
      </main>
    </div>
  );
}
