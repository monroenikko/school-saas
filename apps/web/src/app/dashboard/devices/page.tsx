'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Radio,
  Cpu,
  Plus,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { DeviceStatus } from '@school-saas/shared';
import Link from 'next/link';

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

export default function DevicesPage() {
  const [devices, setDevices] = useState<RfidDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const [newDeviceId, setNewDeviceId] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceLocation, setNewDeviceLocation] = useState('');

  const loadDevices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<RfidDevice[]>('/api/rfid/devices');
      if (res?.data) {
        setDevices(res.data);
      }
    } catch {
      setDevices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

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
        location: newDeviceLocation.trim() || 'Main Gate',
        status: DeviceStatus.ACTIVE,
      });

      setNewDeviceId('');
      setNewDeviceName('');
      setNewDeviceLocation('');
      setIsModalOpen(false);
      loadDevices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to register gate turnstile');
    } finally {
      setFormLoading(false);
    }
  };

  const formatRelativeTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-emerald-600" />
            <span>RFID Gate Devices & Turnstiles</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure turnstile hardware readers, monitor device telemetry, and track real-time gate activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/dashboard/attendance"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer"
          >
            <span>View Live Attendance</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={() => {
              setNewDeviceId(`TURNSTILE-0${devices.length + 1}`);
              setNewDeviceName('');
              setNewDeviceLocation('');
              setFormError('');
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Turnstile</span>
          </button>
        </div>
      </div>

      {/* Device Cards Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-2" />
          <span className="text-xs text-slate-500">Loading registered gate devices...</span>
        </div>
      ) : devices.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/80 shadow-xs">
          <Cpu className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">No Gate Devices Registered</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Register your first physical turnstile device or RFID gate antenna to begin tracking student entry and exit logs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                      <Cpu className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{device.name}</h4>
                      <span className="text-xs font-mono text-slate-400">{device.deviceId}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
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
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    <span>Last Heartbeat: {formatRelativeTime(device.lastHeartbeatAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400">Created {new Date(device.createdAt).toLocaleDateString()}</span>
                <Link
                  href="/dashboard/attendance"
                  className="font-semibold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                >
                  View Gate Stream →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Register Turnstile */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Register Turnstile Device</h3>
                  <p className="text-xs text-slate-500">Add an RFID gate turnstile reader</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
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
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
