'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import {
  CalendarCheck,
  Search,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Zap,
  Sliders,
  Users,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Edit2,
  Cpu,
  Sparkles,
  UserCheck,
  MapPin,
  Laptop,
} from 'lucide-react';
import { AttendanceStatus, ScanType, DeviceStatus } from '@school-saas/shared';

interface AttendanceRecord {
  id: string;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: AttendanceStatus;
  remarks: string | null;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    photoUrl: string | null;
    rfidCardUid: string | null;
    sectionName: string;
    gradeLevel: string;
  } | null;
  device: {
    id: string;
    deviceId: string;
    name: string;
    location: string;
  } | null;
}

interface AttendanceStats {
  date: string;
  totalEnrolled: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  totalTappedIn: number;
  notTappedCount: number;
  attendanceRate: number;
}

interface ScanLog {
  id: string;
  cardUid: string;
  deviceId: string;
  scanType: ScanType;
  scannedAt: string;
  processed: boolean;
  errorMessage: string | null;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    photoUrl: string | null;
    sectionName: string;
    gradeLevel: string;
  } | null;
}

interface RfidDevice {
  id: string;
  deviceId: string;
  name: string;
  location: string;
  status: DeviceStatus;
  isOnline: boolean;
  lastHeartbeatAt: string | null;
  totalTaps: number;
  createdAt: string;
}

interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  rfidCardUid?: string | null;
  currentSection?: {
    id: string;
    name: string;
    gradeLevel: number;
  } | null;
}

interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
}

