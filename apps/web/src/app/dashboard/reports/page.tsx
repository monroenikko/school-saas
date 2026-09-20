'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Printer,
  Download,
  Users,
  CalendarCheck,
  GraduationCap,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  Layers,
  ChevronDown,
} from 'lucide-react';

interface SectionOption {
  id: string;
  name: string;
  gradeLevel: string;
}

interface StudentOption {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
}

type ReportType = 'SF1' | 'SF2' | 'SF9' | 'FINANCIAL';

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('SF1');
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  // Date filters
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Report Data States
  const [loading, setLoading] = useState<boolean>(true);
  const [reportData, setReportData] = useState<any>(null);

  // 1. Fetch sections & students for filter selectors
  useEffect(() => {
    api.request<{ data: SectionOption[] }>('/api/sections')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setSections(res.data.data);
          if (!selectedSectionId) {
            setSelectedSectionId(res.data.data[0].id);
          }
        }
      })
      .catch(() => {});

    api.request<{ data: StudentOption[] }>('/api/students?limit=100')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          setStudents(res.data.data);
          if (!selectedStudentId) {
            setSelectedStudentId(res.data.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, [selectedSectionId, selectedStudentId]);

  // 2. Fetch Report Content
  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      if (activeReport === 'SF1') {
        const query = selectedSectionId ? `?sectionId=${selectedSectionId}` : '';
        const res = await api.request(`/api/reports/sf1${query}`);
        setReportData(res.data);
      } else if (activeReport === 'SF2') {
        const queryParams = new URLSearchParams();
        if (selectedSectionId) queryParams.set('sectionId', selectedSectionId);
        queryParams.set('month', selectedMonth.toString());
        queryParams.set('year', selectedYear.toString());
        const res = await api.request(`/api/reports/sf2?${queryParams.toString()}`);
        setReportData(res.data);
      } else if (activeReport === 'SF9') {
        if (selectedStudentId) {
          const res = await api.request(`/api/reports/sf9/${selectedStudentId}`);
          setReportData(res.data);
        }
      } else if (activeReport === 'FINANCIAL') {
        const queryParams = new URLSearchParams();
        if (startDate) queryParams.set('startDate', startDate);
        if (endDate) queryParams.set('endDate', endDate);
        const res = await api.request(`/api/reports/financial?${queryParams.toString()}`);
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
    } finally {
      setLoading(false);
    }
  }, [activeReport, selectedSectionId, selectedStudentId, selectedMonth, selectedYear, startDate, endDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const queryParams = new URLSearchParams();
    queryParams.set('type', activeReport);
    if (selectedSectionId) queryParams.set('sectionId', selectedSectionId);
    if (selectedStudentId) queryParams.set('studentId', selectedStudentId);
    queryParams.set('month', selectedMonth.toString());
    queryParams.set('year', selectedYear.toString());

    window.open(`/api/reports/export-csv?${queryParams.toString()}`, '_blank');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Print Control (Hidden during physical print) */}
      <div className="print:hidden space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  School Reports & DepEd Forms Generator
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Official DepEd compliance registers, daily attendance ledgers, quarterly report cards, and financial statements.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form / Save PDF</span>
            </button>
          </div>
        </div>

        {/* 4 Report Template Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* SF1 */}
          <button
            onClick={() => setActiveReport('SF1')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeReport === 'SF1'
                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                DepEd Form SF1
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100/70 text-emerald-700 flex items-center justify-center">
                <Users className="w-3.5 h-3.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-2">School Register</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Master student roster with LRN, gender segregation, birthdate, age, and guardian contacts.
            </p>
          </button>

          {/* SF2 */}
          <button
            onClick={() => setActiveReport('SF2')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeReport === 'SF2'
                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
                DepEd Form SF2
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-100/70 text-blue-700 flex items-center justify-center">
                <CalendarCheck className="w-3.5 h-3.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-2">Daily Attendance Report</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Monthly day-by-day attendance grid, daily P/A/L marks, total presence & attendance rate.
            </p>
          </button>

          {/* SF9 */}
          <button
            onClick={() => setActiveReport('SF9')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeReport === 'SF9'
                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">
                DepEd SF9 / Form 138
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-100/70 text-purple-700 flex items-center justify-center">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-2">Progress Report Card</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Quarterly subject grades, final ratings, general average, DepEd descriptors & attendance.
            </p>
          </button>

          {/* FINANCIAL */}
          <button
            onClick={() => setActiveReport('FINANCIAL')}
            className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
              activeReport === 'FINANCIAL'
                ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                Financial Audit
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100/70 text-amber-700 flex items-center justify-center">
                <DollarSign className="w-3.5 h-3.5" />
              </div>
            </div>
            <h2 className="text-sm font-bold text-slate-900 mt-2">Revenue & Collection Statement</h2>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
              Fee collection rate, tuition receivables, payment channel breakdowns, and receipts audit.
            </p>
          </button>
        </div>

        {/* Configuration & Filter Bar */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Section Filter (SF1 & SF2) */}
            {(activeReport === 'SF1' || activeReport === 'SF2') && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Section:</span>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.gradeLevel} - {sec.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Month & Year Filter (SF2) */}
            {activeReport === 'SF2' && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {[
                      'January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December',
                    ].map((m, idx) => (
                      <option key={m} value={idx + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Year:</span>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                    className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                  >
                    {[2025, 2026, 2027].map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* Student Filter (SF9) */}
            {activeReport === 'SF9' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Learner:</span>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.lastName}, {st.firstName} ({st.studentId})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date Range (Financial) */}
            {activeReport === 'FINANCIAL' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-600">Date Range:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700"
                />
              </div>
            )}
          </div>

          <button
            onClick={fetchReport}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Refresh Report Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* =========================================================
          PRINT CONTAINER: Official High-Fidelity DepEd Form Layouts
          ========================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 print:p-0 print:border-none print:shadow-none min-h-[600px]">
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
            Generating official compliance document...
          </div>
        ) : !reportData ? (
          <div className="py-24 text-center text-slate-400 text-xs">
            No report data found. Please select a section or student.
          </div>
        ) : (
          <div>
            {/* Common Official DepEd Document Letterhead Header */}
            <div className="text-center border-b border-slate-800 pb-4 mb-6">
              <p className="text-[11px] font-semibold text-slate-700 tracking-widest uppercase">
                Republic of the Philippines • Department of Education
              </p>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase mt-0.5">
                {reportData.school?.name || 'St. Jude International Academy'}
              </h2>
              <div className="flex items-center justify-center gap-4 text-xs text-slate-600 mt-1 flex-wrap">
                <span><strong>School ID:</strong> {reportData.school?.schoolId || '300412'}</span>
                <span><strong>District:</strong> {reportData.school?.district || 'Manila North'}</span>
                <span><strong>Division:</strong> {reportData.school?.division || 'City of Manila'}</span>
                <span><strong>School Year:</strong> {reportData.school?.schoolYear || '2026-2027'}</span>
              </div>
              <div className="inline-block mt-3 px-4 py-1 rounded-full bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800 uppercase tracking-wide">
                {activeReport === 'SF1' && 'School Form 1 (SF1) — School Register'}
                {activeReport === 'SF2' && `School Form 2 (SF2) — Daily Attendance (${reportData.month} ${reportData.year})`}
                {activeReport === 'SF9' && 'School Form 9 (SF9 / Form 138) — Learner\'s Progress Report Card'}
                {activeReport === 'FINANCIAL' && 'Official Financial Statement & Revenue Audit Ledger'}
              </div>
            </div>

            {/* 1. SF1 VIEW */}
            {activeReport === 'SF1' && (
              <div className="space-y-6 text-xs">
                {/* Section Details Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Grade & Section</span>
                    <p className="font-bold text-slate-800">{reportData.section?.gradeLevel} - {reportData.section?.name}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Room</span>
                    <p className="font-bold text-slate-800">{reportData.section?.room}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Class Adviser</span>
                    <p className="font-bold text-slate-800">{reportData.section?.adviserName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Enrollment</span>
                    <p className="font-bold text-emerald-600">{reportData.summary?.totalCount} Students</p>
                  </div>
                </div>

                {/* Male Learners Table */}
                <div>
                  <div className="bg-slate-100 px-3 py-1.5 border border-slate-300 font-bold text-slate-800 flex justify-between">
                    <span>MALE LEARNERS ({reportData.maleStudents?.length || 0})</span>
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead className="bg-slate-50 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-28">LRN</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left">Learner Name (Last, First, Middle)</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-24">Birthdate</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-12">Age</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-40">Guardian Name</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-28">Contact No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.maleStudents?.map((s: any, idx: number) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="border border-slate-300 py-1 px-2 font-mono font-semibold">{s.lrn}</td>
                          <td className="border border-slate-300 py-1 px-2 font-medium">{s.fullName}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center">{s.birthDate}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-bold">{s.age}</td>
                          <td className="border border-slate-300 py-1 px-2">{s.guardianName}</td>
                          <td className="border border-slate-300 py-1 px-2">{s.guardianContact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Female Learners Table */}
                <div>
                  <div className="bg-slate-100 px-3 py-1.5 border border-slate-300 font-bold text-slate-800 flex justify-between">
                    <span>FEMALE LEARNERS ({reportData.femaleStudents?.length || 0})</span>
                  </div>
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead className="bg-slate-50 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-8">#</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-28">LRN</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left">Learner Name (Last, First, Middle)</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-24">Birthdate</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-center w-12">Age</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-40">Guardian Name</th>
                        <th className="border border-slate-300 py-1.5 px-2 text-left w-28">Contact No.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.femaleStudents?.map((s: any, idx: number) => (
                        <tr key={s.id} className="hover:bg-slate-50/60">
                          <td className="border border-slate-300 py-1 px-2 text-center text-slate-500">{idx + 1}</td>
                          <td className="border border-slate-300 py-1 px-2 font-mono font-semibold">{s.lrn}</td>
                          <td className="border border-slate-300 py-1 px-2 font-medium">{s.fullName}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center">{s.birthDate}</td>
                          <td className="border border-slate-300 py-1 px-2 text-center font-bold">{s.age}</td>
                          <td className="border border-slate-300 py-1 px-2">{s.guardianName}</td>
                          <td className="border border-slate-300 py-1 px-2">{s.guardianContact}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Signatures & Certification */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center">
                  <div>
                    <div className="w-56 border-b border-slate-700 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-800">{reportData.section?.adviserName}</p>
                    <p className="text-[10px] text-slate-500 uppercase">Class Adviser (Prepared By)</p>
                  </div>
                  <div>
                    <div className="w-56 border-b border-slate-700 mx-auto mb-1"></div>
                    <p className="font-bold text-slate-800">DR. EDUARDO DELA VEGA</p>
                    <p className="text-[10px] text-slate-500 uppercase">School Principal (Certified Correct)</p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SF2 VIEW */}
            {activeReport === 'SF2' && (
              <div className="space-y-6 text-xs">
                {/* Stats Summary Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total School Days</span>
                    <p className="text-base font-bold text-slate-800">{reportData.summary?.totalSchoolDays} Days</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Registered Learners</span>
                    <p className="text-base font-bold text-slate-800">{reportData.summary?.enrollmentCount}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Total Present</span>
                    <p className="text-base font-bold text-emerald-600">{reportData.summary?.totalPresent}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Average Daily Attendance</span>
                    <p className="text-base font-bold text-slate-800">{reportData.summary?.averageDailyAttendance}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase font-semibold">Attendance Rate</span>
                    <p className="text-base font-bold text-emerald-600">{reportData.summary?.attendancePercentage}%</p>
                  </div>
                </div>

                {/* Day-by-Day Grid */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-slate-300 text-[10px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-300 py-1 px-1.5 text-center w-6">#</th>
                        <th className="border border-slate-300 py-1 px-2 text-left w-36">Learner Name</th>
                        {reportData.schoolDays?.map((d: number) => (
                          <th key={d} className="border border-slate-300 py-1 px-1 text-center w-5">
                            {d}
                          </th>
                        ))}
                        <th className="border border-slate-300 py-1 px-1 text-center w-8 bg-emerald-50 text-emerald-800">P</th>
                        <th className="border border-slate-300 py-1 px-1 text-center w-8 bg-rose-50 text-rose-800">A</th>
                        <th className="border border-slate-300 py-1 px-1 text-center w-8 bg-amber-50 text-amber-800">L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.studentAttendance?.map((st: any, idx: number) => (
                        <tr key={st.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-1 px-1 text-center text-slate-400">{idx + 1}</td>
                          <td className="border border-slate-300 py-1 px-2 font-semibold truncate">{st.fullName}</td>
                          {reportData.schoolDays?.map((d: number) => {
                            const val = st.dailyRecords?.[d];
                            return (
                              <td
                                key={d}
                                className={`border border-slate-300 py-1 px-0.5 text-center font-bold ${
                                  val === 'P'
                                    ? 'text-emerald-600 bg-emerald-50/20'
                                    : val === 'L'
                                    ? 'text-amber-600 bg-amber-50/40'
                                    : 'text-rose-600 bg-rose-50/30'
                                }`}
                              >
                                {val || 'A'}
                              </td>
                            );
                          })}
                          <td className="border border-slate-300 py-1 px-1 text-center font-bold text-emerald-700 bg-emerald-50/50">
                            {st.totalPresent}
                          </td>
                          <td className="border border-slate-300 py-1 px-1 text-center font-bold text-rose-700 bg-rose-50/50">
                            {st.totalAbsent}
                          </td>
                          <td className="border border-slate-300 py-1 px-1 text-center font-bold text-amber-700 bg-amber-50/50">
                            {st.totalLate}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-[11px] text-slate-500 italic">
                  Legend: P = Present (RFID turnstile tap / gate on-time) • L = Late arrival (tapped after 8:00 AM cutoff) • A = Absent (no turnstile scan recorded)
                </div>
              </div>
            )}

            {/* 3. SF9 / FORM 138 VIEW */}
            {activeReport === 'SF9' && (
              <div className="space-y-6 text-xs max-w-3xl mx-auto border-2 border-slate-800 p-6 rounded-xl">
                {/* Student Info Box */}
                <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-400">
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-medium">Learner Name:</span> <strong>{reportData.student?.name}</strong></p>
                    <p><span className="text-slate-500 font-medium">LRN:</span> <strong className="font-mono">{reportData.student?.lrn}</strong></p>
                    <p><span className="text-slate-500 font-medium">Gender:</span> <strong>{reportData.student?.gender}</strong></p>
                  </div>
                  <div className="space-y-1">
                    <p><span className="text-slate-500 font-medium">Grade & Section:</span> <strong>{reportData.student?.gradeLevel} - {reportData.student?.sectionName}</strong></p>
                    <p><span className="text-slate-500 font-medium">Class Adviser:</span> <strong>{reportData.student?.adviserName}</strong></p>
                    <p><span className="text-slate-500 font-medium">School Year:</span> <strong>{reportData.school?.schoolYear}</strong></p>
                  </div>
                </div>

                {/* Report on Learning Progress */}
                <div>
                  <h3 className="font-bold text-slate-900 text-center uppercase tracking-wider mb-2">
                    Report on Learning Progress and Achievement
                  </h3>
                  <table className="w-full border-collapse border border-slate-400 text-center text-[11px]">
                    <thead className="bg-slate-100 text-slate-800 font-bold">
                      <tr>
                        <th className="border border-slate-400 py-2 px-3 text-left">Learning Areas (Curriculum Subjects)</th>
                        <th className="border border-slate-400 py-2 px-2 w-14">Q1</th>
                        <th className="border border-slate-400 py-2 px-2 w-14">Q2</th>
                        <th className="border border-slate-400 py-2 px-2 w-14">Q3</th>
                        <th className="border border-slate-400 py-2 px-2 w-14">Q4</th>
                        <th className="border border-slate-400 py-2 px-2 w-20">Final Rating</th>
                        <th className="border border-slate-400 py-2 px-2 w-24">Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.learningAreas?.map((la: any) => (
                        <tr key={la.code} className="hover:bg-slate-50">
                          <td className="border border-slate-400 py-1.5 px-3 text-left font-medium">{la.name}</td>
                          <td className="border border-slate-400 py-1.5 px-2">{la.q1 ?? '-'}</td>
                          <td className="border border-slate-400 py-1.5 px-2">{la.q2 ?? '-'}</td>
                          <td className="border border-slate-400 py-1.5 px-2">{la.q3 ?? '-'}</td>
                          <td className="border border-slate-400 py-1.5 px-2">{la.q4 ?? '-'}</td>
                          <td className="border border-slate-400 py-1.5 px-2 font-bold bg-slate-50">{la.finalRating ?? '-'}</td>
                          <td className="border border-slate-400 py-1.5 px-2 font-bold text-emerald-700">{la.remarks}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-100 font-bold text-slate-900">
                        <td className="border border-slate-400 py-2 px-3 text-left uppercase">General Average</td>
                        <td colSpan={4} className="border border-slate-400"></td>
                        <td className="border border-slate-400 py-2 px-2 text-base text-emerald-700">{reportData.generalAverage}</td>
                        <td className="border border-slate-400 py-2 px-2 text-emerald-700">{reportData.promotionStatus}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Descriptors Scale */}
                <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Learner Achievement Descriptor</span>
                    <p className="text-sm font-bold text-emerald-700">{reportData.descriptor}</p>
                  </div>
                  <div className="text-[10px] text-slate-500 text-right">
                    <span>Outstanding (90-100) • Very Satisfactory (85-89)</span><br />
                    <span>Satisfactory (80-84) • Fairly Satisfactory (75-79)</span>
                  </div>
                </div>

                {/* Attendance Summary Strip */}
                <div>
                  <h4 className="font-bold text-slate-800 text-center uppercase tracking-wide text-[11px] mb-1.5">
                    Monthly Attendance Record
                  </h4>
                  <table className="w-full border-collapse border border-slate-400 text-center text-[10px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-400 py-1 px-1">Month</th>
                        {reportData.attendanceMonths?.map((m: any) => (
                          <th key={m.month} className="border border-slate-400 py-1 px-1">{m.month}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-slate-400 py-1 px-1 font-semibold text-left">Days Present</td>
                        {reportData.attendanceMonths?.map((m: any) => (
                          <td key={m.month} className="border border-slate-400 py-1 px-1">{m.daysPresent}</td>
                        ))}
                      </tr>
                      <tr>
                        <td className="border border-slate-400 py-1 px-1 font-semibold text-left">Days Absent</td>
                        {reportData.attendanceMonths?.map((m: any) => (
                          <td key={m.month} className="border border-slate-400 py-1 px-1">{m.daysAbsent}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. FINANCIAL SUMMARY VIEW */}
            {activeReport === 'FINANCIAL' && (
              <div className="space-y-6 text-xs">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Invoiced</span>
                    <p className="text-xl font-bold text-slate-900 mt-1">₱{reportData.metrics?.totalInvoiced?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">Total Collected</span>
                    <p className="text-xl font-bold text-emerald-700 mt-1">₱{reportData.metrics?.totalCollected?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold text-rose-700 uppercase">Receivables Due</span>
                    <p className="text-xl font-bold text-rose-700 mt-1">₱{reportData.metrics?.pendingReceivables?.toLocaleString()}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Collection Rate</span>
                    <p className="text-xl font-bold text-blue-700 mt-1">{reportData.metrics?.collectionRate}%</p>
                  </div>
                </div>

                {/* Payment Method Breakdown Strip */}
                <div className="p-4 rounded-xl bg-white border border-slate-200">
                  <h4 className="font-bold text-slate-800 mb-3">Collections by Payment Channel</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Cash</span>
                      <p className="font-bold text-slate-800">₱{reportData.methodBreakdown?.CASH?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">GCash / E-Wallet</span>
                      <p className="font-bold text-emerald-600">₱{reportData.methodBreakdown?.GCASH?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Bank Transfer</span>
                      <p className="font-bold text-blue-600">₱{reportData.methodBreakdown?.BANK_TRANSFER?.toLocaleString() || 0}</p>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Credit Card / POS</span>
                      <p className="font-bold text-purple-600">₱{reportData.methodBreakdown?.CREDIT_CARD?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Audit Ledger Table */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Itemized Financial Audit Log</h4>
                  <table className="w-full border-collapse border border-slate-300 text-[11px]">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="border border-slate-300 py-1.5 px-3 text-left">Reference No.</th>
                        <th className="border border-slate-300 py-1.5 px-3 text-left">Fee Description</th>
                        <th className="border border-slate-300 py-1.5 px-3 text-right">Amount</th>
                        <th className="border border-slate-300 py-1.5 px-3 text-center">Channel</th>
                        <th className="border border-slate-300 py-1.5 px-3 text-center">Status</th>
                        <th className="border border-slate-300 py-1.5 px-3 text-center">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.transactions?.map((t: any) => (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="border border-slate-300 py-1.5 px-3 font-mono font-semibold">{t.referenceNo}</td>
                          <td className="border border-slate-300 py-1.5 px-3">{t.title}</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-right font-bold">₱{t.amount.toLocaleString()}</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center uppercase">{t.paymentMethod || 'CASH'}</td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="border border-slate-300 py-1.5 px-3 text-center text-slate-500">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
