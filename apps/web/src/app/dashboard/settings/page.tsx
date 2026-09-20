'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Settings,
  Building2,
  Radio,
  ShieldCheck,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Globe,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Lock,
  Sparkles,
  Users,
} from 'lucide-react';

interface SchoolSettingsData {
  id: string;
  name: string;
  slug: string;
  domain: string;
  plan: string;
  status: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  timezone: string;
  logoUrl: string | null;
  currentAcademicYear?: {
    name: string;
    currentTerm: string;
  } | null;
  rfidPolicy: {
    lateCutoffTime: string;
    afternoonExitStartTime: string;
    debounceSeconds: number;
    autoSmsAlerts: boolean;
  };
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'rfid' | 'roles'>('profile');
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Form States
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [timezone, setTimezone] = useState('Asia/Manila');
  const [currency, setCurrency] = useState('PHP');
  const [lateCutoffTime, setLateCutoffTime] = useState('08:00');
  const [slug, setSlug] = useState('');
  const [plan, setPlan] = useState('ENTERPRISE');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<SchoolSettingsData>('/api/settings');
      if (res?.data) {
        const d = res.data;
        setName(d.name || '');
        setAddress(d.address || '');
        setPhone(d.phone || '');
        setEmail(d.email || '');
        setTimezone(d.timezone || 'Asia/Manila');
        setCurrency(d.currency || 'PHP');
        setSlug(d.slug || '');
        setPlan(d.plan || 'ENTERPRISE');
        if (d.rfidPolicy?.lateCutoffTime) {
          setLateCutoffTime(d.rfidPolicy.lateCutoffTime);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load school settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await api.patch('/api/settings', {
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        email: email.trim(),
        timezone,
        currency,
        lateCutoffTime,
      });

      setSuccessMessage('School settings and attendance policies saved successfully.');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update school settings');
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Settings className="w-7 h-7 text-emerald-600" />
            <span>School Settings & Configuration</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure institutional profile, turnstile attendance policies, and security permissions.
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          disabled={saveLoading || loading}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
        >
          {saveLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>Save Changes</span>
        </button>
      </div>

      {/* Notifications Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tabs Switcher */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Institutional Profile</span>
        </button>

        <button
          onClick={() => setActiveTab('rfid')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'rfid'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>RFID Gate Policies</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Role Permissions Matrix</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <span className="text-xs text-slate-500">Loading school configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSaveSettings}>
          {/* ========================================================================= */}
          {/* TAB 1: INSTITUTIONAL PROFILE */}
          {/* ========================================================================= */}
          {activeTab === 'profile' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Campus Branding & Identity</h3>
                  <p className="text-xs text-slate-500">Official institution details displayed on receipts and forms</p>
                </div>
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-200">
                  {plan} Plan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official School Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Domain / Slug (Tenant ID)</label>
                  <input
                    type="text"
                    disabled
                    value={`${slug}.schoolsaas.com`}
                    className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 font-mono cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Official Administrative Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Trunkline / Contact Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Physical Campus Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Billing Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  >
                    <option value="PHP">Philippine Peso (₱ PHP)</option>
                    <option value="USD">US Dollar ($ USD)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">System Timezone</label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  >
                    <option value="Asia/Manila">Asia/Manila (UTC+8)</option>
                    <option value="Asia/Singapore">Asia/Singapore (UTC+8)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: RFID GATE POLICIES */}
          {/* ========================================================================= */}
          {activeTab === 'rfid' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Gate Turnstile Timing & Attendance Policy</h3>
                <p className="text-xs text-slate-500">Rules applied to turnstile scans and automated alert triggers</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-emerald-600" />
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">Late Arrival Cutoff Time</label>
                      <span className="text-[11px] text-slate-500 block">
                        Morning taps after this timestamp will be stamped as LATE
                      </span>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={lateCutoffTime}
                    onChange={(e) => setLateCutoffTime(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  />
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Radio className="w-5 h-5 text-blue-600" />
                    <div>
                      <label className="text-xs font-bold text-slate-900 block">Tap Debounce Window</label>
                      <span className="text-[11px] text-slate-500 block">
                        Prevents duplicate scans if student double-taps the reader
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 bg-white px-3 py-2 border border-slate-200 rounded-xl">
                    <span>60 Seconds</span>
                    <span className="text-xs text-slate-400 font-normal">(Hardware default)</span>
                  </div>
                </div>

                <div className="md:col-span-2 p-4 bg-emerald-50/50 border border-emerald-200/80 rounded-xl flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Real-Time Parent SMS Gate Notifications</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      When learners tap in or tap out at physical turnstiles, automated SMS alert jobs are queued
                      to notify registered parents and emergency contacts immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: ROLE PERMISSIONS MATRIX */}
          {/* ========================================================================= */}
          {activeTab === 'roles' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="pb-4 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h3>
                <p className="text-xs text-slate-500">Security permissions granted to each user role across the platform</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 font-bold text-slate-700">
                      <th className="py-3 px-3">Module Feature</th>
                      <th className="py-3 px-3 text-center">Super Admin</th>
                      <th className="py-3 px-3 text-center">School Admin</th>
                      <th className="py-3 px-3 text-center">Faculty Teacher</th>
                      <th className="py-3 px-3 text-center">Support Staff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[
                      { module: 'Learner Students Directory', sa: true, admin: true, teacher: 'Read-only', staff: true },
                      { module: 'Faculty & Teachers Management', sa: true, admin: true, teacher: 'Own Profile', staff: 'Read-only' },
                      { module: 'Sections & Schedules', sa: true, admin: true, teacher: 'Advisory', staff: 'Read-only' },
                      { module: 'Quarterly Grading Matrix & Report Cards', sa: true, admin: true, teacher: true, staff: false },
                      { module: 'RFID Gate Readers & Turnstiles', sa: true, admin: true, teacher: false, staff: 'Read-only' },
                      { module: 'Live Attendance Monitoring', sa: true, admin: true, teacher: 'Own Sections', staff: true },
                      { module: 'Parent Billing & Fee Invoices', sa: true, admin: true, teacher: false, staff: true },
                      { module: 'Staff Accounts & RBAC Provisioning', sa: true, admin: true, teacher: false, staff: false },
                      { module: 'School Profile & Cutoff Settings', sa: true, admin: true, teacher: false, staff: false },
                    ].map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-3 font-semibold text-slate-800">{row.module}</td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {typeof row.teacher === 'boolean' ? (
                            row.teacher ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )
                          ) : (
                            row.teacher
                          )}
                        </td>
                        <td className="py-3 px-3 text-center text-slate-600 font-medium">
                          {typeof row.staff === 'boolean' ? (
                            row.staff ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                            ) : (
                              <span className="text-slate-300">—</span>
                            )
                          ) : (
                            row.staff
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
