'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  BookOpen,
  Calendar,
  Clock,
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  Users,
  GraduationCap,
  DoorOpen,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  CalendarDays,
  ListFilter,
  CheckSquare,
  Square,
} from 'lucide-react';
import { DayOfWeek } from '@school-saas/shared';

interface MasterSubject {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  gradeLevel?: string;
  classCount: number;
  createdAt: string;
}

interface TermItem {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  academicYear?: {
    id: string;
    name: string;
  };
}

interface ScheduleSlot {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  room?: string;
}

interface SubjectClassItem {
  id: string;
  classCode: string;
  room?: string;
  capacity?: number;
  enrolledCount: number;
  subject: {
    id: string;
    code: string;
    name: string;
    credits: number;
    gradeLevel?: string;
  };
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
    specialization?: string;
  } | null;
  section?: {
    id: string;
    name: string;
    gradeLevel: string;
  } | null;
  academicYear?: {
    id: string;
    name: string;
  };
  termsList: TermItem[];
  schedules: {
    id: string;
    dayOfWeek: DayOfWeek;
    startTime: string;
    endTime: string;
    room?: string;
  }[];
  createdAt: string;
}

interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
}

interface SectionOption {
  id: string;
  name: string;
  gradeLevel: string;
}

const DAYS_OF_WEEK = [
  { value: DayOfWeek.MONDAY, label: 'Monday' },
  { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
  { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
  { value: DayOfWeek.THURSDAY, label: 'Thursday' },
  { value: DayOfWeek.FRIDAY, label: 'Friday' },
  { value: DayOfWeek.SATURDAY, label: 'Saturday' },
  { value: DayOfWeek.SUNDAY, label: 'Sunday' },
];

const GRADE_LEVELS = [
  'Grade 7',
  'Grade 8',
  'Grade 9',
  'Grade 10',
  'Grade 11',
  'Grade 12',
];

export default function SubjectsPage() {
  const [activeTab, setActiveTab] = useState<'classes' | 'subjects'>('classes');

  // Data states
  const [classes, setClasses] = useState<SubjectClassItem[]>([]);
  const [subjects, setSubjects] = useState<MasterSubject[]>([]);
  const [terms, setTerms] = useState<TermItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');
  const [termFilter, setTermFilter] = useState('');

  // Modals
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isCreateSubjectModalOpen, setIsCreateSubjectModalOpen] = useState(false);
  const [isClassDetailModalOpen, setIsClassDetailModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<SubjectClassItem | null>(null);

  // Form states for Class Offering (Flexible multi-term & multi-slot schedule)
  const [classForm, setClassForm] = useState({
    subjectId: '',
    classCode: '',
    teacherId: '',
    sectionId: '',
    room: '',
    capacity: 45,
    termIds: [] as string[],
    schedules: [
      {
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '08:00',
        endTime: '09:30',
        room: '',
      },
    ] as ScheduleSlot[],
  });

  // Form states for Master Subject
  const [subjectForm, setSubjectForm] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3.0,
    gradeLevel: 'Grade 7',
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch Master Subjects
  const fetchSubjects = useCallback(async () => {
    try {
      const res = await api.get<MasterSubject[]>('/api/subjects?limit=100');
      if (res.success && res.data) {
        setSubjects(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Terms
  const fetchTerms = useCallback(async () => {
    try {
      const res = await api.get<TermItem[]>('/api/subjects/terms');
      if (res.success && res.data) {
        setTerms(res.data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch Teachers & Sections for dropdowns
  const fetchDropdownData = useCallback(async () => {
    try {
      const [teachersRes, sectionsRes] = await Promise.all([
        api.get<TeacherOption[]>('/api/teachers?limit=100'),
        api.get<SectionOption[]>('/api/sections?limit=100'),
      ]);
      if (teachersRes.success && teachersRes.data) setTeachers(teachersRes.data);
      if (sectionsRes.success && sectionsRes.data) setSections(sectionsRes.data);
    } catch {
      // ignore
    }
  }, []);

  // Fetch Class Offerings
  const fetchClasses = useCallback(async () => {
    setLoading(true);
    try {
      let query = `/api/subjects/classes?limit=50`;
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (termFilter) query += `&termId=${encodeURIComponent(termFilter)}`;

      const res = await api.get<SubjectClassItem[]>(query);
      if (res.success && res.data) {
        setClasses(res.data);
      }
    } catch (err: any) {
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  }, [search, termFilter]);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchTerms();
    fetchDropdownData();
  }, [fetchClasses, fetchSubjects, fetchTerms, fetchDropdownData]);

  // Handle Multi-Slot Schedule Management
  const addScheduleSlot = () => {
    setClassForm((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          dayOfWeek: DayOfWeek.WEDNESDAY,
          startTime: '08:00',
          endTime: '09:30',
          room: '',
        },
      ],
    }));
  };

  const removeScheduleSlot = (index: number) => {
    if (classForm.schedules.length <= 1) return;
    setClassForm((prev) => ({
      ...prev,
      schedules: prev.schedules.filter((_, i) => i !== index),
    }));
  };

  const updateScheduleSlot = (index: number, field: keyof ScheduleSlot, value: any) => {
    setClassForm((prev) => {
      const updated = [...prev.schedules];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, schedules: updated };
    });
  };

  // Toggle Term Checkbox
  const toggleTerm = (termId: string) => {
    setClassForm((prev) => {
      const exists = prev.termIds.includes(termId);
      return {
        ...prev,
        termIds: exists
          ? prev.termIds.filter((id) => id !== termId)
          : [...prev.termIds, termId],
      };
    });
  };

  // Select all current terms helper
  const selectAllCurrentTerms = () => {
    setClassForm((prev) => ({
      ...prev,
      termIds: terms.map((t) => t.id),
    }));
  };

  // Auto-generate Class Code on subject or section selection
  const handleSubjectChange = (subjectId: string) => {
    const selected = subjects.find((s) => s.id === subjectId);
    let code = classForm.classCode;
    if (selected && (!code || code.includes('-'))) {
      const section = sections.find((sec) => sec.id === classForm.sectionId);
      const sectionPart = section ? section.name.toUpperCase().slice(0, 3) : 'SEC';
      code = `${selected.code}-${sectionPart}`;
    }
    setClassForm((prev) => ({ ...prev, subjectId, classCode: code }));
  };

  const handleSectionChange = (sectionId: string) => {
    const selectedSec = sections.find((s) => s.id === sectionId);
    let code = classForm.classCode;
    if (selectedSec && classForm.subjectId) {
      const subject = subjects.find((s) => s.id === classForm.subjectId);
      if (subject) {
        code = `${subject.code}-${selectedSec.name.toUpperCase().slice(0, 4)}`;
      }
    }
    setClassForm((prev) => ({ ...prev, sectionId, classCode: code }));
  };

  // Submit Create Class Offering
  const handleCreateClassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classForm.subjectId) {
      setErrorMsg('Please select a master subject.');
      return;
    }
    if (classForm.termIds.length === 0) {
      setErrorMsg('Please select at least one academic term.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        subjectId: classForm.subjectId,
        classCode: classForm.classCode.trim(),
        teacherId: classForm.teacherId || undefined,
        sectionId: classForm.sectionId || undefined,
        room: classForm.room.trim() || undefined,
        capacity: Number(classForm.capacity) || 45,
        termIds: classForm.termIds,
        schedules: classForm.schedules.map((s) => ({
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
          room: s.room?.trim() || undefined,
        })),
      };

      const res = await api.post<SubjectClassItem>('/api/subjects/classes', payload);
      if (res.success) {
        setSuccessMsg(`Class offering "${classForm.classCode}" created successfully!`);
        setIsCreateClassModalOpen(false);
        // reset form
        setClassForm({
          subjectId: '',
          classCode: '',
          teacherId: '',
          sectionId: '',
          room: '',
          capacity: 45,
          termIds: [],
          schedules: [
            {
              dayOfWeek: DayOfWeek.MONDAY,
              startTime: '08:00',
              endTime: '09:30',
              room: '',
            },
          ],
        });
        fetchClasses();
        fetchSubjects();
      } else {
        setErrorMsg(res.message || 'Failed to create class offering');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while creating class');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Create Master Subject
  const handleCreateSubjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        code: subjectForm.code.trim(),
        name: subjectForm.name.trim(),
        credits: Number(subjectForm.credits) || 3.0,
        gradeLevel: subjectForm.gradeLevel || undefined,
        description: subjectForm.description.trim() || undefined,
      };

      const res = await api.post<MasterSubject>('/api/subjects', payload);
      if (res.success) {
        setSuccessMsg(`Master subject "${subjectForm.name}" created successfully!`);
        setIsCreateSubjectModalOpen(false);
        setSubjectForm({
          code: '',
          name: '',
          description: '',
          credits: 3.0,
          gradeLevel: 'Grade 7',
        });
        fetchSubjects();
      } else {
        setErrorMsg(res.message || 'Failed to create subject');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while creating subject');
    } finally {
      setSubmitting(false);
    }
  };

  // Delete Class Offering
  const handleDeleteClass = async (c: SubjectClassItem) => {
    if (!confirm(`Are you sure you want to remove class offering "${c.classCode}"?`)) return;
    try {
      const res = await api.delete(`/api/subjects/classes/${c.id}`);
      if (res.success) {
        setSuccessMsg(`Class offering "${c.classCode}" deleted successfully.`);
        fetchClasses();
      } else {
        setErrorMsg(res.message || 'Failed to delete class');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error deleting class');
    }
  };

  // Open Details Modal
  const openClassDetails = (c: SubjectClassItem) => {
    setSelectedClass(c);
    setIsClassDetailModalOpen(true);
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
            <BookOpen className="w-7 h-7 text-emerald-600" />
            Subjects & Schedules
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Curriculum master subjects, class offerings, faculty assignments, and recurring timetable schedules.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsCreateSubjectModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-xs text-sm transition"
          >
            <Plus className="w-4 h-4 text-slate-500" />
            New Subject
          </button>
          <button
            onClick={() => {
              // Pre-select current terms by default
              const currentTermIds = terms.filter((t) => t.isCurrent).map((t) => t.id);
              setClassForm({
                subjectId: '',
                classCode: '',
                teacherId: '',
                sectionId: '',
                room: '',
                capacity: 45,
                termIds: currentTermIds.length > 0 ? currentTermIds : terms.map((t) => t.id).slice(0, 1),
                schedules: [
                  {
                    dayOfWeek: DayOfWeek.MONDAY,
                    startTime: '08:00',
                    endTime: '09:30',
                    room: '',
                  },
                ],
              });
              setIsCreateClassModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Class Offering
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === 'classes'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Class Offerings & Schedules ({classes.length})
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition ${
            activeTab === 'subjects'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Master Subjects Catalog ({subjects.length})
        </button>
      </div>

      {/* TAB 1: CLASS OFFERINGS & SCHEDULES */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-3 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search class code, subject, teacher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={termFilter}
                onChange={(e) => setTermFilter(e.target.value)}
                className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Academic Terms</option>
                {terms.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} {t.isCurrent ? '(Current)' : ''}
                  </option>
                ))}
              </select>

              <button
                onClick={() => {
                  fetchClasses();
                  fetchSubjects();
                }}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Classes Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                Loading class offerings...
              </div>
            ) : classes.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="font-medium text-slate-700">No class offerings found</p>
                <p className="text-sm text-slate-400 mt-1">
                  Create a class offering to schedule subjects with faculty and weekly time slots.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Class Code</th>
                      <th className="px-5 py-3.5">Subject & Units</th>
                      <th className="px-5 py-3.5">Section</th>
                      <th className="px-5 py-3.5">Faculty / Teacher</th>
                      <th className="px-5 py-3.5">Academic Terms</th>
                      <th className="px-5 py-3.5">Schedule Slots</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {classes.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">
                          {c.classCode}
                        </td>
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{c.subject.name}</div>
                          <div className="text-xs text-slate-500">
                            {c.subject.code} &bull; {c.subject.credits} Units
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          {c.section ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
                              <Layers className="w-3 h-3" />
                              {c.section.name} ({c.section.gradeLevel})
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No Section</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {c.teacher ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                                {c.teacher.firstName[0]}
                                {c.teacher.lastName[0]}
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-slate-800">
                                  {c.teacher.firstName} {c.teacher.lastName}
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {c.teacher.employeeId}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap gap-1">
                            {c.termsList && c.termsList.length > 0 ? (
                              c.termsList.map((term) => (
                                <span
                                  key={term.id}
                                  className="px-2 py-0.5 text-[11px] font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200/50"
                                >
                                  {term.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400">All Terms</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            {c.schedules && c.schedules.length > 0 ? (
                              c.schedules.slice(0, 2).map((s, idx) => (
                                <div
                                  key={idx}
                                  className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-100 px-2 py-0.5 rounded mr-1"
                                >
                                  <Clock className="w-3 h-3 text-slate-500" />
                                  <span>
                                    {s.dayOfWeek.slice(0, 3)} {s.startTime}-{s.endTime}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <span className="text-xs text-slate-400 italic">TBA</span>
                            )}
                            {c.schedules && c.schedules.length > 2 && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                +{c.schedules.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openClassDetails(c)}
                              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                              title="View Timetable & Enrollments"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClass(c)}
                              className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-500 hover:text-rose-600 transition"
                              title="Delete Class"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: MASTER CURRICULUM SUBJECTS */}
      {activeTab === 'subjects' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200/50 mb-1.5 font-mono">
                      {sub.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">{sub.name}</h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200/50">
                    {sub.credits} Units
                  </span>
                </div>

                {sub.description && (
                  <p className="mt-2.5 text-xs text-slate-500 line-clamp-2">
                    {sub.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Level: <strong>{sub.gradeLevel || 'All Grades'}</strong></span>
                  <span>Offerings: <strong>{sub.classCount}</strong></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE CLASS OFFERING MODAL (FEATURING DYNAMIC MULTI-TERM & MULTI-SLOT SCHEDULE) */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Create Class Offering</h2>
                  <p className="text-xs text-slate-500">
                    Link subject, faculty, multiple select terms, and recurring weekly schedule slots
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateClassModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="mt-5 space-y-5">
              {/* Row 1: Master Subject & Class Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Master Curriculum Subject *
                  </label>
                  <select
                    required
                    value={classForm.subjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Master Subject --</option>
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.code} - {s.name} ({s.credits} Units)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Class Offering Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH7-SEC-A"
                    value={classForm.classCode}
                    onChange={(e) => setClassForm({ ...classForm, classCode: e.target.value })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Row 2: Section & Faculty */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Section (Optional)
                  </label>
                  <select
                    value={classForm.sectionId}
                    onChange={(e) => handleSectionChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- No Section (Open Enrollment) --</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.gradeLevel})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Faculty / Teacher
                  </label>
                  <select
                    value={classForm.teacherId}
                    onChange={(e) => setClassForm({ ...classForm, teacherId: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Assign Later --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Room & Capacity */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Classroom / Science Lab
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Science Lab 2, Room 301"
                    value={classForm.room}
                    onChange={(e) => setClassForm({ ...classForm, room: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student Capacity
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={classForm.capacity}
                    onChange={(e) => setClassForm({ ...classForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* MULTIPLE SELECT ACADEMIC TERMS (Explicit User Requirement) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                    Applicable Academic Terms (Multiple Select) *
                  </label>
                  <button
                    type="button"
                    onClick={selectAllCurrentTerms}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold"
                  >
                    Select All
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Check all terms this subject offering runs under (e.g. 1st Semester, 2nd Semester, Summer):
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {terms.map((term) => {
                    const isChecked = classForm.termIds.includes(term.id);
                    return (
                      <button
                        type="button"
                        key={term.id}
                        onClick={() => toggleTerm(term.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition text-left ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className="truncate">
                          {term.name} {term.isCurrent ? '⭐' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DYNAMIC MULTI-SLOT CLASS SCHEDULE BUILDER (Explicit User Requirement) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    Weekly Timetable Schedules (Dynamic Multi-Slot)
                  </label>
                  <button
                    type="button"
                    onClick={addScheduleSlot}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Time Slot
                  </button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  Specify day of the week, start time, end time, and optional room for each class session:
                </p>

                <div className="space-y-3">
                  {classForm.schedules.map((slot, idx) => (
                    <div
                      key={idx}
                      className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center gap-2.5"
                    >
                      {/* Day */}
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          updateScheduleSlot(idx, 'dayOfWeek', e.target.value as DayOfWeek)
                        }
                        className="w-full sm:w-36 px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label}
                          </option>
                        ))}
                      </select>

                      {/* Start Time */}
                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <span className="text-[11px] text-slate-400">From:</span>
                        <input
                          type="time"
                          required
                          value={slot.startTime}
                          onChange={(e) => updateScheduleSlot(idx, 'startTime', e.target.value)}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>

                      {/* End Time */}
                      <div className="flex items-center gap-1 w-full sm:w-auto">
                        <span className="text-[11px] text-slate-400">To:</span>
                        <input
                          type="time"
                          required
                          value={slot.endTime}
                          onChange={(e) => updateScheduleSlot(idx, 'endTime', e.target.value)}
                          className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                        />
                      </div>

                      {/* Room Override */}
                      <input
                        type="text"
                        placeholder="Room (opt)"
                        value={slot.room || ''}
                        onChange={(e) => updateScheduleSlot(idx, 'room', e.target.value)}
                        className="w-full sm:w-28 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                      />

                      {/* Remove Button */}
                      <button
                        type="button"
                        disabled={classForm.schedules.length <= 1}
                        onClick={() => removeScheduleSlot(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition disabled:opacity-30"
                        title="Remove time slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Creating Offering...' : 'Create Class Offering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE MASTER SUBJECT MODAL */}
      {isCreateSubjectModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Add Master Subject</h2>
                  <p className="text-xs text-slate-500">Define a curriculum subject into the institutional catalog</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubjectSubmit} className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MATH7, SCI10"
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 text-sm font-mono bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Academic Credits / Units *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    required
                    value={subjectForm.credits}
                    onChange={(e) => setSubjectForm({ ...subjectForm, credits: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. General Mathematics 7"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Grade Level
                </label>
                <select
                  value={subjectForm.gradeLevel}
                  onChange={(e) => setSubjectForm({ ...subjectForm, gradeLevel: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  Course Description / Syllabus Overview
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief curriculum description..."
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateSubjectModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLASS OFFERING TIMETABLE DETAILS MODAL */}
      {isClassDetailModalOpen && selectedClass && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedClass.classCode}
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1">
                  {selectedClass.subject.name}
                </h3>
              </div>
              <button
                onClick={() => setIsClassDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block">Section:</span>
                  <strong className="text-slate-800">
                    {selectedClass.section
                      ? `${selectedClass.section.name} (${selectedClass.section.gradeLevel})`
                      : 'None'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Faculty Teacher:</span>
                  <strong className="text-slate-800">
                    {selectedClass.teacher
                      ? `${selectedClass.teacher.firstName} ${selectedClass.teacher.lastName}`
                      : 'Unassigned'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Classroom:</span>
                  <strong className="text-slate-800">{selectedClass.room || 'TBA'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Enrolled / Capacity:</span>
                  <strong className="text-slate-800">
                    {selectedClass.enrolledCount} / {selectedClass.capacity || 45}
                  </strong>
                </div>
              </div>

              {/* Terms */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Academic Terms (Multiple Select)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedClass.termsList.map((t) => (
                    <span
                      key={t.id}
                      className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 border border-blue-200/50"
                    >
                      {t.name} {t.isCurrent ? '(Active)' : ''}
                    </span>
                  ))}
                </div>
              </div>

              {/* Weekly Timetable */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-1.5">
                  Weekly Timetable Slots
                </div>
                {selectedClass.schedules.length === 0 ? (
                  <div className="text-xs text-slate-400">No schedule slots configured.</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedClass.schedules.map((s, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200"
                      >
                        <div className="flex items-center gap-2 font-medium text-slate-800">
                          <Clock className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{s.dayOfWeek}</span>
                        </div>
                        <div className="text-slate-600 font-mono">
                          {s.startTime} - {s.endTime}
                        </div>
                        {s.room && (
                          <div className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            {s.room}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsClassDetailModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
