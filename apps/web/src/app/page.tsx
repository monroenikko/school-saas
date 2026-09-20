import Link from 'next/link';
import {
  GraduationCap,
  Radio,
  ShieldCheck,
  Users,
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <header className="border-b border-slate-200/90 bg-white/90 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 p-0.5 shadow-md shadow-emerald-600/20">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
              </div>
            </div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">EdVance</span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              Register School
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> Next-Generation School Management & RFID OS
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Empower Your Campus with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700">
              Real-Time RFID Attendance
            </span>{' '}
            & Academic Tools
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A multi-tenant cloud platform built for modern schools. Seamlessly manage student rosters, class terms, gradebooks, parent billing, and automated RFID gate turnstiles.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xl shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Sign In to School Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/register"
              className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-semibold text-sm border border-slate-300 transition-all flex items-center justify-center gap-2"
            >
              <span>Start Free School Trial</span>
            </Link>
          </div>

          {/* Highlights */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Multi-Tenant School Isolation
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Offline Windows RFID Agent
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Parent Portal & Billing
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Instant SMS / Email Alerts
            </span>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="py-16 bg-white border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">RFID Tap Attendance</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connects directly to your school turnstiles via our Windows Desktop Agent. Sub-second card scans with offline tap buffering.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Academic Terms & Offerings</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Flexible class term scheduling with multiple term selections, teacher faculty assignments, and section student rosters.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Parent Billing & Transactions</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track tuition installments, smart card badge fees, and receipts with GCASH, Maya, and cash payment records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 border-t border-slate-200 text-center text-xs text-slate-500 bg-white">
        <p>© {new Date().getFullYear()} EdVance School SaaS. All rights reserved.</p>
      </footer>
    </div>
  );
}
