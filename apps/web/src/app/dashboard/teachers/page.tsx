'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  UserCheck,
  Search,
  UserPlus,
  Mail,
  Phone,
  BookOpen,
  FolderTree,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  RefreshCw,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface Teacher {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization?: string;
  status: string;
  advisorySections?: {
    id: string;
    name: string;
    gradeLevel: number;
  }[];
  _count?: {
    subjectClasses: number;
  };
  createdAt: string;
}

interface TeacherStats {
  total: number;
  active: number;
  onLeave: number;
}

const DEPARTMENTS = [
  'Mathematics',
  'Science',
  'English',
  'Filipino',
  'Information Technology',
  'Social Studies',
  'Values Education',
  'Physical Education',
];

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stats, setStats] = useState<TeacherStats>({
    total: 0,
    active: 0,
    onLeave: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialization: 'Mathematics',
    status: 'ACTIVE',
  });

  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await api.get<TeacherStats>('/api/teachers/stats');
      if (res?.data) setStats(res.data);
    } catch {
      // Fallback
    }
  }, []);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search.trim()) params.set('search', search.trim());
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (departmentFilter) params.set('specialization', departmentFilter);

      const res = await api.get<Teacher[]>(`/api/teachers?${params.toString()}`);

      if (res?.data) {
        setTeachers(res.data);
        setTotalCount(res.meta?.total || 0);
        setTotalPages(res.meta?.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load teachers:', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, departmentFilter]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTeachers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadTeachers]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setSelectedTeacher(null);
    setFormData({
      employeeId: `TCH-2026-${String(Math.floor(100 + Math.random() * 900))}`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialization: 'Mathematics',
      status: 'ACTIVE',
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (teacher: Teacher) => {
    setIsEditing(true);
    setSelectedTeacher(teacher);
    setFormData({
      employeeId: teacher.employeeId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || '',
      specialization: teacher.specialization || 'General Education',
      status: teacher.status,
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleSaveTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      if (isEditing && selectedTeacher) {
        await api.patch(`/api/teachers/${selectedTeacher.id}`, formData);
      } else {
        await api.post('/api/teachers', formData);
      }
      setIsFormModalOpen(false);
      loadTeachers();
      loadStats();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save faculty profile');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (teacher: Teacher) => {
    if (!confirm(`Deactivate teacher ${teacher.firstName} ${teacher.lastName}?`)) return;

    try {
      await api.delete(`/api/teachers/${teacher.id}`);
      loadTeachers();
      loadStats();
    } catch (err: any) {
      alert(err.message || 'Failed to deactivate teacher');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="w-7 h-7 text-emerald-600" />
            Faculty & Teachers Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage school educators, academic department assignments, and class adviser duties.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Faculty</span>
        </button>
      </div>

      {/* KPI Overview Chips */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Total Faculty</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{stats.total}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">Active Teachers</span>
            <span className="text-2xl font-bold text-emerald-600 mt-1 block">{stats.active}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">On Leave</span>
            <span className="text-2xl font-bold text-amber-600 mt-1 block">{stats.onLeave}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, department..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all text-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <select
            value={departmentFilter}
            onChange={(e) => {
              setDepartmentFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
          >
            <option value="">All Disciplines</option>
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {['ALL', 'ACTIVE', 'ON_LEAVE', 'INACTIVE'].map((st) => (
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
              loadTeachers();
              loadStats();
            }}
            title="Refresh"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Teachers Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Employee ID</th>
                <th className="py-3.5 px-4">Specialization</th>
                <th className="py-3.5 px-4">Advisory Section</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                    <span>Loading faculty records...</span>
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <UserCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-slate-600 font-semibold">No faculty members found</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => {
                  const advisory = teacher.advisorySections?.[0];

                  return (
                    <tr key={teacher.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/60 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                            {teacher.firstName[0]}
                            {teacher.lastName[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block leading-tight">
                              {teacher.firstName} {teacher.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              Faculty Educator
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-700">
                        {teacher.employeeId}
                      </td>

                      {/* Specialization */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/60 text-emerald-800 text-xs font-semibold">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>{teacher.specialization || 'General Subject'}</span>
                        </span>
                      </td>

                      {/* Advisory Section */}
                      <td className="py-3.5 px-4">
                        {advisory ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200/60 text-blue-800 text-xs font-semibold">
                            <FolderTree className="w-3 h-3 text-blue-600" />
                            <span>{advisory.name}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{teacher.email}</span>
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                              <Phone className="w-3 h-3" />
                              <span>{teacher.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            teacher.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : teacher.status === 'ON_LEAVE'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {teacher.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(teacher)}
                            title="Edit Teacher"
                            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivate(teacher)}
                            title="Deactivate Teacher"
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
            Showing <span className="font-bold text-slate-800">{teachers.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> faculty members
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
      {/* MODAL: ADD / EDIT TEACHER                                                */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {isEditing ? 'Edit Faculty Profile' : 'Register New Faculty'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Instructor credentials, department discipline, and institutional contact.
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTeacher} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Employee / Faculty ID *
                </label>
                <input
                  type="text"
                  required
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="teacher@school.edu.ph"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="0917XXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Specialization</label>
                  <select
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="ON_LEAVE">ON_LEAVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {formLoading ? 'Saving...' : isEditing ? 'Update Faculty' : 'Register Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
