'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  GraduationCap,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Save,
  Send,
  Printer,
  ChevronRight,
  Layers,
  BookOpen,
  UserPlus,
  UserMinus,
  FileText,
  Clock,
  Sparkles,
  Award,
  Calendar,
  Plus,
  DoorOpen,
  CalendarCheck,
  Check,
  Building2,
  FolderTree,
} from 'lucide-react';
import { GradingPeriod, DayOfWeek } from '@school-saas/shared';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface ClassOfferingOption {
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
  } | null;
  section?: {
    id: string;
    name: string;
    gradeLevel: string;
  } | null;
}

export interface SectionItem {
  id: string;
  name: string;
  gradeLevel: string;
  room?: string;
  capacity: number;
  adviser?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
  studentCount: number;
  classCount?: number;
}

export interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
}

export interface TeacherOption {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  department?: string;
}

export interface SubjectOption {
  id: string;
  code: string;
  name: string;
  gradeLevel: string;
  credits: number;
}

export interface StudentGradeRow {
  enrollmentId: string;
  status: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
  };
  grades: Record<string, { id?: string; score: number; remarks?: string | null; isPublished: boolean }>;
  finalAverage: number | null;
  remarks: string | null;
}

export interface MatrixResponse {
  subjectClass: ClassOfferingOption;
  totalEnrolled: number;
  classAverage: number | null;
  students: StudentGradeRow[];
}

export interface ReportCardResponse {
  student: {
    id: string;
    studentId: string;
    fullName: string;
    currentSection: string;
    gradeLevel: string;
    academicYear: string;
  };
  subjects: {
    subjectCode: string;
    subjectName: string;
    credits: number;
    classCode: string;
    teacher: string;
    grades: Record<string, number>;
    finalGrade: number | null;
    remarks: string;
  }[];
  totalCredits: number;
  generalAverage: number | null;
  remarks: string;
}

// Trimestral Structure: 1st Term, 2nd Term, 3rd Term
export const TRIMESTRAL_PERIODS = [
  { id: GradingPeriod.PRELIM, label: '1st Term', shortName: '1st Term', altKeys: ['PRELIM', 'Q1'] },
  { id: GradingPeriod.MIDTERM, label: '2nd Term', shortName: '2nd Term', altKeys: ['MIDTERM', 'Q2'] },
  { id: GradingPeriod.FINALS, label: '3rd Term', shortName: '3rd Term', altKeys: ['FINALS', 'Q3', 'Q4'] },
];

