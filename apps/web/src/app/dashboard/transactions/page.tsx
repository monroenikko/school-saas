'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  User,
  Phone,
  FileText,
  DollarSign,
  TrendingUp,
  Receipt,
  Copy,
  Check,
  Ban,
  ShieldCheck,
  Building2,
  Calendar,
} from 'lucide-react';
import { PaymentStatus, TransactionType, PaymentMethod } from '@school-saas/shared';

interface Transaction {
  id: string;
  referenceNo: string;
  title: string;
  description: string | null;
  amount: number;
  type: TransactionType;
  status: PaymentStatus;
  paymentMethod: PaymentMethod | null;
  dueDate: string | null;
  paidAt: string | null;
  receiptUrl: string | null;
  remarks: string | null;
  createdAt: string;
  student: {
    id: string;
    studentId: string;
    fullName: string;
    sectionName: string;
    gradeLevel: string;
  } | null;
  parent: {
    id: string;
    fullName: string;
    email: string | null;
    phone: string;
    address?: string | null;
  } | null;
}

interface TransactionStats {
  totalInvoiced: number;
  totalCollected: number;
  pendingReceivables: number;
  totalTransactions: number;
  completedCount: number;
  pendingCount: number;
  overdueCount: number;
  collectionRate: number;
}

interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  guardianName?: string | null;
  guardianPhone?: string | null;
  currentSection?: {
    name: string;
    gradeLevel: number;
  } | null;
}

