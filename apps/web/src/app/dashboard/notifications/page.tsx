'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Bell,
  Radio,
  Send,
  Sparkles,
  CheckCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  AlertTriangle,
  Smartphone,
  Layers,
  Cpu,
  UserCheck,
  Plus,
  X,
  ExternalLink,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  tenantId: string;
  recipient: string;
  title: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

interface NotificationStats {
  totalDispatchedToday: number;
  tapNotificationsSentToday: number;
  deliverySuccessRate: number;
  failedToday: number;
  unreadCount: number;
  queue: {
    status: 'PROCESSING' | 'IDLE';
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  };
}

interface AnnouncementItem {
  id: string;
  tenantId: string;
  title: string;
  content: string;
  audience: string;
  priority: string;
  dispatchedAt: string | null;
  createdAt: string;
}

interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  guardianPhone?: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'notifications' | 'announcements'>('notifications');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Filters & Pagination
  const [search, setSearch] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals
  const [showBroadcastModal, setShowBroadcastModal] = useState<boolean>(false);
  const [showSimulateModal, setShowSimulateModal] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Broadcast Form State
  const [broadcastForm, setBroadcastForm] = useState({
    title: '',
    content: '',
    audience: 'ALL',
    priority: 'STANDARD',
  });

  // Tap Simulation Form State
  const [simulateForm, setSimulateForm] = useState({
    studentId: '',
    scanType: 'TIME_IN' as 'TIME_IN' | 'TIME_OUT',
    deviceName: 'Main Entrance Turnstile #1',
  });

  const fetchData = useCallback(async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await api.request<NotificationStats>('/api/notifications/stats');
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      // 2. Fetch Notifications List
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', '15');
      if (search) queryParams.set('search', search);
      if (typeFilter) queryParams.set('type', typeFilter);
      if (statusFilter) queryParams.set('status', statusFilter);

      const notifsRes = await api.request<{
        data: NotificationItem[];
        meta: { total: number; page: number; limit: number; totalPages: number };
      }>(`/api/notifications?${queryParams.toString()}`);

      if (notifsRes.data) {
        setNotifications(notifsRes.data.data || []);
        setTotalPages(notifsRes.data.meta?.totalPages || 1);
        setTotalCount(notifsRes.data.meta?.total || 0);
      }

      // 3. Fetch Announcements
      const annRes = await api.request<AnnouncementItem[]>('/api/notifications/announcements');
      if (annRes.data) {
        setAnnouncements(annRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load notifications data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, typeFilter, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load students for simulate modal
  useEffect(() => {
    api.request<{ data: StudentOption[] }>('/api/students?limit=50')
      .then((res) => {
        if (res.data?.data) {
          setStudents(res.data.data);
          if (res.data.data.length > 0 && !simulateForm.studentId) {
            setSimulateForm((prev) => ({ ...prev, studentId: res.data.data[0].id }));
          }
        }
      })
      .catch(() => {});
  }, [simulateForm.studentId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      if (stats && stats.unreadCount > 0) {
        setStats({ ...stats, unreadCount: stats.unreadCount - 1 });
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.request('/api/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (stats) {
        setStats({ ...stats, unreadCount: 0 });
      }
      setFeedbackMsg({ type: 'success', text: 'All notifications marked as read!' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to mark all as read.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastForm.title || !broadcastForm.content) return;

    setSubmitting(true);
    try {
      await api.request('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify(broadcastForm),
      });

      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', content: '', audience: 'ALL', priority: 'STANDARD' });
      setFeedbackMsg({ type: 'success', text: 'Announcement queued for background dispatch!' });
      setTimeout(() => setFeedbackMsg(null), 4000);
      handleRefresh();
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to dispatch broadcast' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulateForm.studentId) return;

    setSubmitting(true);
    try {
      await api.request('/api/notifications/simulate-tap-alert', {
        method: 'POST',
        body: JSON.stringify(simulateForm),
      });

      setShowSimulateModal(false);
      setFeedbackMsg({ type: 'success', text: 'Simulated gate tap SMS queued in BullMQ!' });
      setTimeout(() => setFeedbackMsg(null), 4000);
      setTimeout(handleRefresh, 1000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err?.message || 'Failed to simulate tap alert' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Notifications & SMS Dispatch Engine
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Real-time BullMQ queues, guardian gate tap SMS alerts, and school announcements.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all shadow-xs cursor-pointer"
            title="Refresh logs & queue stats"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setShowSimulateModal(true)}
            className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white hover:bg-slate-800 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulate Tap Alert</span>
          </button>

          <button
            onClick={() => setShowBroadcastModal(true)}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Broadcast Announcement</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between animate-in fade-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Dispatched */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Dispatched Today
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {stats?.totalDispatchedToday ?? '0'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">SMS & In-App Alerts</p>
          </div>
        </div>

        {/* Turnstile Tap SMS */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Parent Tap Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-emerald-600">
              {stats?.tapNotificationsSentToday ?? '0'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">Gate Arrival & Departure SMS</p>
          </div>
        </div>

        {/* Delivery Success Rate */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Delivery Success
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-slate-900">
              {stats ? `${stats.deliverySuccessRate}%` : '100%'}
            </span>
            <p className="text-xs text-slate-500 mt-0.5">
              {stats?.failedToday ? `${stats.failedToday} failed` : '0 delivery errors'}
            </p>
          </div>
        </div>

        {/* BullMQ Queue Health */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              BullMQ Queue Status
            </span>
            <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <div className="flex items-center gap-2">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  stats?.queue?.status === 'PROCESSING'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-emerald-500'
                }`}
              />
              <span className="text-sm font-bold text-slate-800">
                {stats?.queue?.status || 'IDLE'}
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-500">
              {stats?.queue?.completed ?? 0} jobs processed
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-3">
            <span>Wait: {stats?.queue?.waiting ?? 0}</span>
            <span>Active: {stats?.queue?.active ?? 0}</span>
            <span>Fail: {stats?.queue?.failed ?? 0}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-px">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-emerald-600 text-emerald-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              <span>Dispatch Logs & Tap Alerts</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {totalCount}
              </span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('announcements')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
              activeTab === 'announcements'
                ? 'border-emerald-600 text-emerald-600 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Announcements Hub</span>
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-100 text-slate-600 font-bold">
                {announcements.length}
              </span>
            </div>
          </button>
        </div>

        {activeTab === 'notifications' && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1.5 cursor-pointer py-1"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Tab 1: Dispatch Logs & Alerts */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search recipient phone, student name, or message snippet..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <select
                aria-label="Filter by type"
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="">All Notification Types</option>
                <option value="ATTENDANCE_TAP">Gate Tap SMS</option>
                <option value="ANNOUNCEMENT">School Announcement</option>
                <option value="SYSTEM">System Alerts</option>
                <option value="BILLING_ALERT">Billing Alert</option>
              </select>

              <select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>
          </div>

          {/* Notifications Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Channel & Type</th>
                    <th className="py-3 px-4">Alert Title & Content</th>
                    <th className="py-3 px-4">Delivery Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-600 mb-2" />
                        Loading notification logs...
                      </td>
                    </tr>
                  ) : notifications.length > 0 ? (
                    notifications.map((item) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          !item.isRead ? 'bg-emerald-50/20 font-medium' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(item.createdAt).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          <span className="text-slate-400 font-normal">
                            {new Date(item.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-slate-900 font-semibold whitespace-nowrap">
                          {item.recipient}
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              {item.channel}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[10px] font-semibold rounded-full ${
                                item.type === 'ATTENDANCE_TAP'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {item.type.replace('_', ' ')}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-4 max-w-md">
                          <p className="font-semibold text-slate-800 truncate">{item.title}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{item.message}</p>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              item.status === 'DELIVERED'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : item.status === 'FAILED'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/80'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/80'
                            }`}
                          >
                            {item.status === 'DELIVERED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {item.status === 'FAILED' && <XCircle className="w-3 h-3 text-rose-600" />}
                            {item.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                            {item.status}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {!item.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(item.id)}
                              className="text-xs text-slate-400 hover:text-emerald-600 font-semibold cursor-pointer"
                              title="Mark as read"
                            >
                              Mark read
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-300">Read</span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                        No notification records found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="p-3.5 bg-slate-50/50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing page <strong className="text-slate-800">{page}</strong> of{' '}
                <strong className="text-slate-800">{totalPages}</strong> ({totalCount} total records)
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Announcements Hub */}
      {activeTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Active school announcements broadcasted to students, teachers, or parents.
            </p>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Announcement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.length > 0 ? (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-bold text-slate-900 text-sm">{ann.title}</h3>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${
                          ann.priority === 'URGENT'
                            ? 'bg-rose-100 text-rose-700'
                            : ann.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ann.priority}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {ann.audience}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {ann.content}
                  </p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>
                      Posted {new Date(ann.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      Dispatched
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-2 py-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-200/80">
                No school announcements posted yet. Click &quot;Broadcast Announcement&quot; to publish your first bulletin!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Broadcast Announcement Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Broadcast Announcement</h3>
              </div>
              <button
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Schedule Changes for National Sports Fest"
                  value={broadcastForm.title}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bulletin Content
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Detail the announcement details, dates, and instructions for parents & faculty..."
                  value={broadcastForm.content}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, content: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Audience
                  </label>
                  <select
                    value={broadcastForm.audience}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, audience: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="ALL">Everyone (School-Wide)</option>
                    <option value="PARENTS">Parents & Guardians</option>
                    <option value="TEACHERS">Faculty & Staff</option>
                    <option value="STUDENTS">Enrolled Students</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Priority Level
                  </label>
                  <select
                    value={broadcastForm.priority}
                    onChange={(e) => setBroadcastForm({ ...broadcastForm, priority: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="STANDARD">Standard</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent Alert</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Publish & Enqueue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Simulate Tap Alert Modal */}
      {showSimulateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Simulate Gate Tap SMS</h3>
              </div>
              <button
                onClick={() => setShowSimulateModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  required
                  value={simulateForm.studentId}
                  onChange={(e) => setSimulateForm({ ...simulateForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.studentId})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Simulates a physical RFID card swipe at school gates and enqueues parent SMS via BullMQ.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gate Scan Event
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateForm({ ...simulateForm, scanType: 'TIME_IN' })}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer ${
                      simulateForm.scanType === 'TIME_IN'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🟢 TIME IN (Arrival)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateForm({ ...simulateForm, scanType: 'TIME_OUT' })}
                    className={`py-2 text-xs font-semibold rounded-xl border cursor-pointer ${
                      simulateForm.scanType === 'TIME_OUT'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔴 TIME OUT (Departure)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Turnstile Gate Device
                </label>
                <input
                  type="text"
                  value={simulateForm.deviceName}
                  onChange={(e) => setSimulateForm({ ...simulateForm, deviceName: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowSimulateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Radio className="w-3.5 h-3.5" />
                  )}
                  <span>Enqueue Tap Alert</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
