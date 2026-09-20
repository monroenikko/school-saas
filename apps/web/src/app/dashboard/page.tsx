'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { api } from '@/lib/api';
import {
  Users,
  UserCheck,
  FolderTree,
  CalendarCheck,
  Radio,
  CreditCard,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingUp,
  School,
  Activity,
  Plus,
} from 'lucide-react';

interface DashboardStats {
  summary: {
    totalStudents: number;
    totalTeachers: number;
    totalSections: number;
    totalSubjects: number;
    totalDevices: number;
    attendance: {
      present: number;
      late: number;
      absent: number;
      rate: number;
    };
  };
  recentAttendances: Array<{
    id: string;
    studentName: string;
    studentId: string;
    timeIn: string;
    timeOut: string | null;
    status: string;
    deviceName: string;
  }>;
  recentTransactions: Array<{
    id: string;
    referenceNo: string;
    title: string;
    amount: number;
    type: string;
    status: string;
    studentName: string;
    paidAt: string | null;
  }>;
}

export default function DashboardOverviewPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get<DashboardStats>('/api/dashboard/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" /> Campus Executive Overview
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Good day, {user?.firstName}!
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here is the live status of <span className="font-semibold text-slate-800">{user?.tenantName || 'your school'}</span> for SY 2026-2027.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/attendance"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Radio className="w-4 h-4" />
            <span>Live Gate Monitor</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Students
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '—' : stats?.summary.totalStudents || 0}
          </div>
          <div className="text-xs text-emerald-700 mt-1.5 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% active enrolled
          </div>
        </div>

        {/* Total Faculty */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Teaching Faculty
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '—' : stats?.summary.totalTeachers || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            Active department advisers
          </div>
        </div>

        {/* Sections & Offerings */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Sections
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FolderTree className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {loading ? '—' : stats?.summary.totalSections || 0}
          </div>
          <div className="text-xs text-slate-500 mt-1.5">
            {stats?.summary.totalSubjects || 0} Subject classes scheduled
          </div>
        </div>

        {/* Today's RFID Attendance Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              RFID Attendance Rate
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {loading ? '—' : `${stats?.summary.attendance.rate || 0}%`}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              ({stats?.summary.attendance.present || 0} / {stats?.summary.totalStudents || 0} taps)
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${stats?.summary.attendance.rate || 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Grid: RFID Activity & Recent Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live RFID Gate Feed */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Live RFID Gate Tap Activity
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time scans received from school turnstiles & terminal agents
              </p>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View full log</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading tap activity...
            </div>
          ) : stats?.recentAttendances && stats.recentAttendances.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="pb-3 pl-2">Student</th>
                    <th className="pb-3">Student ID</th>
                    <th className="pb-3">Gate Terminal</th>
                    <th className="pb-3">Time In</th>
                    <th className="pb-3 pr-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentAttendances.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pl-2 font-semibold text-slate-900">
                        {item.studentName}
                      </td>
                      <td className="py-3 text-slate-600 font-mono">
                        {item.studentId}
                      </td>
                      <td className="py-3 text-slate-600">
                        {item.deviceName}
                      </td>
                      <td className="py-3 text-slate-600">
                        {item.timeIn ? new Date(item.timeIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              No RFID taps recorded yet today.
            </div>
          )}
        </div>

        {/* Right Col: Quick Actions & Recent Transactions */}
        <div className="space-y-6">
          {/* Quick Operations Box */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Quick Operations
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/students"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900">Add Student</div>
                <div className="text-[11px] text-slate-500">LRN & profile</div>
              </Link>

              <Link
                href="/dashboard/sections"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                  <FolderTree className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900">New Section</div>
                <div className="text-[11px] text-slate-500">Assign adviser</div>
              </Link>

              <Link
                href="/dashboard/devices"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                  <Radio className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900">RFID Device</div>
                <div className="text-[11px] text-slate-500">Pair turnstile</div>
              </Link>

              <Link
                href="/dashboard/transactions"
                className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-colors cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="text-xs font-semibold text-slate-900">Record Fee</div>
                <div className="text-[11px] text-slate-500">Tuition & badge</div>
              </Link>
            </div>
          </div>

          {/* Recent Parent Transactions */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Recent Billing
              </h3>
              <Link
                href="/dashboard/transactions"
                className="text-[11px] font-semibold text-emerald-600 hover:text-emerald-700"
              >
                View all
              </Link>
            </div>

            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              <div className="space-y-2.5">
                {stats.recentTransactions.slice(0, 3).map((txn) => (
                  <div
                    key={txn.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between"
                  >
                    <div className="truncate mr-2">
                      <div className="text-xs font-semibold text-slate-800 truncate">
                        {txn.title}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {txn.studentName} • <span className="font-mono text-[10px]">{txn.referenceNo}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-slate-900">
                        ₱{txn.amount.toLocaleString()}
                      </div>
                      <span
                        className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-sm uppercase ${
                          txn.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {txn.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs">
                No recent transactions.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
