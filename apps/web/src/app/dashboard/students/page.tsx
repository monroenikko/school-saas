'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Users,
  Search,
  UserPlus,
  Radio,
  CreditCard,
  ShieldCheck,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Phone,
  Mail,
  GraduationCap,
  RefreshCw,
  QrCode,
  Printer,
} from 'lucide-react';

interface Student {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  birthDate?: string;
  rfidCardUid?: string;
  status: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  currentSection?: {
    id: string;
    name: string;
    gradeLevel: number;
  } | null;
  createdAt: string;
}

interface SectionOption {
  id: string;
  name: string;
  gradeLevel: number;
}

interface StudentStats {
  total: number;
  active: number;
  badged: number;
  unassigned: number;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [stats, setStats] = useState<StudentStats>({
    total: 0,
    active: 0,
    badged: 0,
    unassigned: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sectionFilter, setSectionFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);

  // Selected student for edit / preview
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    middleName: '',
    gender: 'MALE',
    birthDate: '',
    sectionId: '',
    rfidCardUid: '',
    status: 'ACTIVE',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
    emergencyContact: '',
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [rfidInput, setRfidInput] = useState('');

  // Fetch sections for dropdown
  const loadSections = useCallback(async () => {
    try {
      const res = await api.get<SectionOption[]>('/api/students/sections');
      if (res?.data) {
        setSections(res.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch stats
  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<StudentStats>('/api/students/stats');
      if (res?.data) {
        setStats(res.data);
      }
    } catch {
      // Fallback
    }
  }, []);

  // Fetch student roster
  const loadStudents = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', page.toString());
      queryParams.set('limit', '10');
      if (search.trim()) queryParams.set('search', search.trim());
      if (statusFilter !== 'ALL') queryParams.set('status', statusFilter);
      if (sectionFilter) queryParams.set('sectionId', sectionFilter);

      const res = await api.get<Student[]>(`/api/students?${queryParams.toString()}`);

      if (res?.data) {
        setStudents(res.data);
        setTotalCount(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err: any) {
      console.error('Error fetching students:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, sectionFilter]);

  useEffect(() => {
    loadSections();
    loadStats();
  }, [loadSections, loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadStudents();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  const handleOpenEnrollModal = () => {
    setFormData({
      studentId: `2026-${String(Math.floor(1000 + Math.random() * 9000))}`,
      firstName: '',
      lastName: '',
      middleName: '',
      gender: 'MALE',
      birthDate: '2013-06-15',
      sectionId: sections[0]?.id || '',
      rfidCardUid: '',
      status: 'ACTIVE',
      guardianName: '',
      guardianEmail: '',
      guardianPhone: '',
      emergencyContact: '',
    });
    setFormError('');
    setIsEnrollModalOpen(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName || '',
      gender: student.gender || 'MALE',
      birthDate: student.birthDate ? student.birthDate.split('T')[0] : '',
      sectionId: student.currentSection?.id || '',
      rfidCardUid: student.rfidCardUid || '',
      status: student.status,
      guardianName: student.guardianName || '',
      guardianEmail: student.guardianEmail || '',
      guardianPhone: student.guardianPhone || '',
      emergencyContact: student.emergencyContact || '',
    });
    setFormError('');
    setIsEditModalOpen(true);
  };

  const handleOpenBadgeModal = (student: Student) => {
    setSelectedStudent(student);
    setIsBadgeModalOpen(true);
  };

  const handleOpenRfidModal = (student: Student) => {
    setSelectedStudent(student);
    setRfidInput(student.rfidCardUid || '');
    setFormError('');
    setIsRfidModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (isEditModalOpen && selectedStudent) {
        await api.patch(`/api/students/${selectedStudent.id}`, formData);
      } else {
        await api.post('/api/students', formData);
      }
      setIsEnrollModalOpen(false);
      setIsEditModalOpen(false);
      loadStudents();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save student profile');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveRfid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !rfidInput.trim()) return;
    setFormLoading(true);
    setFormError('');

    try {
      await api.patch(`/api/students/${selectedStudent.id}/rfid`, {
        rfidCardUid: rfidInput.trim(),
      });
      setIsRfidModalOpen(false);
      loadStudents();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to assign RFID badge');
    } finally {
      setFormLoading(false);
    }
  };

  const handleArchiveStudent = async (student: Student) => {
    if (!confirm(`Are you sure you want to archive student ${student.firstName} ${student.lastName}?`)) return;

    try {
      await api.delete(`/api/students/${student.id}`);
      loadStudents();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to archive student');
    }
  };

  const generateRandomRfid = () => {
    const hex = '0123456789ABCDEF';
    let uid = 'E280';
    for (let i = 0; i < 16; i++) {
      uid += hex.charAt(Math.floor(Math.random() * hex.length));
    }
    return uid;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-emerald-600" />
            Students Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage enrolled learners, section placements, guardian records, and RFID turnstile badges.
          </p>
        </div>

        <button
          onClick={handleOpenEnrollModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Enroll New Student</span>
        </button>
      </div>

      {/* KPI Overview Chips */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Enrolled</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Active Learners</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats.active}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">RFID Badged</span>
            <span className="text-2xl font-bold text-blue-600 mt-1 block">{stats.badged}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Radio className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Pending RFID</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.unassigned}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, student ID, RFID..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Section Filter */}
          <select
            value={sectionFilter}
            onChange={(e) => {
              setSectionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'ACTIVE', 'INACTIVE', 'DROPPED'].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              loadStudents();
              loadStats();
            }}
            title="Refresh List"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Student ID / LRN</th>
                <th className="py-3.5 px-4">Grade & Section</th>
                <th className="py-3.5 px-4">RFID Badge UID</th>
                <th className="py-3.5 px-4">Guardian Contact</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading student records...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-600 font-semibold">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {search ? 'Try clearing your search query' : 'Enroll a new student to get started'}
                    </p>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const hasRfid = Boolean(student.rfidCardUid);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Initials */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {student.firstName} {student.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {student.gender || 'Learner'} {student.middleName ? `• ${student.middleName}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Student ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                        {student.studentId}
                      </td>

                      {/* Grade & Section */}
                      <td className="py-3.5 px-4">
                        {student.currentSection ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 font-semibold text-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {student.currentSection.name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* RFID Badge UID */}
                      <td className="py-3.5 px-4">
                        {hasRfid ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-mono font-medium">
                            <Radio className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{student.rfidCardUid?.slice(0, 8)}...</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenRfidModal(student)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold border border-amber-200/60 transition-colors cursor-pointer"
                          >
                            <CreditCard className="w-3 h-3 text-amber-600" />
                            <span>Issue RFID</span>
                          </button>
                        )}
                      </td>

                      {/* Guardian Info */}
                      <td className="py-3.5 px-4">
                        {student.guardianName ? (
                          <div className="text-xs leading-tight">
                            <span className="font-medium text-slate-800 block">{student.guardianName}</span>
                            {student.guardianPhone && (
                              <span className="text-slate-400 font-mono text-[11px] block mt-0.5">
                                {student.guardianPhone}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None listed</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            student.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : student.status === 'TRANSFERRED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenBadgeModal(student)}
                            title="View Digital ID Card"
                            className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenRfidModal(student)}
                            title="Configure RFID Badge"
                            className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Radio className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(student)}
                            title="Edit Student Profile"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleArchiveStudent(student)}
                            title="Archive Record"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{students.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> students
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Previous
            </button>
            <span className="px-2 font-bold text-slate-700">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: ENROLL / EDIT STUDENT MODAL                                     */}
      {/* ========================================================================= */}
      {(isEnrollModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditModalOpen ? 'Edit Student Profile' : 'Enroll New Student'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete official learner information, section assignment, and RFID credentials.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsEnrollModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveStudent} className="p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  1. Learner Identity
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Student ID / LRN *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.studentId}
                      onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                    <input
                      type="text"
                      value={formData.middleName}
                      onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Section & RFID Assignment */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  2. Academic Section & RFID Turnstile Card
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Section</label>
                    <select
                      value={formData.sectionId}
                      onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    >
                      <option value="">-- Select Section --</option>
                      {sections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} (Grade {s.gradeLevel})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700">RFID Badge UID</label>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, rfidCardUid: generateRandomRfid() })}
                        className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Generate Demo UID</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="e.g. E28068940000501234A1B2C1"
                      value={formData.rfidCardUid}
                      onChange={(e) => setFormData({ ...formData, rfidCardUid: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Guardian Details */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  3. Parent / Guardian Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Full Name</label>
                    <input
                      type="text"
                      value={formData.guardianName}
                      onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Guardian Phone (SMS)</label>
                    <input
                      type="text"
                      placeholder="0917XXXXXXX"
                      value={formData.guardianPhone}
                      onChange={(e) => setFormData({ ...formData, guardianPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Form Footer */}
              <div className="pt-4 border-t border-slate-200/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnrollModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : isEditModalOpen ? 'Update Profile' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: DIGITAL STUDENT ID BADGE PREVIEW                                */}
      {/* ========================================================================= */}
      {isBadgeModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Digital Student ID Card
              </span>
              <button
                onClick={() => setIsBadgeModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badge Card Container */}
            <div className="p-6 bg-slate-100 flex items-center justify-center">
              <div className="w-72 rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden text-center flex flex-col relative">
                {/* Lanyard Clip Slot */}
                <div className="w-10 h-2 rounded-full bg-slate-200 mx-auto mt-2.5 mb-1" />

                {/* School Top Banner */}
                <div className="bg-emerald-700 text-white py-3 px-2">
                  <span className="text-[10px] tracking-wider uppercase font-bold block opacity-80">
                    Republic of the Philippines
                  </span>
                  <span className="text-xs font-black tracking-tight block uppercase mt-0.5">
                    St. Jude International Academy
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-200 block">
                    Basic Education Department
                  </span>
                </div>

                {/* Student Photo & Details */}
                <div className="p-4 flex-1 flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl bg-emerald-50 border-3 border-emerald-600 text-emerald-700 font-bold text-2xl flex items-center justify-center shadow-md my-2">
                    {selectedStudent.firstName[0]}
                    {selectedStudent.lastName[0]}
                  </div>

                  <h4 className="font-extrabold text-slate-900 text-base tracking-tight whitespace-nowrap mt-1">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h4>

                  <span className="inline-block px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs mt-1">
                    {selectedStudent.currentSection?.name || 'Enrolled Student'}
                  </span>

                  <div className="mt-3 w-full bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-left space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">LRN / ID:</span>
                      <span className="font-mono font-bold text-slate-800">{selectedStudent.studentId}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">RFID Tag:</span>
                      <span className="font-mono text-emerald-700 font-bold">
                        {selectedStudent.rfidCardUid ? `${selectedStudent.rfidCardUid.slice(0, 10)}...` : 'Not Issued'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-medium">Guardian:</span>
                      <span className="text-slate-800 font-semibold truncate max-w-[120px]">
                        {selectedStudent.guardianName || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Simulated Barcode / QR strip */}
                  <div className="mt-3 flex items-center justify-between w-full px-2">
                    <QrCode className="w-8 h-8 text-slate-700" />
                    <div className="h-6 flex-1 mx-3 flex items-center justify-center bg-slate-900 rounded-sm">
                      <span className="text-[8px] font-mono text-white tracking-widest uppercase">
                        {selectedStudent.studentId}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="bg-slate-50 py-1.5 px-3 border-t border-slate-200 text-[9px] text-slate-400">
                  School Year 2026-2027 • Official Student Identity Badge
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 bg-white flex items-center justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Card</span>
              </button>
              <button
                onClick={() => setIsBadgeModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK RFID CARD ASSIGNMENT                                      */}
      {/* ========================================================================= */}
      {isRfidModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Assign Turnstile RFID Badge</h4>
                  <p className="text-[11px] text-slate-500">
                    For: {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRfidModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRfid} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Card UID (Hexadecimal)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Scan on USB reader or enter UID"
                  value={rfidInput}
                  onChange={(e) => setRfidInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
                />
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200/60 flex items-start gap-2 text-xs text-blue-800">
                <Radio className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  Hold physical RFID badge to USB turnstile reader, or tap <strong>Simulate UID</strong> below for instant test.
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setRfidInput(generateRandomRfid())}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simulate Card Scan</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRfidModalOpen(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {formLoading ? 'Linking...' : 'Link Badge'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