export default function AttendancePage() {
  // Tabs: 'records' | 'stream' | 'devices'
  const [activeTab, setActiveTab] = useState<'records' | 'stream' | 'devices'>('records');

  // Filters & State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sectionFilter, setSectionFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Data states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    date: selectedDate,
    totalEnrolled: 0,
    presentCount: 0,
    lateCount: 0,
    excusedCount: 0,
    totalTappedIn: 0,
    notTappedCount: 0,
    attendanceRate: 0,
  });
  const [recentTaps, setRecentTaps] = useState<ScanLog[]>([]);
  const [devices, setDevices] = useState<RfidDevice[]>([]);
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<SectionOption[]>([]);

  // Loading & Stream toggle
  const [loading, setLoading] = useState(true);
  const [autoRefreshStream, setAutoRefreshStream] = useState(true);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [isTapModalOpen, setIsTapModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Simulation Form State
  const [simulateCardUid, setSimulateCardUid] = useState('');
  const [simulateDeviceId, setSimulateDeviceId] = useState('');
  const [simulateScanType, setSimulateScanType] = useState<string>('AUTO');
  const [lastTapResult, setLastTapResult] = useState<any | null>(null);

  // Manual Attendance Form State
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualDate, setManualDate] = useState(selectedDate);
  const [manualStatus, setManualStatus] = useState<AttendanceStatus>(AttendanceStatus.PRESENT);
  const [manualTimeIn, setManualTimeIn] = useState('');
  const [manualTimeOut, setManualTimeOut] = useState('');
  const [manualRemarks, setManualRemarks] = useState('');

  // Device Form State
  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceLocation, setNewDeviceLocation] = useState('');

  // Load Select options (students and sections)
  const loadOptions = useCallback(async () => {
    try {
      const [studentsRes, sectionsRes] = await Promise.all([
        api.get<any>('/api/students?limit=200'),
        api.get<any>('/api/sections?limit=100'),
      ]);
      if (studentsRes?.data?.data) {
        setStudentOptions(studentsRes.data.data);
      }
      if (sectionsRes?.data?.data) {
        setSectionOptions(sectionsRes.data.data);
      }
    } catch {
      // Non-critical fallback
    }
  }, []);

  // Load KPI stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<AttendanceStats>(`/api/attendance/stats?date=${selectedDate}`);
      if (res?.data) {
        setStats(res.data);
      }
    } catch {
      // Ignore
    }
  }, [selectedDate]);

  // Load Attendance Records
  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (sectionFilter !== 'ALL') params.append('sectionId', sectionFilter);

      const res = await api.get<any>(`/api/attendance?${params.toString()}`);
      if (res?.data?.data) {
        setRecords(res.data.data);
        setTotalPages(res.data.meta.totalPages || 1);
        setTotalRecords(res.data.meta.total || 0);
      }
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, page, limit, search, statusFilter, sectionFilter]);

  // Load Recent Taps (for live stream)
  const loadRecentTaps = useCallback(async () => {
    try {
      const res = await api.get<ScanLog[]>('/api/attendance/recent-taps?limit=20');
      if (res?.data) {
        setRecentTaps(res.data);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Load Devices
  const loadDevices = useCallback(async () => {
    try {
      const res = await api.get<RfidDevice[]>('/api/rfid/devices');
      if (res?.data) {
        setDevices(res.data);
        if (res.data.length > 0 && !simulateDeviceId) {
          setSimulateDeviceId(res.data[0].deviceId);
        }
      }
    } catch {
      // Ignore
    }
  }, [simulateDeviceId]);

  // Initial load
  useEffect(() => {
    loadOptions();
    loadDevices();
  }, [loadOptions, loadDevices]);

  useEffect(() => {
    loadStats();
    loadRecords();
  }, [loadStats, loadRecords]);

  // Live Stream Polling
  useEffect(() => {
    loadRecentTaps();
    if (activeTab === 'stream' && autoRefreshStream) {
      streamIntervalRef.current = setInterval(() => {
        loadRecentTaps();
      }, 4000);
    } else {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    }
    return () => {
      if (streamIntervalRef.current) {
        clearInterval(streamIntervalRef.current);
      }
    };
  }, [activeTab, autoRefreshStream, loadRecentTaps]);

  // Handle Simulate RFID Tap
  const handleSimulateTap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simulateCardUid.trim()) {
      setFormError('Please select a student or enter an RFID Card UID');
      return;
    }
    if (!simulateDeviceId) {
      setFormError('Please select a Gate Turnstile Device');
      return;
    }

    setFormLoading(true);
    setFormError('');
    setLastTapResult(null);

    try {
      const payload: any = {
        cardUid: simulateCardUid.trim(),
        deviceId: simulateDeviceId,
      };
      if (simulateScanType !== 'AUTO') {
        payload.scanType = simulateScanType;
      }

      const res = await api.post<any>('/api/rfid/tap', payload);
      setLastTapResult(res.data);

      // Refresh records and stream
      loadRecords();
      loadStats();
      loadRecentTaps();
      loadDevices();
    } catch (err: any) {
      setFormError(err.message || 'RFID Gate scan rejected');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Manual Attendance Override
  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualStudentId) {
      setFormError('Please select a student');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post('/api/attendance/manual', {
        studentId: manualStudentId,
        date: manualDate,
        status: manualStatus,
        timeIn: manualTimeIn ? `${manualDate}T${manualTimeIn}:00.000Z` : undefined,
        timeOut: manualTimeOut ? `${manualDate}T${manualTimeOut}:00.000Z` : undefined,
        remarks: manualRemarks.trim() || undefined,
      });

      setIsManualModalOpen(false);
      loadRecords();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save attendance record');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Register Turnstile Device
  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceId.trim() || !newDeviceName.trim()) {
      setFormError('Device ID and Friendly Name are required');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post('/api/rfid/devices', {
        deviceId: newDeviceId.trim().toUpperCase(),
        name: newDeviceName.trim(),
        location: newDeviceLocation.trim() || 'Campus Entrance',
        status: DeviceStatus.ACTIVE,
      });

      setNewDeviceId('');
      setNewDeviceName('');
      setNewDeviceLocation('');
      setIsDeviceModalOpen(false);
      loadDevices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register gate turnstile');
    } finally {
      setFormLoading(false);
    }
  };

  // Helper: format timestamp into 12-hr format (e.g. 07:45 AM)
  const formatTime = (isoString: string | null | undefined) => {
    if (!isoString) return '--:--';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Helper: format relative timestamp for live stream
  const formatRelativeTime = (isoString: string) => {
    const d = new Date(isoString);
    const diffSeconds = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diffSeconds < 5) return 'Just now';
    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-emerald-600" />
            <span>RFID Attendance & Turnstile Gate</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time gate turnstile pipeline, automated tap-in/out tracking, and daily attendance logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setFormError('');
              setLastTapResult(null);
              setIsTapModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Simulate RFID Tap</span>
          </button>

          <button
            onClick={() => {
              setManualDate(selectedDate);
              setManualStatus(AttendanceStatus.PRESENT);
              setManualTimeIn('07:30');
              setManualTimeOut('');
              setManualRemarks('');
              setFormError('');
              setIsManualModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer"
          >
            <Edit2 className="w-4 h-4 text-slate-500" />
            <span>Manual Entry</span>
          </button>

          {activeTab === 'devices' && (
            <button
              onClick={() => {
                setNewDeviceId(`TURNSTILE-0${devices.length + 1}`);
                setNewDeviceName('');
                setNewDeviceLocation('');
                setFormError('');
                setIsDeviceModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Turnstile</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Overview Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Enrolled */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Enrolled</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.totalEnrolled}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Present Today</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats.presentCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Late Today */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Late Arrivals</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.lateCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Tapped In */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Gate Taps</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{stats.totalTappedIn}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Attendance Rate</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-bold text-slate-900">{stats.attendanceRate}%</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-1">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'records'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Daily Attendance Logs</span>
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {totalRecords}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('stream')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 relative ${
              activeTab === 'stream'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Gate Stream</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-emerald-50 text-emerald-700 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Live
            </span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'devices'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>RFID Turnstiles</span>
            <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-700">
              {devices.length}
            </span>
          </button>
        </div>

        {/* Global Refresh */}
        <button
          onClick={() => {
            loadStats();
            loadRecords();
            loadRecentTaps();
            loadDevices();
          }}
          title="Refresh All Data"
          className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAILY ATTENDANCE RECORDS */}
      {/* ========================================================================= */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search student, ID, RFID..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
              />
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Date Picker */}
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-semibold text-slate-500">Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value={AttendanceStatus.PRESENT}>Present</option>
                <option value={AttendanceStatus.LATE}>Late</option>
                <option value={AttendanceStatus.EXCUSED}>Excused</option>
                <option value={AttendanceStatus.ABSENT}>Absent</option>
              </select>

              {/* Section Filter */}
              <select
                value={sectionFilter}
                onChange={(e) => {
                  setSectionFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer max-w-[160px]"
              >
                <option value="ALL">All Sections</option>
                {sectionOptions.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.gradeLevel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Section & Grade</th>
                    <th className="py-3 px-4">Time In</th>
                    <th className="py-3 px-4">Time Out</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Gate Turnstile</th>
                    <th className="py-3 px-4">Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                        <span className="text-xs">Loading attendance records...</span>
                      </td>
                    </tr>
                  ) : records.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <CalendarCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-semibold text-slate-700">No attendance logs found for this date</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Simulate an RFID tap or adjust your filters above.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    records.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Student */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-xs shrink-0">
                              {record.student?.fullName?.slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {record.student?.fullName || 'Unknown Student'}
                              </span>
                              <span className="text-xs text-slate-400 block font-mono mt-0.5">
                                {record.student?.studentId}
                                {record.student?.rfidCardUid && (
                                  <span className="ml-1 text-slate-400">• UID: {record.student.rfidCardUid}</span>
                                )}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Section */}
                        <td className="py-3.5 px-4">
                          <span className="font-medium text-slate-800 block text-xs">
                            {record.student?.sectionName || 'Unassigned'}
                          </span>
                          <span className="text-xs text-slate-400 block">
                            {record.student?.gradeLevel || 'N/A'}
                          </span>
                        </td>

                        {/* Time In */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                            <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600" />
                            <span>{formatTime(record.timeIn)}</span>
                          </div>
                        </td>

                        {/* Time Out */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                            <ArrowUpRight className="w-3.5 h-3.5 text-amber-600" />
                            <span>{formatTime(record.timeOut)}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-4">
                          {record.status === AttendanceStatus.PRESENT && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3" />
                              Present
                            </span>
                          )}
                          {record.status === AttendanceStatus.LATE && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <Clock className="w-3 h-3" />
                              Late
                            </span>
                          )}
                          {record.status === AttendanceStatus.EXCUSED && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <ShieldCheck className="w-3 h-3" />
                              Excused
                            </span>
                          )}
                          {record.status === AttendanceStatus.ABSENT && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
                              <AlertCircle className="w-3 h-3" />
                              Absent
                            </span>
                          )}
                        </td>

                        {/* Device Info */}
                        <td className="py-3.5 px-4">
                          <span className="text-xs font-medium text-slate-700 block">
                            {record.device?.name || 'Manual / Gate System'}
                          </span>
                          <span className="text-xs text-slate-400 block font-mono">
                            {record.device?.location || 'Campus Gate'}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="py-3.5 px-4 max-w-[180px] truncate text-xs text-slate-500">
                          {record.remarks || '—'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              if (record.student) {
                                setManualStudentId(record.student.id);
                                setManualDate(selectedDate);
                                setManualStatus(record.status);
                                setManualTimeIn(record.timeIn ? record.timeIn.split('T')[1]?.slice(0, 5) : '07:30');
                                setManualTimeOut(record.timeOut ? record.timeOut.split('T')[1]?.slice(0, 5) : '');
                                setManualRemarks(record.remarks || '');
                                setFormError('');
                                setIsManualModalOpen(true);
                              }
                            }}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Edit / Override Attendance"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {records.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
                {Math.min(page * limit, totalRecords)} of {totalRecords} records
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: LIVE GATE TURNSTILE STREAM */}
      {/* ========================================================================= */}
      {activeTab === 'stream' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                {autoRefreshStream && (
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping absolute inset-0 opacity-75" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Live Turnstile Event Stream</h3>
                <p className="text-xs text-slate-500">
                  Real-time pipeline monitoring hardware turnstile taps across all school lanes.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoRefreshStream}
                  onChange={(e) => setAutoRefreshStream(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500/20"
                />
                <span>Auto-refresh (4s)</span>
              </label>

              <button
                onClick={loadRecentTaps}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Poll Now</span>
              </button>
            </div>
          </div>

          {/* Recent Taps Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {recentTaps.length === 0 ? (
              <div className="col-span-2 py-16 text-center bg-white rounded-2xl border border-slate-200/80">
                <Radio className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No recent tap events recorded</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click the "Simulate RFID Tap" button at the top to fire a turnstile event.
                </p>
              </div>
            ) : (
              recentTaps.map((tap) => {
                const isEntry = tap.scanType === ScanType.TIME_IN;
                return (
                  <div
                    key={tap.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      tap.processed
                        ? isEntry
                          ? 'bg-emerald-50/40 border-emerald-200/70'
                          : 'bg-amber-50/40 border-amber-200/70'
                        : 'bg-rose-50/50 border-rose-200/70'
                    } flex items-start justify-between gap-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          tap.processed
                            ? isEntry
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-amber-500 text-white shadow-xs'
                            : 'bg-rose-500 text-white shadow-xs'
                        }`}
                      >
                        {isEntry ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {tap.student ? tap.student.fullName : 'Unrecognized Card'}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              tap.processed
                                ? isEntry
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {tap.scanType}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 mt-0.5">
                          {tap.student ? (
                            <>
                              Section: <strong className="text-slate-700">{tap.student.sectionName}</strong> • {tap.student.gradeLevel}
                            </>
                          ) : (
                            <span className="text-rose-600">{tap.errorMessage || 'No learner linked'}</span>
                          )}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-2">
                          <span>Card: {tap.cardUid}</span>
                          <span>•</span>
                          <span>Turnstile: {tap.deviceId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold text-slate-600 block">
                        {formatRelativeTime(tap.scannedAt)}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {formatTime(tap.scannedAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: GATE TURNSTILE DEVICES */}
      {/* ========================================================================= */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Cpu className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{device.name}</h4>
                        <span className="text-xs font-mono text-slate-400">{device.deviceId}</span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        device.status === DeviceStatus.ACTIVE
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {device.status}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{device.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Total Scans Recorded: <strong className="text-slate-900">{device.totalTaps}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span>
                    Heartbeat: {device.lastHeartbeatAt ? formatRelativeTime(device.lastHeartbeatAt) : 'Never'}
                  </span>
                  <button
                    onClick={() => {
                      setSimulateDeviceId(device.deviceId);
                      setIsTapModalOpen(true);
                    }}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                  >
                    Simulate Tap →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: SIMULATE RFID TURNSTILE TAP */}
      {/* ========================================================================= */}
      {isTapModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Simulate RFID Gate Tap</h3>
                  <p className="text-xs text-slate-500">
                    Trigger an authentic physical turnstile scan event
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsTapModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateTap} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Turnstile Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Turnstile Device *
                </label>
                <select
                  value={simulateDeviceId}
                  onChange={(e) => setSimulateDeviceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  {devices.map((d) => (
                    <option key={d.id} value={d.deviceId}>
                      {d.name} ({d.deviceId}) — {d.location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Student Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Quick Select Enrolled Learner (with RFID card)
                </label>
                <select
                  onChange={(e) => {
                    const selected = studentOptions.find((s) => s.id === e.target.value);
                    if (selected && selected.rfidCardUid) {
                      setSimulateCardUid(selected.rfidCardUid);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value="">-- Choose a student to auto-fill card UID --</option>
                  {studentOptions
                    .filter((s) => s.rfidCardUid)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.lastName}, {s.firstName} ({s.studentId}) — Card: {s.rfidCardUid}
                      </option>
                    ))}
                </select>
              </div>

              {/* Manual Card UID Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  RFID Card UID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. E28068940000501234A1B2C1 or E2000019"
                  value={simulateCardUid}
                  onChange={(e) => setSimulateCardUid(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              {/* Scan Direction */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Scan Direction
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateScanType('AUTO')}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      simulateScanType === 'AUTO'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Auto-Detect
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateScanType(ScanType.TIME_IN)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      simulateScanType === ScanType.TIME_IN
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    TIME IN (Entry)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateScanType(ScanType.TIME_OUT)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      simulateScanType === ScanType.TIME_OUT
                        ? 'bg-amber-50 border-amber-300 text-amber-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    TIME OUT (Exit)
                  </button>
                </div>
              </div>

              {/* Simulation Result Card */}
              {lastTapResult && (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      GATE TURNSTILE UNLOCKED
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full uppercase">
                      {lastTapResult.scanType}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-slate-900">
                    {lastTapResult.student?.firstName} {lastTapResult.student?.lastName} (ID: {lastTapResult.student?.studentId})
                  </p>
                  <p className="text-xs text-slate-600">
                    Status: <strong className="text-emerald-700">{lastTapResult.attendance?.status}</strong> • Time: {formatTime(lastTapResult.scannedAt)}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Device: {lastTapResult.device?.name} ({lastTapResult.device?.deviceId})
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsTapModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  <span>Tap Turnstile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: MANUAL ATTENDANCE OVERRIDE */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Manual Attendance Entry</h3>
                  <p className="text-xs text-slate-500">Record or adjust learner attendance log</p>
                </div>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Student *
                </label>
                <select
                  value={manualStudentId}
                  onChange={(e) => setManualStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value="">-- Choose student --</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Attendance Date *
                  </label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Attendance Status *
                  </label>
                  <select
                    value={manualStatus}
                    onChange={(e) => setManualStatus(e.target.value as AttendanceStatus)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  >
                    <option value={AttendanceStatus.PRESENT}>Present</option>
                    <option value={AttendanceStatus.LATE}>Late</option>
                    <option value={AttendanceStatus.EXCUSED}>Excused</option>
                    <option value={AttendanceStatus.ABSENT}>Absent</option>
                  </select>
                </div>
              </div>

              {/* Time In & Time Out */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Time In
                  </label>
                  <input
                    type="time"
                    value={manualTimeIn}
                    onChange={(e) => setManualTimeIn(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Time Out
                  </label>
                  <input
                    type="time"
                    value={manualTimeOut}
                    onChange={(e) => setManualTimeOut(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Remarks / Medical Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Excused for Dental Clinic appointment"
                  value={manualRemarks}
                  onChange={(e) => setManualRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserCheck className="w-4 h-4" />
                  )}
                  <span>Save Attendance</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTER NEW GATE TURNSTILE */}
      {/* ========================================================================= */}
      {isDeviceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Register Turnstile Device</h3>
                  <p className="text-xs text-slate-500">Add an RFID gate turnstile reader</p>
                </div>
              </div>
              <button
                onClick={() => setIsDeviceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Hardware Device ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. TURNSTILE-02"
                  value={newDeviceId}
                  onChange={(e) => setNewDeviceId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Friendly Turnstile Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. North Gate Turnstile 2"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Physical Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. North Gate Entrance, Building A"
                  value={newDeviceLocation}
                  onChange={(e) => setNewDeviceLocation(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeviceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Register Device</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