export default function TransactionsPage() {
  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<TransactionStats>({
    totalInvoiced: 0,
    totalCollected: 0,
    pendingReceivables: 0,
    totalTransactions: 0,
    completedCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    collectionRate: 0,
  });
  const [studentOptions, setStudentOptions] = useState<StudentOption[]>([]);

  // Loading & Feedback
  const [loading, setLoading] = useState(true);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<any | null>(null);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Create Form State
  const [createStudentId, setCreateStudentId] = useState('');
  const [createTitle, setCreateTitle] = useState('');
  const [createType, setCreateType] = useState<TransactionType>(TransactionType.TUITION);
  const [createAmount, setCreateAmount] = useState('');
  const [createDueDate, setCreateDueDate] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  // Pay Form State
  const [payMethod, setPayMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [payReceiptNumber, setPayReceiptNumber] = useState('');
  const [payDate, setPayDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payRemarks, setPayRemarks] = useState('');

  // Load Students for Dropdown
  const loadStudents = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/students?limit=100');
      if (res?.data?.data) {
        setStudentOptions(res.data.data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Load Financial KPIs
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<TransactionStats>('/api/transactions/stats');
      if (res?.data) {
        setStats(res.data);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // Load Invoices Table
  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (search.trim()) params.append('search', search.trim());
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (typeFilter !== 'ALL') params.append('type', typeFilter);

      const res = await api.get<any>(`/api/transactions?${params.toString()}`);
      if (res?.data) {
        setTransactions(res.data.data || []);
        setTotalPages(res.data.meta?.totalPages || 1);
        setTotalRecords(res.data.meta?.total || 0);
      }
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    loadStats();
    loadTransactions();
  }, [loadStats, loadTransactions]);

  // Copy reference number to clipboard
  const handleCopyRef = (refNo: string) => {
    navigator.clipboard.writeText(refNo);
    setCopiedRef(refNo);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Open Create Invoice Modal
  const handleOpenCreateModal = () => {
    setCreateStudentId('');
    setCreateTitle('');
    setCreateType(TransactionType.TUITION);
    setCreateAmount('');
    setCreateDueDate('');
    setCreateDescription('');
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Submit Create Invoice
  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      setFormError('Invoice title is required');
      return;
    }
    const numAmount = parseFloat(createAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid amount greater than ₱0');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      await api.post('/api/transactions', {
        studentId: createStudentId || undefined,
        title: createTitle.trim(),
        type: createType,
        amount: numAmount,
        dueDate: createDueDate || undefined,
        description: createDescription.trim() || undefined,
      });

      setIsCreateModalOpen(false);
      loadTransactions();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to issue transaction invoice');
    } finally {
      setFormLoading(false);
    }
  };

  // Open Record Payment Modal
  const handleOpenPayModal = (txn: Transaction) => {
    setSelectedTxn(txn);
    setPayMethod(PaymentMethod.CASH);
    setPayReceiptNumber(`OR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    setPayDate(new Date().toISOString().split('T')[0]);
    setPayRemarks('');
    setFormError('');
    setIsPayModalOpen(true);
  };

  // Submit Payment Record
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxn) return;

    setFormLoading(true);
    setFormError('');

    try {
      await api.post(`/api/transactions/${selectedTxn.id}/pay`, {
        paymentMethod: payMethod,
        receiptNumber: payReceiptNumber.trim() || undefined,
        paidAt: payDate ? `${payDate}T${new Date().toISOString().split('T')[1]}` : undefined,
        remarks: payRemarks.trim() || undefined,
      });

      setIsPayModalOpen(false);
      loadTransactions();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to record payment');
    } finally {
      setFormLoading(false);
    }
  };

  // Cancel Transaction
  const handleCancelTransaction = async (txn: Transaction) => {
    if (!confirm(`Are you sure you want to void invoice ${txn.referenceNo}?`)) return;

    try {
      await api.delete(`/api/transactions/${txn.id}?remarks=Voided+by+cashier`);
      loadTransactions();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel transaction');
    }
  };

  // Open Official Receipt Modal
  const handleOpenReceiptModal = async (txn: Transaction) => {
    setSelectedTxn(txn);
    setReceiptDetail(null);
    setIsReceiptModalOpen(true);

    try {
      const res = await api.get<any>(`/api/transactions/${txn.id}`);
      if (res?.data) {
        setReceiptDetail(res.data);
      }
    } catch {
      // Fallback to local txn data
      setReceiptDetail(txn);
    }
  };

  // Helper: Format Philippine Currency (₱)
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  // Helper: Format Date
  const formatDate = (isoString: string | null | undefined) => {
    if (!isoString) return '—';
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-7 h-7 text-emerald-600" />
            <span>Parent Billing & Accounts</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Student fee assessments, tuition collection, payment receipts, and accounts receivable tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              loadStats();
              loadTransactions();
            }}
            title="Refresh Table"
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-all shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Invoice</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Collected */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Collected</span>
            <span className="text-xl font-bold text-emerald-600 mt-1 block">
              {formatCurrency(stats.totalCollected)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.completedCount} settled</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Receivables */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Pending Balance</span>
            <span className="text-xl font-bold text-amber-600 mt-1 block">
              {formatCurrency(stats.pendingReceivables)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.pendingCount} unpaid</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Invoiced</span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">
              {formatCurrency(stats.totalInvoiced)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">{stats.totalTransactions} assessments</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Overdue Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Overdue Bills</span>
            <span className="text-2xl font-bold text-rose-600 mt-1 block">
              {stats.overdueCount}
            </span>
            <span className="text-[11px] text-rose-500 mt-0.5 block">Past due date</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Collection Efficiency Rate */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between col-span-2 md:col-span-1">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Collection Rate</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {stats.collectionRate}%
            </span>
            <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${Math.min(100, stats.collectionRate)}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search invoice ref, learner, parent..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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
            <option value={PaymentStatus.PENDING}>Pending / Unpaid</option>
            <option value={PaymentStatus.COMPLETED}>Completed / Paid</option>
            <option value={PaymentStatus.CANCELLED}>Cancelled</option>
          </select>

          {/* Fee Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value={TransactionType.TUITION}>Tuition Fee</option>
            <option value={TransactionType.MISCELLANEOUS}>Miscellaneous</option>
            <option value={TransactionType.BOOKS}>Books & Modules</option>
            <option value={TransactionType.UNIFORM}>Uniform</option>
            <option value={TransactionType.RFID_BADGE}>RFID ID Badge</option>
            <option value={TransactionType.EXAM_FEE}>Exam Fee</option>
          </select>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Invoice Ref</th>
                <th className="py-3 px-4">Learner / Student</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Fee Item & Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span className="text-xs">Loading billing transactions...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-semibold text-slate-700">No billing transactions found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click the "Issue Invoice" button above to assess student fees.
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => {
                  const isPaid = txn.status === PaymentStatus.COMPLETED;
                  const isPending = txn.status === PaymentStatus.PENDING;
                  const isCancelled = txn.status === PaymentStatus.CANCELLED;
                  const isOverdue = isPending && txn.dueDate && new Date(txn.dueDate) < new Date();

                  return (
                    <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Reference No */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900">{txn.referenceNo}</span>
                          <button
                            onClick={() => handleCopyRef(txn.referenceNo)}
                            title="Copy Invoice Ref"
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors"
                          >
                            {copiedRef === txn.referenceNo ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="py-3.5 px-4">
                        {txn.student ? (
                          <div>
                            <span className="font-semibold text-slate-900 block text-xs">
                              {txn.student.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block font-mono">
                              {txn.student.studentId} • {txn.student.sectionName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unlinked Student</span>
                        )}
                      </td>

                      {/* Parent */}
                      <td className="py-3.5 px-4">
                        {txn.parent ? (
                          <div>
                            <span className="font-medium text-slate-800 block text-xs">
                              {txn.parent.fullName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {txn.parent.phone}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">—</span>
                        )}
                      </td>

                      {/* Fee Title & Category */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block text-xs leading-tight">
                          {txn.title}
                        </span>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                          {txn.type.replace('_', ' ')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatCurrency(txn.amount)}
                        </span>
                        {isPaid && txn.paymentMethod && (
                          <span className="block text-[11px] text-emerald-600 font-medium mt-0.5">
                            via {txn.paymentMethod}
                          </span>
                        )}
                      </td>

                      {/* Due Date */}
                      <td className="py-3.5 px-4">
                        <span className={`text-xs block ${isOverdue ? 'font-bold text-rose-600' : 'text-slate-600'}`}>
                          {formatDate(txn.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-500 font-semibold block uppercase">
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPaid && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </span>
                        )}
                        {isPending && (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                                : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            {isOverdue ? 'Overdue' : 'Pending'}
                          </span>
                        )}
                        {isCancelled && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <Ban className="w-3 h-3" />
                            Voided
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <button
                              onClick={() => handleOpenPayModal(txn)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                              title="Record Payment"
                            >
                              Receive Pay
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenReceiptModal(txn)}
                            className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                            title="View Official Receipt (OR)"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          {isPending && (
                            <button
                              onClick={() => handleCancelTransaction(txn)}
                              className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                              title="Void Invoice"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {transactions.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalRecords)} of {totalRecords} invoices
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

      {/* ========================================================================= */}
      {/* MODAL 1: ISSUE INVOICE / FEE ASSESSMENT */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Issue Fee Invoice</h3>
                  <p className="text-xs text-slate-500">Assess tuition, uniform, books, or activity fees</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Student Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Learner / Student (Optional)
                </label>
                <select
                  value={createStudentId}
                  onChange={(e) => setCreateStudentId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                >
                  <option value="">-- Choose student (or leave unassigned) --</option>
                  {studentOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.lastName}, {s.firstName} ({s.studentId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Fee Category & Amount */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Fee Category *
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as TransactionType)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  >
                    <option value={TransactionType.TUITION}>Tuition Fee</option>
                    <option value={TransactionType.MISCELLANEOUS}>Miscellaneous</option>
                    <option value={TransactionType.BOOKS}>Books & Modules</option>
                    <option value={TransactionType.UNIFORM}>Uniform</option>
                    <option value={TransactionType.RFID_BADGE}>RFID ID Badge</option>
                    <option value={TransactionType.EXAM_FEE}>Exam Fee</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Amount (₱ PHP) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="5000.00"
                    value={createAmount}
                    onChange={(e) => setCreateAmount(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>
              </div>

              {/* Invoice Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Invoice Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1st Quarter Tuition Fee AY 2026-2027"
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Due Date
                </label>
                <input
                  type="date"
                  value={createDueDate}
                  onChange={(e) => setCreateDueDate(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                />
              </div>

              {/* Description / Breakdown */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description / Itemized Breakdown
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes laboratory fees, energy fee, and library access."
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
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
                  <span>Create Invoice</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RECORD PAYMENT (CASHIER RECEIVE) */}
      {/* ========================================================================= */}
      {isPayModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Record Payment Settlement</h3>
                  <p className="text-xs text-slate-500">Invoice: {selectedTxn.referenceNo}</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Assessment Summary Card */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Fee Assessment:</span>
                  <span className="font-semibold text-slate-800">{selectedTxn.title}</span>
                </div>
                {selectedTxn.student && (
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Student:</span>
                    <span className="font-semibold text-slate-800">{selectedTxn.student.fullName}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                  <span className="text-sm font-bold text-slate-800">Total Amount Due:</span>
                  <span className="text-lg font-bold text-emerald-600">
                    {formatCurrency(selectedTxn.amount)}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Payment Method / Channel *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: PaymentMethod.CASH, label: 'Cash Window' },
                    { id: PaymentMethod.GCASH, label: 'GCash' },
                    { id: PaymentMethod.MAYA, label: 'Maya' },
                    { id: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer' },
                    { id: PaymentMethod.CREDIT_CARD, label: 'Credit Card' },
                    { id: PaymentMethod.OTHER, label: 'Other / Check' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as PaymentMethod)}
                      className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                        payMethod === m.id
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* OR Number & Payment Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Official Receipt (OR) No.
                  </label>
                  <input
                    type="text"
                    value={payReceiptNumber}
                    onChange={(e) => setPayReceiptNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 cursor-pointer"
                  />
                </div>
              </div>

              {/* Cashier Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cashier Audit Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Received at Cashier 1 by Ms. Maria Santos"
                  value={payRemarks}
                  onChange={(e) => setPayRemarks(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
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
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Confirm Settlement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: OFFICIAL ELECTRONIC RECEIPT (OR) */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && selectedTxn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Actions Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                Official Electronic Receipt Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Receipt Paper Container */}
            <div className="p-8 space-y-6 text-slate-800 bg-white" id="official-receipt">
              {/* Receipt School Header */}
              <div className="text-center pb-4 border-b border-slate-200">
                <h2 className="text-lg font-black text-slate-900 tracking-wide uppercase">
                  {receiptDetail?.tenant?.name || 'St. Jude International Academy'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {receiptDetail?.tenant?.address || '123 Academic Avenue, Quezon City, Metro Manila'}
                </p>
                <p className="text-xs text-slate-400">
                  Tel: {receiptDetail?.tenant?.phone || '+63 2 8123 4567'} • Email: {receiptDetail?.tenant?.email || 'finance@stjude.edu.ph'}
                </p>
                <div className="inline-block mt-3 px-3 py-1 bg-slate-100 rounded-full text-xs font-bold uppercase tracking-widest text-slate-700">
                  Official Electronic Receipt
                </div>
              </div>

              {/* Receipt Metadata Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">OR Number</span>
                  <span className="font-bold text-slate-900 font-mono text-sm">
                    {receiptDetail?.receiptUrl || `OR-${selectedTxn.referenceNo.slice(4)}`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block uppercase tracking-wider text-[10px] font-bold">Transaction Date</span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatDate(receiptDetail?.paidAt || selectedTxn.createdAt)}
                  </span>
                </div>
              </div>

              {/* Payor & Learner Info */}
              <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Received From:</span>
                  <span className="font-bold text-slate-900">
                    {receiptDetail?.parent?.fullName || 'Guardian / Authorized Payor'}
                  </span>
                </div>
                {receiptDetail?.student && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Learner:</span>
                      <span className="font-bold text-slate-900">
                        {receiptDetail.student.fullName} ({receiptDetail.student.studentId})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Section & Grade:</span>
                      <span className="font-medium text-slate-700">
                        {receiptDetail.student.sectionName} • {receiptDetail.student.gradeLevel}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Reference Number:</span>
                  <span className="font-mono text-slate-700">{selectedTxn.referenceNo}</span>
                </div>
              </div>

              {/* Itemized Fee Table */}
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 text-slate-600 font-bold uppercase text-[10px]">
                    <th className="py-2">Description / Particulars</th>
                    <th className="py-2 text-right">Amount (PHP)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="py-3">
                      <strong className="block text-slate-900">{selectedTxn.title}</strong>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        {selectedTxn.description || `Assessment category: ${selectedTxn.type}`}
                      </span>
                    </td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {formatCurrency(selectedTxn.amount)}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-900 font-bold text-sm">
                    <td className="py-3 uppercase">Total Amount Paid:</td>
                    <td className="py-3 text-right text-emerald-700">
                      {formatCurrency(selectedTxn.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>

              {/* Payment Details Footer */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Method</span>
                  <span className="font-bold text-slate-800">
                    {selectedTxn.paymentMethod || 'CASH'}
                  </span>
                </div>

                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    Authorized Cashier
                  </span>
                </div>
              </div>

              {/* Official Verified Stamp */}
              <div className="pt-3 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 italic">
                  This electronic receipt is computer-generated and serves as official proof of payment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
