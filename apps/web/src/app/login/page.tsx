'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  Lock,
  Mail,
  School,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'School Admin',
    email: 'principal@stjude.edu.ph',
    password: 'Password123!',
    slug: 'st-jude-academy',
    schoolName: 'St. Jude Academy',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
  },
  {
    role: 'Teacher',
    email: 'msantos@stjude.edu.ph',
    password: 'Password123!',
    slug: 'st-jude-academy',
    schoolName: 'St. Jude Academy',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  {
    role: 'Super Admin',
    email: 'admin@schoolsaas.com',
    password: 'SuperAdmin123!',
    slug: '',
    schoolName: 'Platform Owner',
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [showSlugInput, setShowSlugInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email.trim(), password, tenantSlug.trim() || undefined);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoFill = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setTenantSlug(acc.slug);
    if (acc.slug) {
      setShowSlugInput(true);
    }
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-100">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 p-0.5 shadow-xl shadow-emerald-600/20 mb-4">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-emerald-600" />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to <span className="text-emerald-600">EdVance</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Cloud School Management & RFID Attendance Platform
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />

          {/* Quick Demo Fill Buttons */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Demo Test Accounts
              </span>
              <span className="text-[11px] text-slate-500 font-medium">1-click fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleDemoFill(acc)}
                  className={`px-2 py-2 rounded-xl text-xs font-medium border text-left transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer ${acc.badgeColor}`}
                >
                  <div className="font-semibold truncate">{acc.role}</div>
                  <div className="text-[10px] opacity-85 truncate">{acc.schoolName}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu.ph"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowSlugInput(!showSlugInput)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors cursor-pointer"
                >
                  {showSlugInput ? '- Hide School ID' : '+ Specify School Slug'}
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                />
              </div>
            </div>

            {showSlugInput && (
              <div className="pt-1">
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  School Identifier / Slug (Optional)
                </label>
                <div className="relative">
                  <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    placeholder="st-jude-academy"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Registration Link */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Want to set up a new school?{' '}
              <Link
                href="/register"
                className="text-emerald-600 hover:text-emerald-700 font-semibold underline underline-offset-4"
              >
                Register your school here
              </Link>
            </p>
          </div>
        </div>

        {/* Security / Feature tags */}
        <div className="flex items-center justify-center gap-4 mt-6 text-[12px] text-slate-500">
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Multi-Tenant Scoped
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Encrypted RFID Bridge
          </span>
        </div>
      </div>
    </div>
  );
}
