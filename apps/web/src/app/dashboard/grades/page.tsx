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
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  GripVertical,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { GradingPeriod, DayOfWeek } from '@school-saas/shared';
import { useAuth } from '@/context/auth-context';

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
  schedules?: Array<{
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    room?: string;
  }>;
}

export interface SectionStudentItem {
  id: string;
  studentId: string;
  status: string;
  student: {
    id: string;
    studentId: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    gender?: string;
    status: string;
  };
}

export interface SectionItem {
  id: string;
  tenantId?: string;
  tenant?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  name: string;
  gradeLevel: string;
  track?: string | null;
  strand?: string | null;
  room?: string;
  capacity: number;
  adviser?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  } | null;
  academicYear?: {
    id: string;
    name: string;
  } | null;
  studentCount: number;
  classCount?: number;
  students?: SectionStudentItem[];
}

export const SHS_TRACKS = [
  {
    id: 'Academic',
    name: 'Academic Track',
    strands: [
      { id: 'STEM', name: 'STEM (Science, Tech, Engineering & Math)' },
      { id: 'ABM', name: 'ABM (Accountancy, Business & Management)' },
      { id: 'HUMSS', name: 'HUMSS (Humanities & Social Sciences)' },
      { id: 'GAS', name: 'GAS (General Academic Strand)' },
    ],
  },
  {
    id: 'TVL',
    name: 'TVL (Technical-Vocational-Livelihood)',
    strands: [
      { id: 'TVL-ICT', name: 'ICT (Information & Communications Tech)' },
      { id: 'TVL-HE', name: 'HE (Home Economics)' },
      { id: 'TVL-IA', name: 'IA (Industrial Arts)' },
      { id: 'TVL-AFA', name: 'AFA (Agri-Fishery Arts)' },
    ],
  },
  {
    id: 'Arts & Design',
    name: 'Arts & Design Track',
    strands: [
      { id: 'Visual Arts', name: 'Visual Arts & Media Design' },
      { id: 'Performing Arts', name: 'Music, Theater & Dance' },
    ],
  },
  {
    id: 'Sports',
    name: 'Sports Track',
    strands: [
      { id: 'Sports Track', name: 'Sports Coaching & Leadership' },
    ],
  },
];

export interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  gender?: string;
  status: string;
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
  // Navigation / View Modes:
  // 'classList' -> Table listing of all sections with actions dropdown
  // 'enlistStudents' -> Dedicated search-to-enlist page with bottom roster div
  // 'enlistSubjects' -> Dedicated drag-and-drop / ordering of subjects for section
  // 'gradesheet' -> Trimestral gradesheet matrix
  const [viewMode, setViewMode] = useState<
    'classList' | 'enlistStudents' | 'enlistSubjects' | 'gradesheet'
  >('classList');

  // Master Data
  const [classes, setClasses] = useState<ClassOfferingOption[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [allStudents, setAllStudents] = useState<StudentOption[]>([]);

  // Selected Section & Its Enlisted Entities
  const [activeSection, setActiveSection] = useState<SectionItem | null>(null);
  const [enlistedStudents, setEnlistedStudents] = useState<SectionStudentItem[]>([]);
  const [sectionClasses, setSectionClasses] = useState<ClassOfferingOption[]>([]);

  // Actions Dropdown state (maps sectionId to boolean)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Student Search-to-Enlist State
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // Gradesheet Selection & Data
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null);
  const [activePeriod, setActivePeriod] = useState<GradingPeriod>(GradingPeriod.PRELIM);
  const [localScores, setLocalScores] = useState<Record<string, string>>({});

  // Authentication & Permissions
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isSchoolAdmin = user?.role === 'SCHOOL_ADMIN';
  const isRegistrar = (user?.role as string) === 'REGISTRAR';
  const isTeacher = user?.role === 'TEACHER';
  const isStaff = user?.role === 'STAFF';

  const canViewClassList =
    !user ||
    isSuperAdmin ||
    isSchoolAdmin ||
    isRegistrar ||
    isTeacher ||
    isStaff ||
    Boolean((user as any)?.permissions?.includes('sections:read')) ||
    Boolean((user as any)?.permissions?.includes('grades:read'));

  const canCreateSection =
    !user ||
    isSuperAdmin ||
    isSchoolAdmin ||
    isRegistrar ||
    Boolean((user as any)?.permissions?.includes('sections:create'));

  const canEnlistStudents =
    !user ||
    isSuperAdmin ||
    isSchoolAdmin ||
    isRegistrar ||
    Boolean((user as any)?.permissions?.includes('sections:create')) ||
    Boolean((user as any)?.permissions?.includes('sections:update'));

  const canManageSubjects =
    !user ||
    isSuperAdmin ||
    isSchoolAdmin ||
    isRegistrar ||
    Boolean((user as any)?.permissions?.includes('sections:update')) ||
    Boolean((user as any)?.permissions?.includes('subjects:create'));

  const canEditGrades =
    !user ||
    isSuperAdmin ||
    isSchoolAdmin ||
    isTeacher ||
    Boolean((user as any)?.permissions?.includes('grades:update')) ||
    Boolean((user as any)?.permissions?.includes('grades:create'));

  // Tenant / School Scoping
  const [schools, setSchools] = useState<Array<{ id: string; name: string; slug: string }>>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return (api.getActiveTenantId ? api.getActiveTenantId() : null) || user?.tenantId || '';
  });

  useEffect(() => {
    const active = (api.getActiveTenantId ? api.getActiveTenantId() : null) || user?.tenantId || '';
    if (active && !selectedTenantId) {
      setSelectedTenantId(active);
    }
  }, [user?.tenantId]);

  useEffect(() => {
    if (isSuperAdmin) {
      api.get<Array<{ id: string; name: string; slug: string }>>('/api/tenants')
        .then((res) => {
          if (res.success && res.data) {
            setSchools(res.data);
          }
        })
        .catch(() => {});
    }
  }, [isSuperAdmin]);

  const handleTenantChange = (newTenantId: string) => {
    setSelectedTenantId(newTenantId);
    api.setActiveTenantId?.(newTenantId || null);
    setActiveSection(null);
  };

  // Filters & Loading
  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classListSearch, setClassListSearch] = useState('');
  const [classListGradeFilter, setClassListGradeFilter] = useState('ALL');

  // Academic Years
  const [academicYears, setAcademicYears] = useState<
    Array<{ id: string; name: string; isCurrent?: boolean }>
  >([]);

  // Modals
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] = useState(false);
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardResponse | null>(null);

  // Create Section Form (with School Year, Tenant, & SHS Track/Strand)
  const [createSectionForm, setCreateSectionForm] = useState({
    tenantId: '',
    schoolYear: '2026-2027',
    gradeLevel: 'Grade 7',
    name: '',
    track: 'Academic',
    strand: 'STEM',
    room: '',
    capacity: 40,
    adviserId: '',
  });

  // Add Subject Form
  const [addSubjectForm, setAddSubjectForm] = useState({
    subjectId: '',
    teacherId: '',
    classCode: '',
    room: '',
    capacity: 40,
    days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY] as DayOfWeek[],
    startTime: '08:00',
    endTime: '09:30',
  });

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to extract score across trimestral periods with fallback compatibility
  const getScoreForTerm = useCallback(
    (row: StudentGradeRow, term: (typeof TRIMESTRAL_PERIODS)[0]) => {
      if (row.grades[term.id]?.score !== undefined) {
        return row.grades[term.id].score;
      }
      for (const key of term.altKeys) {
        if (row.grades[key]?.score !== undefined) {
          return row.grades[key].score;
        }
      }
      return undefined;
    },
    [],
  );

  // 1. Fetch initial options: Classes, Sections, Teachers, Subjects, Students, Academic Years (Scoped by tenantId)
  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const tenantQuery = selectedTenantId ? `&tenantId=${encodeURIComponent(selectedTenantId)}` : '';
      const ayTenantQuery = selectedTenantId ? `?tenantId=${encodeURIComponent(selectedTenantId)}` : '';

      const [classesRes, sectionsRes, teachersRes, subjectsRes, studentsRes, ayRes] =
        await Promise.all([
          api.get<ClassOfferingOption[]>(`/api/subjects/classes?limit=100${tenantQuery}`),
          api.get<SectionItem[]>(`/api/sections?limit=100${tenantQuery}`),
          api.get<TeacherOption[]>(`/api/teachers?limit=100${tenantQuery}`),
          api.get<SubjectOption[]>(`/api/subjects?limit=100${tenantQuery}`),
          api.get<StudentOption[]>(`/api/students?limit=250&status=ACTIVE${tenantQuery}`),
          api.get<any[]>(`/api/sections/academic-years${ayTenantQuery}`).catch(() => ({ success: false, data: [] })),
        ]);

      if (classesRes.success && classesRes.data) {
        setClasses(classesRes.data);
        if (classesRes.data.length > 0) {
          if (!selectedClassId || !classesRes.data.some((c) => c.id === selectedClassId)) {
            setSelectedClassId(classesRes.data[0].id);
          }
        } else {
          setSelectedClassId('');
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
      if (studentsRes.success && studentsRes.data) {
        setAllStudents(studentsRes.data);
      }
      if (ayRes?.success && ayRes?.data && ayRes.data.length > 0) {
        setAcademicYears(ayRes.data);
        const curr = ayRes.data.find((a: any) => a.isCurrent);
        if (curr) {
          setCreateSectionForm((prev) => ({ ...prev, schoolYear: curr.name }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedClassId, selectedTenantId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // Load section details when transitioning into enlistStudents or enlistSubjects
  const loadSectionRosterAndClasses = useCallback(async (sectionId: string) => {
    try {
      const [secRes, classRes] = await Promise.all([
        api.get<SectionItem>(`/api/sections/${sectionId}`),
        api.get<ClassOfferingOption[]>(`/api/subjects/classes?sectionId=${sectionId}`),
      ]);
      if (secRes.success && secRes.data) {
        setActiveSection(secRes.data);
        setEnlistedStudents(secRes.data.students || []);
      }
      if (classRes.success && classRes.data) {
        setSectionClasses(classRes.data);
      }
    } catch (err) {
      console.error('Failed to load section roster & classes:', err);
    }
  }, []);

  // 2. Fetch Grades Matrix for selected class
  const fetchGradesMatrix = useCallback(
    async (classId: string) => {
      if (!classId) return;
      setMatrixLoading(true);
      try {
        const res = await api.get<MatrixResponse>(`/api/grades/classes/${classId}/matrix`);
        if (res.success && res.data) {
          setMatrixData(res.data);
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
    if (selectedClassId && viewMode === 'gradesheet') {
      fetchGradesMatrix(selectedClassId);
    }
  }, [selectedClassId, viewMode, fetchGradesMatrix]);

  // ==========================================
  // NAVIGATION ACTIONS
  // ==========================================

  const handleNavigateToEnlistStudents = (sec: SectionItem) => {
    setActiveSection(sec);
    setOpenDropdownId(null);
    setStudentSearchQuery('');
    loadSectionRosterAndClasses(sec.id);
    setViewMode('enlistStudents');
  };

  const handleNavigateToEnlistSubjects = (sec: SectionItem) => {
    setActiveSection(sec);
    setOpenDropdownId(null);
    loadSectionRosterAndClasses(sec.id);
    setViewMode('enlistSubjects');
  };

  const handleNavigateToGradesheet = (sec: SectionItem) => {
    setOpenDropdownId(null);
    const matchingClass = classes.find((c) => c.section?.id === sec.id);
    if (matchingClass) {
      setSelectedClassId(matchingClass.id);
    }
    setViewMode('gradesheet');
  };

  // ==========================================
  // QUICK ENLIST STUDENT FROM SEARCH BAR
  // ==========================================

  // Candidate students not yet enlisted in activeSection
  const candidateStudents = useMemo(() => {
    if (!studentSearchQuery.trim()) return [];
    const q = studentSearchQuery.toLowerCase();
    const enrolledIds = new Set(enlistedStudents.map((es) => es.studentId || es.student?.id));

    return allStudents
      .filter((s) => !enrolledIds.has(s.id))
      .filter(
        (s) =>
          s.lastName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          s.studentId.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [allStudents, enlistedStudents, studentSearchQuery]);

  const handleQuickEnlistStudent = async (student: StudentOption) => {
    if (!activeSection) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/api/sections/${activeSection.id}/students`, {
        studentIds: [student.id],
      });
      if (res.success) {
        setSuccessMsg(`Enlisted ${student.firstName} ${student.lastName} into Section ${activeSection.name}!`);
        setStudentSearchQuery('');
        loadSectionRosterAndClasses(activeSection.id);
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to enlist student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enlisting student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (studentId: string, studentName: string) => {
    if (!activeSection) return;
    if (!confirm(`Are you sure you want to drop ${studentName} from Section ${activeSection.name}?`))
      return;
    try {
      const res = await api.delete(`/api/sections/${activeSection.id}/students/${studentId}`);
      if (res.success) {
        setSuccessMsg(`Removed ${studentName} from Section.`);
        loadSectionRosterAndClasses(activeSection.id);
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to remove student');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing student');
    }
  };

  // ==========================================
  // DRAG & DROP / REORDER SUBJECTS
  // ==========================================

  const moveSubjectOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sectionClasses.length) return;

    const updated = [...sectionClasses];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);
    setSectionClasses(updated);
    setSuccessMsg('Subject schedule order updated!');
    setTimeout(() => setSuccessMsg(null), 2500);
  };

  // Create Grade & Section Submit Handler
  const handleCreateSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createSectionForm.name.trim()) {
      setErrorMsg('Please enter a section name.');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const isSHS =
        createSectionForm.gradeLevel === 'Grade 11' ||
        createSectionForm.gradeLevel === 'Grade 12';

      const payload = {
        name: createSectionForm.name.trim(),
        gradeLevel: createSectionForm.gradeLevel,
        schoolYear: createSectionForm.schoolYear,
        room: createSectionForm.room.trim() || undefined,
        capacity: Number(createSectionForm.capacity) || 40,
        adviserId: createSectionForm.adviserId || undefined,
        track: isSHS ? createSectionForm.track : undefined,
        strand: isSHS ? createSectionForm.strand : undefined,
        tenantId: createSectionForm.tenantId || selectedTenantId || user?.tenantId || undefined,
      };

      const res = await api.post('/api/sections', payload);
      if (res.success) {
        setSuccessMsg(`Section ${createSectionForm.name} created successfully!`);
        setIsCreateSectionModalOpen(false);
        setCreateSectionForm({
          tenantId: '',
          schoolYear: academicYears[0]?.name || '2026-2027',
          gradeLevel: 'Grade 7',
          name: '',
          track: 'Academic',
          strand: 'STEM',
          room: '',
          capacity: 40,
          adviserId: '',
        });
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to create section');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error creating section');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Add Subject Modal
  const handleOpenAddSubjectModal = () => {
    if (!activeSection) return;
    setAddSubjectForm({
      subjectId: subjects[0]?.id || '',
      teacherId: teachers[0]?.id || '',
      classCode: `${activeSection.name.toUpperCase().slice(0, 4)}-${subjects[0]?.code || 'SUBJ'}`,
      room: activeSection.room || 'Room 201',
      capacity: activeSection.capacity || 40,
      days: [DayOfWeek.MONDAY, DayOfWeek.WEDNESDAY, DayOfWeek.FRIDAY],
      startTime: '08:00',
      endTime: '09:30',
    });
    setIsAddSubjectModalOpen(true);
  };

  const handleAddSubjectSubmit = async () => {
    if (!activeSection || !addSubjectForm.subjectId) {
      setErrorMsg('Please select a subject');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload = {
        subjectId: addSubjectForm.subjectId,
        sectionId: activeSection.id,
        teacherId: addSubjectForm.teacherId || undefined,
        classCode: addSubjectForm.classCode || `${activeSection.name}-SUBJ`,
        room: addSubjectForm.room,
        capacity: Number(addSubjectForm.capacity),
        scheduleSlots: addSubjectForm.days.map((day) => ({
          dayOfWeek: day,
          startTime: addSubjectForm.startTime,
          endTime: addSubjectForm.endTime,
          room: addSubjectForm.room,
        })),
      };

      const res = await api.post('/api/subjects/classes', payload);
      if (res.success) {
        setSuccessMsg(`Subject offering enlisted for Section ${activeSection.name}!`);
        setIsAddSubjectModalOpen(false);
        loadSectionRosterAndClasses(activeSection.id);
        fetchInitialData();
      } else {
        setErrorMsg(res.message || 'Failed to enlist subject');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enlisting subject');
    } finally {
      setSubmitting(false);
    }
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
        !classListSearch.trim() ||
        sec.name.toLowerCase().includes(classListSearch.toLowerCase()) ||
        sec.gradeLevel.toLowerCase().includes(classListSearch.toLowerCase()) ||
        (sec.adviser &&
          `${sec.adviser.firstName} ${sec.adviser.lastName}`
            .toLowerCase()
            .includes(classListSearch.toLowerCase()));
      return matchesGrade && matchesSearch;
    });
  }, [sections, classListGradeFilter, classListSearch]);

  if (!loading && !canViewClassList) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3 animate-fade-in shadow-sm">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          You do not have permission to access the Class List and Trimestral Gradesheet module. Please contact your school administrator or registrar if you believe this is an error.
        </p>
      </div>
    );
  }

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

      {/* Header & Mode Switcher */}
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
            onClick={() => setViewMode('classList')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'classList'
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
              setViewMode('gradesheet');
              if (selectedClassId) fetchGradesMatrix(selectedClassId);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              viewMode === 'gradesheet'
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
          VIEW 1: CLASS LIST TABLE WITH ACTIONS DROPDOWN
          ========================================== */}
      {viewMode === 'classList' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Stats Summary */}
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

          {/* Filter and Search Bar with Create Section Button */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search class by section name or adviser..."
                value={classListSearch}
                onChange={(e) => setClassListSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Super Admin School Switcher */}
              {isSuperAdmin && schools.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="text-slate-500 font-bold hidden sm:inline">School:</span>
                  <select
                    aria-label="Filter by School"
                    value={selectedTenantId}
                    onChange={(e) => handleTenantChange(e.target.value)}
                    className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer pr-1"
                  >
                    <option value="">🌐 All Schools (Global)</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏫 {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

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

              {canCreateSection && (
                <button
                  type="button"
                  onClick={() => setIsCreateSectionModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm shrink-0 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Grade & Section</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Listing of Sections with Actions Dropdown */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3.5 px-4">#</th>
                    <th className="py-3.5 px-4">Grade Level & Track</th>
                    <th className="py-3.5 px-4">Section Name</th>
                    {(!selectedTenantId || isSuperAdmin) && (
                      <th className="py-3.5 px-4">School</th>
                    )}
                    <th className="py-3.5 px-4">School Year</th>
                    <th className="py-3.5 px-4">Room Location</th>
                    <th className="py-3.5 px-4">Class Adviser</th>
                    <th className="py-3.5 px-4">Student Roster</th>
                    <th className="py-3.5 px-4">Enlisted Subjects</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
                  {filteredSections.map((sec, idx) => {
                    const capacityPercent = Math.min(
                      100,
                      Math.round(((sec.studentCount || 0) / (sec.capacity || 40)) * 100),
                    );
                    const isDropdownOpen = openDropdownId === sec.id;
                    const assignedClassCount = classes.filter((c) => c.section?.id === sec.id).length;

                    return (
                      <tr key={sec.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                              {sec.gradeLevel}
                            </span>
                            {(sec.track || sec.strand) && (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-100 font-mono">
                                {sec.track ? `${sec.track} • ` : ''}{sec.strand}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                          Section {sec.name}
                        </td>
                        {(!selectedTenantId || isSuperAdmin) && (
                          <td className="py-4 px-4">
                            <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-md inline-flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-slate-500" />
                              {sec.tenant?.name || 'School'}
                            </span>
                          </td>
                        )}
                        <td className="py-4 px-4">
                          <span className="text-xs font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            {sec.academicYear?.name || '2026-2027'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-600 font-medium">
                          {sec.room || 'Room TBA'}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-semibold text-slate-900">
                            {sec.adviser
                              ? `${sec.adviser.firstName} ${sec.adviser.lastName}`
                              : <span className="text-slate-400 italic">No Adviser Assigned</span>}
                          </div>
                          {sec.adviser && (
                            <div className="text-[10px] text-slate-500 font-mono">
                              {sec.adviser.employeeId}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <div className="w-36 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-slate-800">
                                {sec.studentCount || 0} / {sec.capacity || 40}
                              </span>
                              <span className="text-slate-500 font-mono">
                                {capacityPercent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100">
                            {assignedClassCount} Subjects
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right relative">
                          {/* Actions Dropdown Button */}
                          <div className="inline-block text-left">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenDropdownId(isDropdownOpen ? null : sec.id)
                              }
                              className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-200"
                              aria-label={`Actions for Section ${sec.name}`}
                            >
                              <span>Actions</span>
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {/* Dropdown Menu Popup */}
                            {isDropdownOpen && (
                              <div className="absolute right-4 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-scale-in text-left">
                                <button
                                  type="button"
                                  onClick={() => handleNavigateToEnlistStudents(sec)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors cursor-pointer"
                                >
                                  <UserPlus className="w-4 h-4 text-emerald-600" />
                                  <span>Enlist Students</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleNavigateToEnlistSubjects(sec)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span>Enlist / Manage Subjects</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => handleNavigateToGradesheet(sec)}
                                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors cursor-pointer"
                                >
                                  <GraduationCap className="w-4 h-4 text-purple-600" />
                                  <span>Trimestral Gradesheet</span>
                                </button>
                              </div>
                            )}
                          </div>
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
          VIEW 2: DEDICATED ENLIST STUDENTS VIEW
          Top Search Bar + Bottom Enlisted Students Div
          ========================================== */}
      {viewMode === 'enlistStudents' && activeSection && (
        <div className="space-y-6 animate-fade-in">
          {/* Section Breadcrumb Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('classList')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Back to Class List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                    {activeSection.gradeLevel}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeSection.room || 'Room TBA'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Enlist Students — Section {activeSection.name}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px]">Class Adviser:</span>
                <span className="font-bold text-slate-900">
                  {activeSection.adviser
                    ? `${activeSection.adviser.firstName} ${activeSection.adviser.lastName}`
                    : 'No Adviser'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-slate-500 block text-[10px]">Current Roster:</span>
                <span className="font-bold text-emerald-700">
                  {enlistedStudents.length} / {activeSection.capacity || 40} Learners
                </span>
              </div>
            </div>
          </div>

          {/* TOP SEARCH-TO-ENLIST BAR */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Search & Instant Enlist
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Search by learner name or LRN to instantly enlist into Section {activeSection.name}
            </p>

            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Type student name or LRN to enlist..."
                value={studentSearchQuery}
                onChange={(e) => setStudentSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
              />
            </div>

            {/* Candidate Search Results */}
            {studentSearchQuery.trim() !== '' && (
              <div className="border border-slate-200 rounded-xl bg-slate-50/50 p-2 space-y-1.5 max-h-64 overflow-y-auto">
                {candidateStudents.length > 0 ? (
                  candidateStudents.map((st) => (
                    <div
                      key={st.id}
                      className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-xs hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          {st.firstName.charAt(0)}
                          {st.lastName.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {st.lastName}, {st.firstName}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            LRN: {st.studentId} • {st.gender || 'MALE'}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleQuickEnlistStudent(st)}
                        disabled={submitting}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Enlist (+)</span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-slate-500">
                    No matching unassigned students found.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* BOTTOM DIV: ENLISTED STUDENTS ROSTER */}
          <div
            id="enlisted-students-roster-div"
            className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Enlisted Students on Current Section ({enlistedStudents.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Section {activeSection.name} • {activeSection.gradeLevel}
              </span>
            </div>

            {enlistedStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4">LRN</th>
                      <th className="py-3 px-4">Gender</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {enlistedStudents.map((es, idx) => (
                      <tr key={es.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">
                            {es.student.lastName}, {es.student.firstName}{' '}
                            {es.student.middleName ? `${es.student.middleName.charAt(0)}.` : ''}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {es.student.studentId}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {es.student.gender || 'MALE'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {es.status || 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveStudent(
                                es.student.id,
                                `${es.student.firstName} ${es.student.lastName}`,
                              )
                            }
                            className="text-xs text-rose-600 hover:text-rose-800 font-semibold p-1 cursor-pointer flex items-center gap-1 ml-auto"
                            title="Drop from section"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No students enlisted yet</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Use the search bar above to find and enlist learners into Section {activeSection.name}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 3: DEDICATED ENLIST / MANAGE SUBJECTS VIEW
          Drag-and-Drop / Reordering Timetable List
          ========================================== */}
      {viewMode === 'enlistSubjects' && activeSection && (
        <div className="space-y-6 animate-fade-in">
          {/* Section Breadcrumb Header */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setViewMode('classList')}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Back to Class List"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                    {activeSection.gradeLevel}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeSection.room || 'Room TBA'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                  Enlist & Customize Subjects — Section {activeSection.name}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddSubjectModal}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subject Offering</span>
            </button>
          </div>

          {/* Draggable Subjects List Container */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Enlisted Subject Courses & Timetable Sequence
                </h3>
                <p className="text-xs text-slate-500">
                  Customize the period schedule order using the move buttons or drag handles
                </p>
              </div>
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                {sectionClasses.length} Subject Offerings
              </span>
            </div>

            {sectionClasses.length > 0 ? (
              <div className="space-y-3">
                {sectionClasses.map((sc, idx) => (
                  <div
                    key={sc.id}
                    className="flex items-center justify-between p-4 bg-slate-50/70 hover:bg-white border border-slate-200 rounded-xl transition-all shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      {/* Drag / Period Handle */}
                      <div className="flex items-center gap-1 text-slate-400">
                        <GripVertical className="w-5 h-5 cursor-grab" />
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-200 px-2 py-0.5 rounded">
                          Period {idx + 1}
                        </span>
                      </div>

                      {/* Course details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">
                            {sc.subject.name}
                          </span>
                          <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold">
                            {sc.classCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                          <span>
                            Teacher:{' '}
                            <strong className="text-slate-800">
                              {sc.teacher
                                ? `${sc.teacher.firstName} ${sc.teacher.lastName}`
                                : 'TBA'}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>{sc.room || 'Room 201'}</span>
                          <span>•</span>
                          <span>{sc.enrolledCount || 0} Enrolled</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Controls & Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSubjectOrder(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSubjectOrder(idx, 'down')}
                        disabled={idx === sectionClasses.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 disabled:opacity-30 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">No subjects enlisted yet</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click &ldquo;Add Subject Offering&rdquo; to assign curriculum subjects and timetables for Section {activeSection.name}.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==========================================
          VIEW 4: TRIMESTRAL GRADESHEET VIEW
          ========================================== */}
      {viewMode === 'gradesheet' && (
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
              <div className="text-xs font-semibold text-slate-700">
                Class Matrix: {matrixData?.subjectClass.subject.name || 'Subject'}{' '}
                ({matrixData?.subjectClass.classCode})
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
                  {matrixData?.students?.map((row, idx) => {
                    const score1 = getScoreForTerm(row, TRIMESTRAL_PERIODS[0]);
                    const score2 = getScoreForTerm(row, TRIMESTRAL_PERIODS[1]);
                    const score3 = getScoreForTerm(row, TRIMESTRAL_PERIODS[2]);

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
                        <td className="py-3.5 px-4 font-mono text-slate-500">{idx + 1}</td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">
                            {row.student.lastName}, {row.student.firstName}{' '}
                            {row.student.middleName ? `${row.student.middleName.charAt(0)}.` : ''}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
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
                                ? 'text-slate-500 bg-slate-100'
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
                            <span className="text-slate-400 text-[10px]">Incomplete</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => openReportCard(row.student.id)}
                            className="text-xs text-emerald-600 hover:text-emerald-800 font-bold p-1 cursor-pointer"
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
          MODAL: ADD SUBJECT OFFERING (For Section)
          ========================================== */}
      {isAddSubjectModalOpen && activeSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Enlist Subject Offering — Section {activeSection.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Select subject, faculty, and timetable schedule
                </p>
              </div>
              <button
                onClick={() => setIsAddSubjectModalOpen(false)}
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
                  value={addSubjectForm.subjectId}
                  onChange={(e) =>
                    setAddSubjectForm({ ...addSubjectForm, subjectId: e.target.value })
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
                  value={addSubjectForm.teacherId}
                  onChange={(e) =>
                    setAddSubjectForm({ ...addSubjectForm, teacherId: e.target.value })
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
                    value={addSubjectForm.room}
                    onChange={(e) =>
                      setAddSubjectForm({ ...addSubjectForm, room: e.target.value })
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
                    value={addSubjectForm.classCode}
                    onChange={(e) =>
                      setAddSubjectForm({ ...addSubjectForm, classCode: e.target.value })
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
                    value={addSubjectForm.startTime}
                    onChange={(e) =>
                      setAddSubjectForm({ ...addSubjectForm, startTime: e.target.value })
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
                    value={addSubjectForm.endTime}
                    onChange={(e) =>
                      setAddSubjectForm({ ...addSubjectForm, endTime: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAddSubjectModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSubjectSubmit}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors cursor-pointer"
              >
                Enlist Subject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: REPORT CARD (SF9)
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
                          <div className="text-[10px] text-slate-500">{s.subjectCode}</div>
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
              <span className="text-xs text-slate-500">
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

      {/* ==========================================
          MODAL: CREATE GRADE & SECTION
          ========================================== */}
      {isCreateSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Create Grade & Section
                </h3>
                <p className="text-xs text-slate-500">
                  Configure school year, grade level, adviser, and SHS track/strand
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSectionSubmit} className="py-4 space-y-3.5">
              {/* School / Campus (Tenant) Selector for Super Admin */}
              {isSuperAdmin && schools.length > 0 && (
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    School / Campus
                  </label>
                  <select
                    aria-label="Select Target School"
                    value={createSectionForm.tenantId || selectedTenantId || schools[0]?.id}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, tenantId: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        🏫 {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* School Year & Grade Level */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    School Year
                  </label>
                  <select
                    value={createSectionForm.schoolYear}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, schoolYear: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    {academicYears.length > 0 ? (
                      academicYears.map((ay) => (
                        <option key={ay.id} value={ay.name}>
                          {ay.name} {ay.isCurrent ? '(Current)' : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="2026-2027">2026-2027 (Current)</option>
                        <option value="2025-2026">2025-2026</option>
                        <option value="2027-2028">2027-2028</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Grade Level
                  </label>
                  <select
                    value={createSectionForm.gradeLevel}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, gradeLevel: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional SHS Track & Strand for Grade 11 & Grade 12 */}
              {(createSectionForm.gradeLevel === 'Grade 11' || createSectionForm.gradeLevel === 'Grade 12') && (
                <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2.5 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-900">
                      Senior High School Program Configuration
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                        Track
                      </label>
                      <select
                        value={createSectionForm.track}
                        onChange={(e) => {
                          const newTrack = e.target.value;
                          const found = SHS_TRACKS.find((t) => t.id === newTrack);
                          setCreateSectionForm({
                            ...createSectionForm,
                            track: newTrack,
                            strand: found?.strands[0]?.id || 'General',
                          });
                        }}
                        className="w-full text-xs px-3 py-2 border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {SHS_TRACKS.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-purple-900 block mb-1">
                        Strand / Specialization
                      </label>
                      <select
                        value={createSectionForm.strand}
                        onChange={(e) =>
                          setCreateSectionForm({ ...createSectionForm, strand: e.target.value })
                        }
                        className="w-full text-xs px-3 py-2 border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                      >
                        {(
                          SHS_TRACKS.find((t) => t.id === createSectionForm.track)?.strands ||
                          SHS_TRACKS[0].strands
                        ).map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Name & Room Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Section Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Diamond, STEM-A, Rizal"
                    value={createSectionForm.name}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, name: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Classroom / Room
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Room 204, Bldg B"
                    value={createSectionForm.room}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, room: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Teacher / Faculty Adviser & Target Capacity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Faculty Adviser
                  </label>
                  <select
                    value={createSectionForm.adviserId}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, adviserId: e.target.value })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  >
                    <option value="">No Adviser Assigned (TBA)</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Capacity Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={createSectionForm.capacity}
                    onChange={(e) =>
                      setCreateSectionForm({ ...createSectionForm, capacity: Number(e.target.value) })
                    }
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateSectionModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {submitting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>Save Section</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
