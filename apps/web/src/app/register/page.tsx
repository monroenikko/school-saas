'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  School,
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Building2,
} from 'lucide-react';

export default function RegisterSchoolPage() {
  const { register } = useAuth();
  const [schoolName, setSchoolName] = useState('');
  const [schoolSlug, setSchoolSlug] = useState('');
  const [adminFirstName, setAdminFirstName] = useState('');
  const [adminLastName, setAdminLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchoolNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setSchoolName(name);
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setSchoolSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register({
        schoolName: schoolName.trim(),
        schoolSlug: schoolSlug.trim().toLowerCase(),
        adminFirstName: adminFirstName.trim(),
        adminLastName: adminLastName.trim(),
        adminEmail: adminEmail.trim().toLowerCase(),
        adminPassword,
        phone: phone.trim() || undefined,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to register school. Please check your information.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 p-0.5 shadow-xl shadow-emerald-600/20 mb-4">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <Building2 className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Register Your <span className="text-emerald-600">School</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Start with our 30-day trial — Complete with RFID integration & academic tools
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          {error && (
            <div className="mb-6 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* School Info */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                School Information
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Official School Name</label>
                  <div className="relative">
                    <School className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={handleSchoolNameChange}
                      placeholder="e.g. St. Jude Academy"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Subdomain Slug</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={schoolSlug}
                      onChange={(e) => setSchoolSlug(e.target.value.toLowerCase())}
                      placeholder="st-jude-academy"
                      className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              {schoolSlug && (
                <div className="mt-2 text-[11px] text-slate-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Your portal will be available at:{' '}
                  <span className="text-emerald-700 font-mono font-semibold">
                    {schoolSlug}.schoolsaas.com
                  </span>
                </div>
              )}
            </div>

            {/* School Admin Profile */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Head Administrator Profile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">First Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={adminFirstName}
                      onChange={(e) => setAdminFirstName(e.target.value)}
                      placeholder="Juan"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Last Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={adminLastName}
                      onChange={(e) => setAdminLastName(e.target.value)}
                      placeholder="Dela Cruz"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Official Admin Email</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="principal@school.edu.ph"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-600 mb-1">Contact Phone</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+63 917 123 4567"
                      className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-600 mb-1">Admin Password (Min 8 chars, 1 uppercase, 1 number)</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Provisioning School Platform...</span>
                </>
              ) : (
                <>
                  <span>Create School Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-4"
              >
                Sign in to your portal
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
