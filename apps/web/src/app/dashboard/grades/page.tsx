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
} from 'lucide-react';
import { GradingPeriod } from '@school-saas/shared';

interface ClassOfferingOption {
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

interface SectionOption {
  id: string;
  name: string;
  gradeLevel: string;
  studentCount: number;
}

interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

interface StudentGradeRow {
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

interface MatrixResponse {
  subjectClass: ClassOfferingOption;
  totalEnrolled: number;
  classAverage: number | null;
  students: StudentGradeRow[];
}

interface ReportCardResponse {
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

const QUARTER_PERIODS: GradingPeriod[] = [
  GradingPeriod.Q1,
  GradingPeriod.Q2,
  GradingPeriod.Q3,
  GradingPeriod.Q4,
];

export default function GradesPage() {
  const [classes, setClasses] = useState<ClassOfferingOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [availableStudents, setAvailableStudents] = useState<StudentOption[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [matrixData, setMatrixData] = useState<MatrixResponse | null>(null);

  // Local editable grade scores state: key = `${studentId}_${period}`, value = score string
  const [localScores, setLocalScores] = useState<Record<string, string>>({});
  const [activePeriod, setActivePeriod] = useState<GradingPeriod>(GradingPeriod.Q1);

  const [loading, setLoading] = useState(true);
  const [matrixLoading, setMatrixLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  // Modals
  const [isSectionEnrollModalOpen, setIsSectionEnrollModalOpen] = useState(false);
  const [isStudentEnrollModalOpen, setIsStudentEnrollModalOpen] = useState(false);
  const [isReportCardModalOpen, setIsReportCardModalOpen] = useState(false);
  const [reportCardData, setReportCardData] = useState<ReportCardResponse | null>(null);

  // Selected for enrollment
  const [targetSectionId, setTargetSectionId] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch Class Offerings & Sections on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [classesRes, sectionsRes] = await Promise.all([
          api.get<ClassOfferingOption[]>('/api/subjects/classes?limit=100'),
          api.get<SectionOption[]>('/api/sections?limit=100'),
        ]);

        if (classesRes.success && classesRes.data && classesRes.data.length > 0) {
          setClasses(classesRes.data);
          setSelectedClassId(classesRes.data[0].id);
        }
        if (sectionsRes.success && sectionsRes.data) {
          setSections(sectionsRes.data);
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Fetch Grades Matrix when selectedClassId changes
  const fetchGradesMatrix = useCallback(async (classId: string) => {
    if (!classId) return;
    setMatrixLoading(true);
    try {
      const res = await api.get<MatrixResponse>(`/api/grades/classes/${classId}/matrix`);
      if (res.success && res.data) {
        setMatrixData(res.data);
        // Pre-populate local scores dictionary
        const initialScores: Record<string, string> = {};
        res.data.students.forEach((row) => {
          QUARTER_PERIODS.forEach((period) => {
            const entry = row.grades[period];
            if (entry && entry.score !== undefined) {
              initialScores[`${row.student.id}_${period}`] = String(entry.score);
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
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchGradesMatrix(selectedClassId);
    }
  }, [selectedClassId, fetchGradesMatrix]);

  // Load available students for single enrollment
  const openStudentEnrollModal = async () => {
    try {
      const res = await api.get<StudentOption[]>('/api/students?limit=150&status=ACTIVE');
      if (res.success && res.data) {
        // Exclude learners already enrolled
        const enrolledStudentIds = new Set(matrixData?.students.map((s) => s.student.id) || []);
        setAvailableStudents(res.data.filter((s) => !enrolledStudentIds.has(s.id)));
        setSelectedStudentIds([]);
        setIsStudentEnrollModalOpen(true);
      }
    } catch {
      setErrorMsg('Failed to load learners list');
    }
  };

  // Open Section Bulk Enroll Modal
  const openSectionEnrollModal = () => {
    if (matrixData?.subjectClass.section) {
      setTargetSectionId(matrixData.subjectClass.section.id);
    } else if (sections.length > 0) {
      setTargetSectionId(sections[0].id);
    }
    setIsSectionEnrollModalOpen(true);
  };

  // Submit Section Bulk Enrollment
  const handleSectionEnrollSubmit = async () => {
    if (!selectedClassId || !targetSectionId) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/api/grades/classes/${selectedClassId}/enroll`, {
        sectionId: targetSectionId,
      });
      if (res.success) {
        setSuccessMsg(res.message || 'Enrolled entire section into subject offering!');
        setIsSectionEnrollModalOpen(false);
        fetchGradesMatrix(selectedClassId);
      } else {
        setErrorMsg(res.message || 'Failed to enroll section');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred while enrolling section');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Individual Learners Enrollment
  const handleStudentEnrollSubmit = async () => {
    if (!selectedClassId || selectedStudentIds.length === 0) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.post(`/api/grades/classes/${selectedClassId}/enroll`, {
        studentIds: selectedStudentIds,
      });
      if (res.success) {
        setSuccessMsg(`Enrolled ${selectedStudentIds.length} learner(s) successfully!`);
        setIsStudentEnrollModalOpen(false);
        fetchGradesMatrix(selectedClassId);
      } else {
        setErrorMsg(res.message || 'Failed to enroll learners');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error enrolling learners');
    } finally {
      setSubmitting(false);
    }
  };

  // Drop / Unenroll Learner
  const handleUnenroll = async (studentId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to drop ${studentName} from this class?`)) return;
    try {
      const res = await api.delete(`/api/grades/classes/${selectedClassId}/enroll/${studentId}`);
      if (res.success) {
        setSuccessMsg(`Learner ${studentName} removed from class.`);
        fetchGradesMatrix(selectedClassId);
      } else {
        setErrorMsg(res.message || 'Failed to remove learner');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error removing learner');
    }
  };

  // Handle Score Input Change
  const handleScoreChange = (studentId: string, period: GradingPeriod, val: string) => {
    // Only allow numbers and up to 1 decimal place, max 100
    if (val === '' || (!isNaN(Number(val)) && Number(val) <= 100 && Number(val) >= 0)) {
      setLocalScores((prev) => ({
        ...prev,
        [`${studentId}_${period}`]: val,
      }));
    }
  };

  // Save Batch Grades (Draft)
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
        setErrorMsg(`No scores entered for ${activePeriod} to save.`);
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
            ? `Grades for ${activePeriod} published successfully!`
            : `Draft grades for ${activePeriod} saved successfully!`,
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

  // Filter matrix students by search query
  const filteredStudents = useMemo(() => {
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
            <GraduationCap className="w-7 h-7 text-emerald-600" />
            Academic Grading & Subject Enrollment
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Encode DepEd quarterly marks, enroll section cohorts, compute final general averages, and publish grade sheets.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={openSectionEnrollModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-xl border border-slate-200 shadow-xs text-sm transition"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            Enroll Entire Section
          </button>
          <button
            onClick={openStudentEnrollModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm hover:shadow transition text-sm"
          >
            <UserPlus className="w-4 h-4" />
            Enroll Learner
          </button>
        </div>
      </div>

      {/* Class Selector & Header Info Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="w-full md:w-96">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Select Class Offering
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.classCode} &bull; {c.subject.name} {c.section ? `(${c.section.name})` : ''}
                </option>
              ))}
            </select>
          </div>

          {matrixData && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Faculty Teacher</span>
                <strong className="text-slate-800">
                  {matrixData.subjectClass.teacher
                    ? `${matrixData.subjectClass.teacher.firstName} ${matrixData.subjectClass.teacher.lastName}`
                    : 'Unassigned'}
                </strong>
              </div>

              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Assigned Section</span>
                <strong className="text-slate-800">
                  {matrixData.subjectClass.section
                    ? `${matrixData.subjectClass.section.name} (${matrixData.subjectClass.section.gradeLevel})`
                    : 'Open Cohort'}
                </strong>
              </div>

              <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                <span className="text-slate-400 block">Total Enrolled</span>
                <strong className="text-slate-800">
                  {matrixData.totalEnrolled} / {matrixData.subjectClass.capacity || 45}
                </strong>
              </div>

              <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200/60">
                <span className="text-emerald-700 font-medium block">Class Average</span>
                <strong className="text-emerald-900 text-sm">
                  {matrixData.classAverage ? `${matrixData.classAverage}%` : 'N/A'}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* Grading Period Tabs (Q1, Q2, Q3, Q4) */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            {QUARTER_PERIODS.map((period) => (
              <button
                key={period}
                onClick={() => setActivePeriod(period)}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition ${
                  activePeriod === period
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {period} Grading
              </button>
            ))}
          </div>

          {/* Action buttons: Save Draft & Publish */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSaveGrades(false)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-xs transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              Save {activePeriod} Draft
            </button>
            <button
              onClick={() => handleSaveGrades(true)}
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              Publish {activePeriod}
            </button>
          </div>
        </div>
      </div>

      {/* Grade Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
          <div className="relative w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search enrolled learner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Pass mark: <strong className="text-slate-700">75.00</strong> (DepEd K-12 Standard)
          </div>
        </div>

        {matrixLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            Loading grade sheet...
          </div>
        ) : !matrixData || filteredStudents.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">No learners enrolled in this subject class</p>
            <p className="text-xs text-slate-400 mt-1">
              Click &quot;Enroll Entire Section&quot; or &quot;Enroll Learner&quot; to populate the grading sheet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Learner / LRN</th>
                  <th className="px-3 py-3.5 text-center w-24">Q1</th>
                  <th className="px-3 py-3.5 text-center w-24">Q2</th>
                  <th className="px-3 py-3.5 text-center w-24">Q3</th>
                  <th className="px-3 py-3.5 text-center w-24">Q4</th>
                  <th className="px-4 py-3.5 text-center w-28">Final Avg</th>
                  <th className="px-4 py-3.5 text-center w-28">Remarks</th>
                  <th className="px-4 py-3.5 text-center w-24">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((row) => {
                  // Calculate dynamic final average from local edited scores
                  const scores = QUARTER_PERIODS.map((p) => {
                    const str = localScores[`${row.student.id}_${p}`];
                    return str !== undefined && str !== '' ? Number(str) : null;
                  }).filter((n): n is number => n !== null);

                  const liveAvg =
                    scores.length > 0
                      ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
                      : row.finalAverage;

                  const liveRemarks =
                    liveAvg !== null ? (liveAvg >= 75.0 ? 'PASSED' : 'FAILED') : row.remarks;

                  const isCurrentPublished = row.grades[activePeriod]?.isPublished;

                  return (
                    <tr key={row.enrollmentId} className="hover:bg-slate-50/80 transition">
                      {/* Student info */}
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {row.student.lastName}, {row.student.firstName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {row.student.studentId}
                        </div>
                      </td>

                      {/* Q1-Q4 Editable Inputs */}
                      {QUARTER_PERIODS.map((period) => {
                        const scoreVal = localScores[`${row.student.id}_${period}`] ?? '';
                        const isFieldActive = activePeriod === period;

                        return (
                          <td key={period} className="px-2 py-3 text-center">
                            <input
                              type="text"
                              value={scoreVal}
                              onChange={(e) =>
                                handleScoreChange(row.student.id, period, e.target.value)
                              }
                              placeholder="--"
                              className={`w-16 px-2 py-1 text-center font-mono text-xs rounded-lg border transition ${
                                isFieldActive
                                  ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 font-bold focus:ring-2 focus:ring-emerald-500'
                                  : 'border-slate-200 bg-slate-50 text-slate-700'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Final Average */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 text-xs">
                        {liveAvg !== null ? `${liveAvg}%` : '--'}
                      </td>

                      {/* DepEd Passing Remarks */}
                      <td className="px-4 py-3 text-center">
                        {liveRemarks ? (
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                              liveRemarks === 'PASSED'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {liveRemarks}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">--</span>
                        )}
                      </td>

                      {/* Period Publishing status */}
                      <td className="px-4 py-3 text-center">
                        {isCurrentPublished ? (
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-semibold border border-emerald-200">
                            Published
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md font-semibold border border-amber-200">
                            Draft
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openReportCard(row.student.id)}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition"
                            title="View Student Report Card"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleUnenroll(
                                row.student.id,
                                `${row.student.firstName} ${row.student.lastName}`,
                              )
                            }
                            className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="Drop from subject"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ENROLL ENTIRE SECTION MODAL */}
      {isSectionEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enroll Entire Section</h3>
                  <p className="text-xs text-slate-500">Auto-enroll all active learners from a section</p>
                </div>
              </div>
              <button
                onClick={() => setIsSectionEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Choose Section Roster *
                </label>
                <select
                  value={targetSectionId}
                  onChange={(e) => setTargetSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.gradeLevel}) &bull; {s.studentCount} Students
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-800">
                All currently active students registered in this section will be linked to class offering{' '}
                <strong>{matrixData?.subjectClass.classCode}</strong>.
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsSectionEnrollModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting || !targetSectionId}
                onClick={handleSectionEnrollSubmit}
                className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {submitting ? 'Enrolling...' : 'Enroll Section Learners'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENROLL INDIVIDUAL LEARNER MODAL */}
      {isStudentEnrollModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Enroll Learners</h3>
                <p className="text-xs text-slate-500">
                  Select students to add to {matrixData?.subjectClass.classCode}
                </p>
              </div>
              <button
                onClick={() => setIsStudentEnrollModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
              {availableStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No other active students available to enroll.
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
                  onClick={() => setIsStudentEnrollModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || selectedStudentIds.length === 0}
                  onClick={handleStudentEnrollSubmit}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {submitting ? 'Enrolling...' : `Enroll (${selectedStudentIds.length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT REPORT CARD MODAL (DEPED FORM 138-INSPIRED) */}
      {isReportCardModalOpen && reportCardData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Student Progress Report Card</h3>
                  <p className="text-xs text-slate-500">DepEd Form 138 Certified Academic Transcript</p>
                </div>
              </div>
              <button
                onClick={() => setIsReportCardModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Learner Info Header */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block">Learner Name:</span>
                <strong className="text-slate-800">{reportCardData.student.fullName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">LRN / Student No:</span>
                <strong className="text-slate-800 font-mono">{reportCardData.student.studentId}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Grade & Section:</span>
                <strong className="text-slate-800">
                  {reportCardData.student.gradeLevel} - {reportCardData.student.currentSection}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block">Academic Year:</span>
                <strong className="text-slate-800">{reportCardData.student.academicYear}</strong>
              </div>
            </div>

            {/* Subjects & Grades Table */}
            <div className="mt-5 border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                  <tr>
                    <th className="px-3 py-2.5">Learning Area / Subject</th>
                    <th className="px-2 py-2.5 text-center">Units</th>
                    <th className="px-2 py-2.5 text-center">Q1</th>
                    <th className="px-2 py-2.5 text-center">Q2</th>
                    <th className="px-2 py-2.5 text-center">Q3</th>
                    <th className="px-2 py-2.5 text-center">Q4</th>
                    <th className="px-2 py-2.5 text-center">Final</th>
                    <th className="px-3 py-2.5 text-center">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportCardData.subjects.map((s, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5">
                        <strong className="text-slate-900 block">{s.subjectName}</strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {s.subjectCode} &bull; {s.teacher}
                        </span>
                      </td>
                      <td className="px-2 py-2.5 text-center font-mono">{s.credits}</td>
                      <td className="px-2 py-2.5 text-center font-mono">{s.grades.Q1 ?? '--'}</td>
                      <td className="px-2 py-2.5 text-center font-mono">{s.grades.Q2 ?? '--'}</td>
                      <td className="px-2 py-2.5 text-center font-mono">{s.grades.Q3 ?? '--'}</td>
                      <td className="px-2 py-2.5 text-center font-mono">{s.grades.Q4 ?? '--'}</td>
                      <td className="px-2 py-2.5 text-center font-mono font-bold text-slate-900">
                        {s.finalGrade ? `${s.finalGrade}%` : '--'}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            s.remarks === 'PASSED'
                              ? 'bg-emerald-50 text-emerald-700'
                              : s.remarks === 'FAILED'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {s.remarks}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* General Average Summary */}
            <div className="mt-4 p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 block">General Average</span>
                <strong className="text-xl font-bold text-emerald-950">
                  {reportCardData.generalAverage ? `${reportCardData.generalAverage}%` : 'In Progress'}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Action / Eligibility</span>
                <strong
                  className={`text-sm font-bold ${
                    reportCardData.remarks === 'PROMOTED'
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {reportCardData.remarks}
                </strong>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Export
              </button>
              <button
                onClick={() => setIsReportCardModalOpen(false)}
                className="px-4 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-900 text-white rounded-xl"
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