export default function GradesPage() {
  // Navigation tabs: Class List, Trimestral Gradesheet, Report Card
  const [activeTab, setActiveTab] = useState<'classList' | 'gradesheet' | 'reportCard'>('classList');

  // Master Data
  const [classes, setClasses] = useState<ClassOfferingOption[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);

  // Selection states
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<GradingPeriod>(GradingPeriod.PRELIM);
  const [localScores, setLocalScores] = useState<Record<string, string>>({});

  // Loading & Filter states
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [classListGradeFilter, setClassListGradeFilter] = useState('ALL');

  // Modals
  const [isSectionEnrollModalOpen, setIsSectionEnrollModalOpen] = useState(false);
  const [isStudentEnrollModalOpen, setIsStudentEnrollModalOpen] = useState(false);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardResponse | null>(null);

  // New User Journey Modals (Class List)
  const [isEnlistStudentsModalOpen, setIsEnlistStudentsModalOpen] = useState(false);
  const [isEnlistSubjectModalOpen, setIsEnlistSubjectModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionItem | null>(null);

  // Selection states for Modals
  const [targetSectionId, setTargetSectionId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Form states for Enlist Subject & Schedule Modal
  const [enlistSubjectForm, setEnlistSubjectForm] = useState({
    subjectId: '',
    teacherId: '',
    classCode: '',
    room: '',
    capacity: 40,
    days: ['MONDAY', 'WEDNESDAY', 'FRIDAY'] as DayOfWeek[],
    startTime: '08:00',
    endTime: '09:30',
  });

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to extract score across trimestral periods with fallback compatibility
  const getScoreForTerm = useCallback(
    (row: StudentGradeRow, term: (typeof TRIMESTRAL_PERIODS)[0]) => {
      // 1. Direct match by term ID
      if (row.grades[term.id]?.score !== undefined) {
        return row.grades[term.id].score;
      }
      // 2. Fallback check for Q1/Q2/Q3/Q4 or alternate keys
      for (const key of term.altKeys) {
        if (row.grades[key]?.score !== undefined) {
          return row.grades[key].score;
        }
      }
      return undefined;
    },
    [],
  );

  // 1. Fetch initial options: Classes, Sections, Teachers, Subjects
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [classesRes, sectionsRes, teachersRes, subjectsRes] = await Promise.all([
        api.get<ClassOfferingOption[]>('/api/subjects/classes?limit=100'),
        api.get<SectionItem[]>('/api/sections?limit=100'),
        api.get<TeacherOption[]>('/api/teachers?limit=100'),
        api.get<SubjectOption[]>('/api/subjects?limit=100'),
      ]);

      if (classesRes.success && classesRes.data && classesRes.data.length > 0) {
        setClasses(classesRes.data);
        if (!selectedClassId) {
          setSelectedClassId(classesRes.data[0].id);
        }
      }
      if (sectionsRes.success && sectionsRes.data) {
        setSections(sectionsRes.data);
      }
      if (teachersRes.success && teachersRes.data) {
        setTeachers(teachersRes.data);
      }
      if (subjectsRes.success && subjectsRes.data) {
        setSubjects(subjectsRes.data);
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // 2. Fetch Grades Matrix for selected class
  const fetchGradesMatrix = useCallback(
    async (classId: string) => {
      if (!classId) return;
      setMatrixLoading(true);
      try {
        const res = await api.get<MatrixResponse>(`/api/grades/classes/${classId}/matrix`);
        if (res.success && res.data) {
          setMatrixData(res.data);
          // Pre-populate local editable scores dictionary
          const initialScores: Record<string, string> = {};
          res.data.students.forEach((row) => {
            TRIMESTRAL_PERIODS.forEach((term) => {
              const score = getScoreForTerm(row, term);
              if (score !== undefined) {
                initialScores[`${row.student.id}_${term.id}`] = String(score);
              }
            });
          });
          setLocalScores(initialScores);
        }
      } catch (err: any) {
        setErrorMsg('Failed to load grading matrix for selected class');
      } finally {
        setMatrixLoading(false);
      }
    },
    [getScoreForTerm],
  );

  useEffect(() => {
    if (selectedClassId && activeTab === 'gradesheet') {
      fetchGradesMatrix(selectedClassId);
    }
  }, [selectedClassId, activeTab, fetchGradesMatrix]);

  // ==========================================
  // ACTION 1: ENLIST STUDENTS (Class List)
  // ==========================================
  const handleOpenEnlistStudents = async (section: SectionItem) => {
    setActiveSection(section);
    setSelectedStudentIds([]);
    try {
      const res = await api.get<StudentOption[]>('/api/students?limit=200&status=ACTIVE');
      if (res.success && res.data) {
        setAvailableStudents(res.data);
        setIsEnlistStudentsModalOpen(true);
      }
    } catch {
      setErrorMsg('Failed to fetch available students roster');
    }
  };

  const handleEnlistStudentsSubmit = async () => {
    if (!activeSection || selectedStudentIds.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/api/sections/${activeSection.id}/students`, {
        studentIds: selectedStudentIds,
      });
      if (res.success) {
        setSuccessMsg(
          `Enlisted ${selectedStudentIds.length} student(s) into Section ${activeSection.name}!`,
        );
        setIsEnlistStudentsModalOpen(false);
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to enlist students');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enlisting students to section');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ACTION 2: ENLIST SUBJECT & SCHEDULE (Class List)
  // ==========================================
  const handleOpenEnlistSubject = (section: SectionItem) => {
    setActiveSection(section);
    setEnlistSubjectForm({
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      classCode: `${section.name.toUpperCase().slice(0, 4)}-SUBJ`,
      room: section.room || 'Room 201',
      capacity: section.capacity || 40,
      days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      startTime: '08:00',
      endTime: '09:30',
    });
    setIsEnlistSubjectModalOpen(true);
  };

  const handleEnlistSubjectSubmit = async () => {
    if (!activeSection || !enlistSubjectForm.subjectId) {
      setErrorMsg('Please select a subject to enlist');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        subjectId: enlistSubjectForm.subjectId,
        sectionId: activeSection.id,
        teacherId: enlistSubjectForm.teacherId || undefined,
        classCode: enlistSubjectForm.classCode || `${activeSection.name}-CLASS`,
        room: enlistSubjectForm.room,
        capacity: Number(enlistSubjectForm.capacity),
        scheduleSlots: enlistSubjectForm.days.map((day) => ({
          dayOfWeek: day,
          startTime: enlistSubjectForm.startTime,
          endTime: enlistSubjectForm.endTime,
          room: enlistSubjectForm.room,
        })),
      };

      const res = await api.post('/api/subjects/classes', payload);
      if (res.success) {
        setSuccessMsg(
          `Subject & schedule successfully enlisted for Section ${activeSection.name}!`,
        );
        setIsEnlistSubjectModalOpen(false);
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to enlist subject and schedule');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enlisting subject offering');
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // ACTION 3: OPEN GRADESHEET FOR SECTION
  // ==========================================
  const handleOpenGradesheetForSection = (section: SectionItem) => {
    // Find matching class offering for this section
    const matchingClass = classes.find((c) => c.section?.id === section.id);
    if (matchingClass) {
      setSelectedClassId(matchingClass.id);
    }
    setActiveTab('gradesheet');
  };

  // Handle Score Input Change
  const handleScoreChange = (studentId: string, period: GradingPeriod, val: string) => {
    if (val === '' || (!isNaN(Number(val)) && Number(val) <= 100 && Number(val) >= 0)) {
      setLocalScores((prev) => ({
        ...prev,
        [`${studentId}_${period}`]: val,
      }));
    }
  };

  // Save Batch Grades (Draft or Publish)
  const handleSaveGrades = async (publish = false) => {
    if (!selectedClassId || !matrixData) return;
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const gradesToSave = matrixData.students
        .map((row) => {
          const val = localScores[`${row.student.id}_${activePeriod}`];
          if (val === undefined || val === '') return null;
          return {
            studentId: row.student.id,
            score: Number(val),
          };
        })
        .filter(Boolean);

      if (gradesToSave.length === 0) {
        setErrorMsg('No scores entered for this term to save.');
        setSubmitting(false);
        return;
      }

      const res = await api.post(`/api/grades/classes/${selectedClassId}/batch`, {
        period: activePeriod,
        isPublished: publish,
        grades: gradesToSave,
      });

      if (res.success) {
        setSuccessMsg(
          publish
            ? 'Trimestral grades published successfully!'
            : 'Draft trimestral grades saved successfully!',
        );
        fetchGradesMatrix(selectedClassId);
      } else {
        setErrorMsg(res.message || 'Failed to save grades');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving grades');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Student Report Card
  const openReportCard = async (studentId: string) => {
    try {
      const res = await api.get<ReportCardResponse>(`/api/grades/students/${studentId}/report-card`);
      if (res.success && res.data) {
        setReportCardData(res.data);
        setIsReportCardModalOpen(true);
      }
    } catch {
      setErrorMsg('Failed to load student report card');
    }
  };

  // Filter sections in Class List view
  const filteredSections = useMemo(() => {
    return sections.filter((sec) => {
      const matchesGrade =
        classListGradeFilter === 'ALL' || sec.gradeLevel === classListGradeFilter;
      const matchesSearch =
        !search.trim() ||
        sec.name.toLowerCase().includes(search.toLowerCase()) ||
        sec.gradeLevel.toLowerCase().includes(search.toLowerCase()) ||
        (sec.adviser &&
          `${sec.adviser.firstName} ${sec.adviser.lastName}`
            .toLowerCase()
            .includes(search.toLowerCase()));
      return matchesGrade && matchesSearch;
    });
  }, [sections, classListGradeFilter, search]);

  // Filter learners in Gradesheet view
  const filteredMatrixStudents = useMemo(() => {
    if (!matrixData?.students) return [];
    if (!search.trim()) return matrixData.students;
    const q = search.toLowerCase();
    return matrixData.students.filter(
      (s) =>
        s.student.lastName.toLowerCase().includes(q) ||
        s.student.firstName.toLowerCase().includes(q) ||
        s.student.studentId.toLowerCase().includes(q),
    );
  }, [matrixData?.students, search]);

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {successMsg && (
        <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="font-medium">{successMsg}</span>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-emerald-600 hover:text-emerald-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-sm animate-fade-in shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            <span className="font-medium">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-rose-600 hover:text-rose-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Primary Navigation */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                Trimestral Academic Calendar
              </span>
              <span className="text-xs text-slate-500 font-medium">
                1st, 2nd & 3rd Term
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-0.5">
              Class List & Trimestral Gradesheet
            </h1>
          </div>
        </div>

        {/* Primary View Switcher Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('classList')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'classList'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FolderTree className="w-4 h-4 text-emerald-600" />
            <span>Class List & Sections</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('gradesheet');
              if (selectedClassId) fetchGradesMatrix(selectedClassId);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gradesheet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-4 h-4 text-emerald-600" />
            <span>Trimestral Gradesheet</span>
          </button>
        </div>
      </div>

      {/* ==========================================
          TAB 1: CLASS LIST & SECTIONS VIEW
          ========================================== */}
      {activeTab === 'classList' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stats Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <FolderTree className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Total Sections
                </p>
                <p className="text-2xl font-bold text-slate-900">{sections.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Enrolled Students
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {sections.reduce((acc, s) => acc + (s.studentCount || 0), 0)}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Class Offerings
                </p>
                <p className="text-2xl font-bold text-slate-900">{classes.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Grading Structure
                </p>
                <p className="text-sm font-bold text-amber-700">Trimestral (3 Terms)</p>
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search class by section name or adviser..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map(
                (grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setClassListGradeFilter(grade)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      classListGradeFilter === grade
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {grade}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Class List & Sections Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSections.map((sec) => {
              const capacityPercent = Math.min(
                100,
                Math.round(((sec.studentCount || 0) / (sec.capacity || 40)) * 100),
              );

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                          {sec.gradeLevel}
                        </span>
                        <h3 className="text-lg font-bold text-slate-900 mt-1">
                          Section {sec.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                        <DoorOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sec.room || 'Room TBA'}</span>
                      </div>
                    </div>

                    {/* Adviser info */}
                    <div className="flex items-center gap-2 mb-4 text-xs text-slate-700 bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px]">
                        {sec.adviser
                          ? `${sec.adviser.firstName.charAt(0)}${sec.adviser.lastName.charAt(0)}`
                          : 'NA'}
                      </div>
                      <div className="truncate">
                        <span className="text-slate-500 block text-[10px]">Class Adviser:</span>
                        <span className="font-semibold text-slate-900">
                          {sec.adviser
                            ? `${sec.adviser.firstName} ${sec.adviser.lastName}`
                            : 'No Adviser Assigned'}
                        </span>
                      </div>
                    </div>

                    {/* Enrolled Capacity Bar */}
                    <div className="space-y-1.5 mb-5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Class Roster:</span>
                        <span className="font-bold text-slate-800">
                          {sec.studentCount || 0} / {sec.capacity || 40} Learners
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            capacityPercent >= 90
                              ? 'bg-rose-500'
                              : capacityPercent >= 75
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                          }`}
                          style={{ width: `${capacityPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Class List Action Buttons: Enlist Students, Enlist Subject & Schedule, Open Gradesheet */}
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEnlistStudents(sec)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-emerald-200/60"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Enlist Students</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenEnlistSubject(sec)}
                        className="flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100/80 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-blue-200/60"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Enlist Subject</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenGradesheetForSection(sec)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Trimestral Gradesheet</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==========================================
          TAB 2: TRIMESTRAL GRADESHEET VIEW
          ========================================== */}
      {activeTab === 'gradesheet' && (
        <div className="space-y-6 animate-fade-in">
          {/* Action Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Subject Class:</span>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.classCode} — {c.subject.name} (
                      {c.section ? `Sec ${c.section.name}` : 'No Sec'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Trimestral Term Switcher Tabs */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                {TRIMESTRAL_PERIODS.map((term) => (
                  <button
                    key={term.id}
                    type="button"
                    onClick={() => setActivePeriod(term.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activePeriod === term.id
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {term.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => handleSaveGrades(false)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-slate-500" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                onClick={() => handleSaveGrades(true)}
                disabled={submitting}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer shadow-emerald-600/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Grades</span>
              </button>
            </div>
          </div>

          {/* Trimestral Gradesheet Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter student in class..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="text-xs font-medium text-slate-500">
                Total Enrolled:{' '}
                <strong className="text-slate-900">{matrixData?.totalEnrolled || 0}</strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Student Name & LRN</th>
                    <th className="py-3 px-4 text-center">1st Term</th>
                    <th className="py-3 px-4 text-center">2nd Term</th>
                    <th className="py-3 px-4 text-center">3rd Term</th>
                    <th className="py-3 px-4 text-center">Final Term Average</th>
                    <th className="py-3 px-4 text-center">Remarks</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {filteredMatrixStudents.map((row, idx) => {
                    const score1 = getScoreForTerm(row, TRIMESTRAL_PERIODS[0]);
                    const score2 = getScoreForTerm(row, TRIMESTRAL_PERIODS[1]);
                    const score3 = getScoreForTerm(row, TRIMESTRAL_PERIODS[2]);

                    // Compute dynamic trimestral average
                    const availableScores = [score1, score2, score3].filter(
                      (s): s is number => s !== undefined,
                    );
                    const dynamicAvg =
                      availableScores.length > 0
                        ? Number(
                            (
                              availableScores.reduce((a, b) => a + b, 0) /
                              availableScores.length
                            ).toFixed(2),
                          )
                        : null;

                    const passed = dynamicAvg !== null && dynamicAvg >= 75.0;

                    return (
                      <tr key={row.enrollmentId} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {row.student.lastName}, {row.student.firstName}{' '}
                            {row.student.middleName ? `${row.student.middleName.charAt(0)}.` : ''}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600">
                            LRN: {row.student.studentId}
                          </div>
                        </td>

                        {/* 1st Term */}
                        <td className="py-3.5 px-4 text-center">
                          {activePeriod === GradingPeriod.PRELIM ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={localScores[`${row.student.id}_${GradingPeriod.PRELIM}`] ?? ''}
                              onChange={(e) =>
                                handleScoreChange(
                                  row.student.id,
                                  GradingPeriod.PRELIM,
                                  e.target.value,
                                )
                              }
                              className="w-16 text-center font-bold py-1 border border-emerald-300 bg-emerald-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {score1 !== undefined ? score1.toFixed(1) : '—'}
                            </span>
                          )}
                        </td>

                        {/* 2nd Term */}
                        <td className="py-3.5 px-4 text-center">
                          {activePeriod === GradingPeriod.MIDTERM ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={localScores[`${row.student.id}_${GradingPeriod.MIDTERM}`] ?? ''}
                              onChange={(e) =>
                                handleScoreChange(
                                  row.student.id,
                                  GradingPeriod.MIDTERM,
                                  e.target.value,
                                )
                              }
                              className="w-16 text-center font-bold py-1 border border-emerald-300 bg-emerald-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {score2 !== undefined ? score2.toFixed(1) : '—'}
                            </span>
                          )}
                        </td>

                        {/* 3rd Term */}
                        <td className="py-3.5 px-4 text-center">
                          {activePeriod === GradingPeriod.FINALS ? (
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={localScores[`${row.student.id}_${GradingPeriod.FINALS}`] ?? ''}
                              onChange={(e) =>
                                handleScoreChange(
                                  row.student.id,
                                  GradingPeriod.FINALS,
                                  e.target.value,
                                )
                              }
                              className="w-16 text-center font-bold py-1 border border-emerald-300 bg-emerald-50/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                            />
                          ) : (
                            <span className="font-semibold text-slate-700">
                              {score3 !== undefined ? score3.toFixed(1) : '—'}
                            </span>
                          )}
                        </td>

                        {/* Final Term Average */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`font-black text-xs px-2.5 py-1 rounded-md ${
                              dynamicAvg === null
                                ? 'text-slate-600 bg-slate-100'
                                : passed
                                  ? 'text-emerald-700 bg-emerald-50'
                                  : 'text-rose-700 bg-rose-50'
                            }`}
                          >
                            {dynamicAvg !== null ? dynamicAvg.toFixed(2) : '—'}
                          </span>
                        </td>

                        {/* Remarks */}
                        <td className="py-3.5 px-4 text-center">
                          {dynamicAvg !== null ? (
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                passed
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">Incomplete</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openReportCard(row.student.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold p-1 cursor-pointer"
                            title="View Trimestral Report Card"
                          >
                            Report Card
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 1: ENLIST STUDENTS INTO SECTION
          ========================================== */}
      {isEnlistStudentsModalOpen && activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enlist Learners — Section {activeSection.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select active learners to add to this section roster ({activeSection.gradeLevel})
                </p>
              </div>
              <button
                onClick={() => setIsEnlistStudentsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-2">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between px-1">
                <span>Available Learners ({availableStudents.length})</span>
                <span className="text-emerald-600 font-bold">
                  {selectedStudentIds.length} Selected
                </span>
              </div>

              <div className="space-y-1 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50">
                {availableStudents.map((st) => (
                  <label
                    key={st.id}
                    className="flex items-center gap-3 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(st.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudentIds([...selectedStudentIds, st.id]);
                        } else {
                          setSelectedStudentIds(selectedStudentIds.filter((id) => id !== st.id));
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        {st.lastName}, {st.firstName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-600">
                        LRN: {st.studentId}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEnlistStudentsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnlistStudentsSubmit}
                disabled={submitting || selectedStudentIds.length === 0}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Enlist Selected ({selectedStudentIds.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 2: ENLIST SUBJECT & SCHEDULE
          ========================================== */}
      {isEnlistSubjectModalOpen && activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enlist Subject & Schedule — Section {activeSection.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure subject course offering with assigned teacher and timetable
                </p>
              </div>
              <button
                onClick={() => setIsEnlistSubjectModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Subject Course
                </label>
                <select
                  value={enlistSubjectForm.subjectId}
                  onChange={(e) =>
                    setEnlistSubjectForm({ ...enlistSubjectForm, subjectId: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                >
                  {subjects.map((subj) => (
                    <option key={subj.id} value={subj.id}>
                      {subj.code} — {subj.name} ({subj.gradeLevel})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Assigned Faculty / Teacher
                </label>
                <select
                  value={enlistSubjectForm.teacherId}
                  onChange={(e) =>
                    setEnlistSubjectForm({ ...enlistSubjectForm, teacherId: e.target.value })
                  }
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Room / Classroom
                  </label>
                  <input
                    type="text"
                    value={enlistSubjectForm.room}
                    onChange={(e) =>
                      setEnlistSubjectForm({ ...enlistSubjectForm, room: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Class Code
                  </label>
                  <input
                    type="text"
                    value={enlistSubjectForm.classCode}
                    onChange={(e) =>
                      setEnlistSubjectForm({ ...enlistSubjectForm, classCode: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={enlistSubjectForm.startTime}
                    onChange={(e) =>
                      setEnlistSubjectForm({ ...enlistSubjectForm, startTime: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={enlistSubjectForm.endTime}
                    onChange={(e) =>
                      setEnlistSubjectForm({ ...enlistSubjectForm, endTime: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsEnlistSubjectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEnlistSubjectSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Enlist Subject & Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL 3: TRIMESTRAL REPORT CARD MODAL
          ========================================== */}
      {isReportCardModalOpen && reportCardData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Learner Progress Report Card (SF9 / Form 138)
                </h3>
                <p className="text-xs text-slate-500">
                  {reportCardData.student.fullName} • LRN: {reportCardData.student.studentId} •{' '}
                  {reportCardData.student.currentSection}
                </p>
              </div>
              <button
                onClick={() => setIsReportCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">
                    <th className="py-2.5 px-3">Subject Learning Area</th>
                    <th className="py-2.5 px-2 text-center">1st Term</th>
                    <th className="py-2.5 px-2 text-center">2nd Term</th>
                    <th className="py-2.5 px-2 text-center">3rd Term</th>
                    <th className="py-2.5 px-2 text-center">Final Rating</th>
                    <th className="py-2.5 px-2 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportCardData.subjects.map((s, idx) => {
                    const t1 = s.grades['PRELIM'] ?? s.grades['Q1'];
                    const t2 = s.grades['MIDTERM'] ?? s.grades['Q2'];
                    const t3 = s.grades['FINALS'] ?? s.grades['Q3'] ?? s.grades['Q4'];
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-900">{s.subjectName}</div>
                          <div className="text-[10px] text-slate-600">{s.subjectCode}</div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium">
                          {t1 !== undefined ? t1.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium">
                          {t2 !== undefined ? t2.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-medium">
                          {t3 !== undefined ? t3.toFixed(1) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-slate-900">
                          {s.finalGrade !== null ? s.finalGrade.toFixed(2) : '—'}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <span
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              s.remarks === 'PASSED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {s.remarks}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-300 bg-slate-50 font-bold">
                    <td className="py-2.5 px-3 text-slate-900">General Average</td>
                    <td colSpan={3} />
                    <td className="py-2.5 px-2 text-center text-emerald-700 text-sm">
                      {reportCardData.generalAverage !== null
                        ? reportCardData.generalAverage.toFixed(2)
                        : '—'}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="text-xs font-bold text-emerald-800">
                        {reportCardData.remarks}
                      </span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600">
                DepEd Trimestral Grading System • Pass mark: 75.0
              </span>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print SF9</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
