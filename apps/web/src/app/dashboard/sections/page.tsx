'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  Layers,
  Search,
  Plus,
  Users,
  GraduationCap,
  DoorOpen,
  Edit2,
  Trash2,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  UserMinus,
  Sparkles,
  BookOpen,
  RefreshCw,
  Percent,
} from 'lucide-react';

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  specialization?: string;
}

interface SectionStudentItem {
  id: string;
  studentId: string;
  status: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    gender?: string;
    rfidCardUid?: string;
    status: string;
  };
}

interface SectionItem {
  id: string;
  name: string;
  gradeLevel: string;
  room?: string;
  capacity: number;
  adviserId?: string;
  adviser?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
  studentCount: number;
  classCount: number;
  students?: SectionStudentItem[];
  createdAt: string;
}

interface AvailableStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  status: string;
  currentSection?: {
    name: string;
  } | null;
}

const GRADE_LEVELS = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export default function SectionsPage() {
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [stats, setStats] = useState({
    totalSections: 0,
    totalStudents: 0,
    averageClassSize: 0,
    utilizationRate: 0,
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SectionItem | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    gradeLevel: 'Grade 7',
    room: '',
    capacity: 45,
    adviserId: '',
  });

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load teachers for adviser dropdown
  const fetchTeachers = useCallback(async () => {
    try {
      const res = await api.get<TeacherOption[]>('/api/teachers?limit=100');
      if (res.success && res.data) {
        setTeachers(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch sections stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get<any>('/api/sections/stats');
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch sections list
  const fetchSections = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/api/sections?limit=50`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (gradeFilter) query += `&gradeLevel=${encodeURIComponent(gradeFilter)}`;

      const res = await api.get<SectionItem[]>(query);
      if (res.success && res.data) {
        setSections(res.data);
      }
    } catch (err: any) {
      console.error('Error loading sections:', err);
    } finally {
      setLoading(false);
    }
  }, [search, gradeFilter]);

  // Load roster details
  const openRoster = async (section: SectionItem) => {
    try {
      const res = await api.get<SectionItem>(`/api/sections/${section.id}`);
      if (res.success && res.data) {
        setSelectedSection(res.data);
        setIsRosterModalOpen(true);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load section students');
    }
  };

  // Open assign students modal
  const openAssignStudentsModal = async () => {
    try {
      const res = await api.get<AvailableStudent[]>('/api/students?limit=100&status=ACTIVE');
      if (res.success && res.data) {
        // filter out students already enrolled in this section
        const currentEnrolledIds = new Set(
          selectedSection?.students?.map((s) => s.student.id) || [],
        );
        setAvailableStudents(res.data.filter((s) => !currentEnrolledIds.has(s.id)));
        setSelectedStudentIds([]);
        setIsAssignModalOpen(true);
      }
    } catch (err: any) {
      setErrorMsg('Failed to load available students');
    }
  };

  useEffect(() => {
    fetchSections();
    fetchStats();
    fetchTeachers();
  }, [fetchSections, fetchStats, fetchTeachers]);

  // Handle Create Section
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel,
        capacity: Number(formData.capacity) || 45,
      };
      if (formData.room.trim()) payload.room = formData.room.trim();
      if (formData.adviserId) payload.adviserId = formData.adviserId;

      const res = await api.post<SectionItem>('/api/sections', payload);
      if (res.success) {
        setSuccessMsg(`Section "${formData.name}" created successfully!`);
        setIsCreateModalOpen(false);
        setFormData({
          name: '',
          gradeLevel: 'Grade 7',
          room: '',
          capacity: 45,
          adviserId: '',
        });
        fetchSections();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to create section');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while creating section');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Edit Section
  const openEditModal = (section: SectionItem) => {
    setSelectedSection(section);
    setFormData({
      name: section.name,
      gradeLevel: section.gradeLevel,
      room: section.room || '',
      capacity: section.capacity,
      adviserId: section.adviserId || '',
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSection) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: any = {
        name: formData.name.trim(),
        gradeLevel: formData.gradeLevel,
        capacity: Number(formData.capacity) || 45,
        room: formData.room.trim() || null,
        adviserId: formData.adviserId || null,
      };

      const res = await api.patch<SectionItem>(`/api/sections/${selectedSection.id}`, payload);
      if (res.success) {
        setSuccessMsg(`Section "${formData.name}" updated successfully!`);
        setIsEditModalOpen(false);
        fetchSections();
      } else {
        setErrorMsg(res.message || 'Failed to update section');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating section');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Section
  const handleDeleteSection = async (section: SectionItem) => {
    if (!confirm(`Are you sure you want to delete section "${section.name}"?`)) return;
    try {
      const res = await api.delete(`/api/sections/${section.id}`);
      if (res.success) {
        setSuccessMsg(`Section "${section.name}" deleted successfully.`);
        fetchSections();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to delete section');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to delete section');
    }
  };

  // Handle Assign Students
  const handleAssignStudents = async () => {
    if (!selectedSection || selectedStudentIds.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/api/sections/${selectedSection.id}/students`, {
        studentIds: selectedStudentIds,
      });
      if (res.success) {
        setSuccessMsg(`Assigned ${selectedStudentIds.length} student(s) to section!`);
        setIsAssignModalOpen(false);
        // refresh roster
        openRoster(selectedSection);
        fetchSections();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to assign students');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error assigning students');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Remove Student from Section
  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!selectedSection) return;
    if (!confirm(`Remove ${studentName} from this section?`)) return;
    try {
      const res = await api.delete(
        `/api/sections/${selectedSection.id}/students/${studentId}`,
      );
      if (res.success) {
        setSuccessMsg(`Removed ${studentName} from section.`);
        openRoster(selectedSection);
        fetchSections();
        fetchStats();
      } else {
        setErrorMsg(res.message || 'Failed to remove student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing student');
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-600" />
            Sections
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage classroom sections, advisory faculty, and student capacity.
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              name: '',
              gradeLevel: 'Grade 7',
              room: '',
              capacity: 45,
              adviserId: '',
            });
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalSections || sections.length}</div>
            <div className="text-xs font-medium text-slate-500">Total Sections</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
            <div className="text-xs font-medium text-slate-500">Assigned Students</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.averageClassSize}</div>
            <div className="text-xs font-medium text-slate-500">Avg Section Size</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-900">{stats.utilizationRate}%</div>
            <div className="text-xs font-medium text-slate-500">Capacity Utilization</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search section name or room..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Grade Levels</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              fetchSections();
              fetchStats();
            }}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sections Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
          Loading sections...
        </div>
      ) : sections.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="font-medium text-slate-700">No sections found</p>
          <p className="text-sm text-slate-400 mt-1">
            {search || gradeFilter ? 'Try adjusting your filters.' : 'Get started by creating your first section.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sections.map((sec) => {
            const utilization = Math.round(((sec.studentCount || 0) / (sec.capacity || 45)) * 100);
            return (
              <div
                key={sec.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/50 mb-1.5">
                        {sec.gradeLevel}
                      </span>
                      <h3 className="text-lg font-bold text-slate-900">{sec.name}</h3>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(sec)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                        title="Edit Section"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSection(sec)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition"
                        title="Delete Section"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Room & Adviser Info */}
                  <div className="mt-4 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <DoorOpen className="w-4 h-4 text-slate-400" />
                      <span>{sec.room ? `Classroom: ${sec.room}` : 'No classroom designated'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-slate-400" />
                      <span>
                        Adviser:{' '}
                        <strong className="text-slate-800">
                          {sec.adviser
                            ? `${sec.adviser.firstName} ${sec.adviser.lastName}`
                            : 'No Adviser Assigned'}
                        </strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span>{sec.classCount} Subject Classes</span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5">
                      <span className="font-medium">
                        Students: <strong>{sec.studentCount}</strong> / {sec.capacity}
                      </span>
                      <span
                        className={`font-semibold ${
                          utilization > 95
                            ? 'text-rose-600'
                            : utilization > 80
                            ? 'text-amber-600'
                            : 'text-emerald-600'
                        }`}
                      >
                        {utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          utilization > 95
                            ? 'bg-rose-500'
                            : utilization > 80
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Action */}
                <div className="mt-5 pt-3">
                  <button
                    onClick={() => openRoster(sec)}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition flex items-center justify-center gap-1.5"
                  >
                    <Users className="w-3.5 h-3.5" />
                    View Students ({sec.studentCount})
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE SECTION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add New Section</h2>
                  <p className="text-xs text-slate-500">Create a classroom section for an academic level</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diamond, Rizal, St. Peter"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classroom / Laboratory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 201, Building B"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Adviser (Faculty)
                </label>
                <select
                  value={formData.adviserId}
                  onChange={(e) => setFormData({ ...formData, adviserId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Select Faculty Adviser (Optional) --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SECTION MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Edit Section</h2>
                <p className="text-xs text-slate-500">Update classroom, capacity, or adviser assignment</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Grade Level *
                  </label>
                  <select
                    value={formData.gradeLevel}
                    onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {GRADE_LEVELS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Classroom / Laboratory
                </label>
                <input
                  type="text"
                  placeholder="e.g. Room 201"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Class Adviser (Faculty)
                </label>
                <select
                  value={formData.adviserId}
                  onChange={(e) => setFormData({ ...formData, adviserId: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- No Adviser Assigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECTION ROSTER DRAWER / MODAL */}
      {isRosterModalOpen && selectedSection && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between animate-in slide-in-from-right">
            <div>
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {selectedSection.gradeLevel}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900">{selectedSection.name}</h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Enrolled Students: {selectedSection.students?.length || 0} / {selectedSection.capacity}
                  </p>
                </div>
                <button
                  onClick={() => setIsRosterModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Students Actions */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <div className="text-xs font-semibold text-slate-600">Active Student List</div>
                <button
                  onClick={openAssignStudentsModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium rounded-xl shadow-xs transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Assign Students
                </button>
              </div>

              {/* Students List */}
              <div className="mt-4 max-h-[60vh] overflow-y-auto divide-y divide-slate-100 pr-1">
                {(!selectedSection.students || selectedSection.students.length === 0) ? (
                  <div className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-medium">No students enrolled yet</p>
                    <p className="text-xs mt-0.5">Click &quot;Assign Students&quot; to add students to this section.</p>
                  </div>
                ) : (
                  selectedSection.students.map((item) => (
                    <div
                      key={item.id}
                      className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center text-xs">
                          {item.student.firstName[0]}
                          {item.student.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800">
                            {item.student.lastName}, {item.student.firstName}
                          </div>
                          <div className="text-xs text-slate-500 font-mono">
                            {item.student.studentId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {item.student.rfidCardUid && (
                          <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200/50">
                            RFID Linked
                          </span>
                        )}
                        <button
                          onClick={() =>
                            handleRemoveStudent(
                              item.student.id,
                              `${item.student.firstName} ${item.student.lastName}`,
                            )
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Remove from section"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN STUDENTS MODAL */}
      {isAssignModalOpen && selectedSection && (
        <div className="fixed inset-0 z-60 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Assign Students to {selectedSection.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select students to enroll in {selectedSection.gradeLevel}
                </p>
              </div>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
              {availableStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No other active students available to assign.
                </div>
              ) : (
                availableStudents.map((s) => {
                  const isChecked = selectedStudentIds.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedStudentIds([...selectedStudentIds, s.id]);
                            } else {
                              setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                            }
                          }}
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <div>
                          <div className="text-xs font-semibold text-slate-800">
                            {s.lastName}, {s.firstName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{s.studentId}</div>
                        </div>
                      </div>

                      {s.currentSection && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          Currently: {s.currentSection.name}
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                {selectedStudentIds.length} selected
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || selectedStudentIds.length === 0}
                  onClick={handleAssignStudents}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Assigning...' : `Assign (${selectedStudentIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
