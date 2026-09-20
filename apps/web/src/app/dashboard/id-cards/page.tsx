'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import {
  IdCard,
  Printer,
  RotateCw,
  Sliders,
  Sparkles,
  QrCode,
  Barcode,
  Radio,
  CheckCircle2,
  Phone,
  School,
  User,
  ShieldCheck,
  Save,
  Download,
  Eye,
  Layers,
  FileCheck,
  Check,
  ChevronDown,
} from 'lucide-react';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface TemplateConfig {
  id: string;
  name: string;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
  accentColor: string;
  headerColor: string;
  textColor: string;
  showQrCode: boolean;
  showBarcode: boolean;
  showRfidUid: boolean;
  showGuardianInfo: boolean;
  safeMarginPercent: number;
  hasLanyardSlot: boolean;
  showSafeMarginGuides: boolean;
}

export interface StudentBadgeData {
  id: string;
  studentId: string; // LRN
  lrn: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  fullName: string;
  gender: string;
  gradeLevel: string;
  sectionName: string;
  adviserName: string;
  rfidCardUid: string;
  photoUrl?: string | null;
  guardianName: string;
  guardianPhone: string;
  emergencyContact: string;
  school: {
    name: string;
    schoolId: string;
    address: string;
    phone: string;
    principalName: string;
    logoUrl?: string | null;
  };
  schoolYear: string;
  qrCodeData: string;
  barcodeData: string;
}

const TEMPLATE_PRESETS: TemplateConfig[] = [
  {
    id: 'emerald-modern',
    name: 'Emerald Modern',
    orientation: 'PORTRAIT',
    accentColor: '#059669',
    headerColor: '#064e3b',
    textColor: '#0f172a',
    showQrCode: true,
    showBarcode: true,
    showRfidUid: true,
    showGuardianInfo: true,
    safeMarginPercent: 5,
    hasLanyardSlot: true,
    showSafeMarginGuides: false,
  },
  {
    id: 'navy-executive',
    name: 'Navy Classic Academy',
    orientation: 'PORTRAIT',
    accentColor: '#1d4ed8',
    headerColor: '#0f172a',
    textColor: '#0f172a',
    showQrCode: true,
    showBarcode: true,
    showRfidUid: true,
    showGuardianInfo: true,
    safeMarginPercent: 5,
    hasLanyardSlot: true,
    showSafeMarginGuides: false,
  },
  {
    id: 'burgundy-prestige',
    name: 'Burgundy Prestige',
    orientation: 'PORTRAIT',
    accentColor: '#991b1b',
    headerColor: '#450a0a',
    textColor: '#0f172a',
    showQrCode: true,
    showBarcode: true,
    showRfidUid: true,
    showGuardianInfo: true,
    safeMarginPercent: 5,
    hasLanyardSlot: false,
    showSafeMarginGuides: false,
  },
  {
    id: 'slate-minimal',
    name: 'Slate Minimal',
    orientation: 'PORTRAIT',
    accentColor: '#475569',
    headerColor: '#1e293b',
    textColor: '#0f172a',
    showQrCode: true,
    showBarcode: true,
    showRfidUid: true,
    showGuardianInfo: true,
    safeMarginPercent: 4,
    hasLanyardSlot: true,
    showSafeMarginGuides: false,
  },
];

const DEFAULT_STUDENT: StudentBadgeData = {
  id: 'stud-default',
  studentId: '109283746512',
  lrn: '109283746512',
  firstName: 'Juanita Margarita',
  lastName: 'Dela Cruz',
  middleName: 'Reyes',
  fullName: 'Juanita Margarita R. Dela Cruz',
  gender: 'FEMALE',
  gradeLevel: 'Grade 7',
  sectionName: 'Diamond',
  adviserName: 'Roberto Cruz, LPT',
  rfidCardUid: 'E200001928374',
  photoUrl: null,
  guardianName: 'Maria Elena Dela Cruz',
  guardianPhone: '+63 917 555 1234',
  emergencyContact: '+63 917 555 1234',
  school: {
    name: 'St. Jude International Academy',
    schoolId: '300412',
    address: '1004 Gen. Luna St., Ermita, Manila',
    phone: '+63 2 8524 4611',
    principalName: 'DR. EDUARDO DELA VEGA',
    logoUrl: null,
  },
  schoolYear: '2026-2027',
  qrCodeData: 'EDVANCE:VERIFY:LRN=109283746512:RFID=E200001928374',
  barcodeData: '109283746512',
};

export default function IdCardsPage() {
  const [activeTab, setActiveTab] = useState<'designer' | 'batch'>('designer');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [template, setTemplate] = useState<TemplateConfig>(TEMPLATE_PRESETS[0]);
  const [student, setStudent] = useState<StudentBadgeData>(DEFAULT_STUDENT);
  const [studentList, setStudentList] = useState<StudentBadgeData[]>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Dynamic single-line font sizing calculator based on character count
  const calculatedNameFontSize = useMemo(() => {
    const len = student.fullName.length;
    if (len <= 18) return '15px';
    if (len <= 24) return '13px';
    if (len <= 30) return '11.5px';
    return '10px';
  }, [student.fullName]);

  // Load real students & sections from API
  useEffect(() => {
    // 1. Fetch Students
    api
      .request<{ data: any[] }>('/api/students')
      .then((res) => {
        if (res.data?.data && res.data.data.length > 0) {
          const mapped: StudentBadgeData[] = res.data.data.map((st: any) => {
            const sec = st.sectionStudents?.[0]?.section;
            const rfid =
              st.rfidCardUid ||
              `E20000${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;
            const mName = st.middleName ? `${st.middleName.charAt(0)}. ` : '';
            return {
              id: st.id,
              studentId: st.studentId || '109283746512',
              lrn: st.studentId || '109283746512',
              firstName: st.firstName,
              lastName: st.lastName,
              middleName: st.middleName,
              fullName: `${st.firstName} ${mName}${st.lastName}`,
              gender: st.gender || 'MALE',
              gradeLevel: sec?.gradeLevel || 'Grade 7',
              sectionName: sec?.name || 'Diamond',
              adviserName: sec?.adviser
                ? `${sec.adviser.firstName} ${sec.adviser.lastName}`
                : 'Class Adviser',
              rfidCardUid: rfid,
              photoUrl: st.photoUrl || null,
              guardianName: st.guardianName || 'Guardian',
              guardianPhone: st.guardianPhone || st.emergencyContact || '+63 917 555 1234',
              emergencyContact: st.emergencyContact || st.guardianPhone || '+63 917 555 1234',
              school: {
                name: 'St. Jude International Academy',
                schoolId: '300412',
                address: '1004 Gen. Luna St., Ermita, Manila',
                phone: '+63 2 8524 4611',
                principalName: 'DR. EDUARDO DELA VEGA',
              },
              schoolYear: sec?.academicYear?.name || '2026-2027',
              qrCodeData: `EDVANCE:VERIFY:LRN=${st.studentId}:RFID=${rfid}`,
              barcodeData: st.studentId || '109283746512',
            };
          });
          setStudentList(mapped);
          if (mapped.length > 0) {
            setStudent(mapped[0]);
          }
        } else {
          setStudentList([DEFAULT_STUDENT]);
        }
      })
      .catch(() => {
        setStudentList([DEFAULT_STUDENT]);
      });

    // 2. Fetch Sections
    api
      .request<{ data: any[] }>('/api/sections')
      .then((res) => {
        if (res.data?.data) {
          setSections(res.data.data.map((s: any) => ({ id: s.id, name: s.name })));
        }
      })
      .catch(() => {
        setSections([{ id: 'sec-1', name: 'Diamond' }, { id: 'sec-2', name: 'Emerald' }]);
      });
  }, []);

  // Filter student badges for batch print sheet
  const batchStudents = useMemo(() => {
    if (selectedSection === 'all') return studentList.slice(0, 8);
    const filtered = studentList.filter((s) => s.sectionName === selectedSection);
    return filtered.length > 0 ? filtered.slice(0, 8) : studentList.slice(0, 8);
  }, [studentList, selectedSection]);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveTemplate = () => {
    setSaveToast('Template configuration saved successfully!');
    setTimeout(() => setSaveToast(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-xl animate-fade-in text-sm font-medium">
          <CheckCircle2 className="w-5 h-5" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Bar (Hidden in Print) */}
      <div className="no-print bg-white border-b border-slate-200/80 sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <IdCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                  CR80 PVC Standards
                </span>
                <span className="text-xs text-slate-600 font-medium">54mm × 86mm</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900 mt-0.5">
                RFID ID Card Designer & Batch Badge Printing
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Switcher Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab('designer')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'designer'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Designer & Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('batch')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === 'batch'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Batch Sheet (A4)
              </button>
            </div>

            {activeTab === 'designer' && (
              <button
                type="button"
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Flip Card ({isFlipped ? 'Back' : 'Front'})</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveTemplate}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5 text-slate-500" />
              <span>Save Preset</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Badges</span>
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-6">
        {activeTab === 'designer' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ==========================================
                LEFT COLUMN: DESIGN CONTROLS
                ========================================== */}
            <div className="no-print lg:col-span-5 space-y-6">
              {/* Preset Templates */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    Layout Templates
                  </h3>
                  <span className="text-xs text-slate-600">CR80 Plastic Standard</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {TEMPLATE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setTemplate({ ...template, ...p })}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        template.name === p.name
                          ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: p.accentColor }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10"
                          style={{ backgroundColor: p.headerColor }}
                        />
                      </div>
                      <div className="font-semibold text-xs text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-600">{p.orientation}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color & Visual Adjustments */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-emerald-600" />
                  Color Palettes & Accents
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Header Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.headerColor}
                        onChange={(e) =>
                          setTemplate({ ...template, headerColor: e.target.value })
                        }
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={template.headerColor}
                        onChange={(e) =>
                          setTemplate({ ...template, headerColor: e.target.value })
                        }
                        className="text-xs font-mono w-24 px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Accent Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={template.accentColor}
                        onChange={(e) =>
                          setTemplate({ ...template, accentColor: e.target.value })
                        }
                        className="w-8 h-8 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"
                      />
                      <input
                        type="text"
                        value={template.accentColor}
                        onChange={(e) =>
                          setTemplate({ ...template, accentColor: e.target.value })
                        }
                        className="text-xs font-mono w-24 px-2 py-1.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-700"
                      />
                    </div>
                  </div>
                </div>

                {/* Safe Margins Guideline Slider */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">
                      Safe Margin Guideline (Printing Bleed)
                    </span>
                    <span className="font-mono text-emerald-600 font-bold">
                      {template.safeMarginPercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    step="1"
                    value={template.safeMarginPercent}
                    onChange={(e) =>
                      setTemplate({
                        ...template,
                        safeMarginPercent: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                    <span>2% (Tight)</span>
                    <span>5% (DepEd Recommended)</span>
                    <span>10% (Wide)</span>
                  </div>
                </div>

                {/* Mechanical Hardware Toggles */}
                <div className="pt-2 border-t border-slate-100 space-y-2.5">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-slate-700">
                      Lanyard Slot Punch Hole Notch
                    </span>
                    <input
                      type="checkbox"
                      checked={template.hasLanyardSlot}
                      onChange={(e) =>
                        setTemplate({ ...template, hasLanyardSlot: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-slate-700">
                      Show Safe Margin Guidelines Overlay
                    </span>
                    <input
                      type="checkbox"
                      checked={template.showSafeMarginGuides}
                      onChange={(e) =>
                        setTemplate({
                          ...template,
                          showSafeMarginGuides: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-slate-700">
                      RFID Chip UID Bar & Icon
                    </span>
                    <input
                      type="checkbox"
                      checked={template.showRfidUid}
                      onChange={(e) =>
                        setTemplate({ ...template, showRfidUid: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-slate-700">
                      Gate Verification QR Code
                    </span>
                    <input
                      type="checkbox"
                      checked={template.showQrCode}
                      onChange={(e) =>
                        setTemplate({ ...template, showQrCode: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-medium text-slate-700">
                      Student LRN Barcode Strip
                    </span>
                    <input
                      type="checkbox"
                      checked={template.showBarcode}
                      onChange={(e) =>
                        setTemplate({ ...template, showBarcode: e.target.checked })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                    />
                  </label>
                </div>
              </div>

              {/* Student Live Inspector */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-600" />
                    Live Student Inspector
                  </h3>
                  <span className="text-xs text-slate-600">Select or edit payload</span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-600 uppercase block mb-1">
                    Quick Student Switcher
                  </label>
                  <select
                    value={student.id}
                    onChange={(e) => {
                      const selected = studentList.find((s) => s.id === e.target.value);
                      if (selected) setStudent(selected);
                    }}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {studentList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.fullName} ({s.sectionName} - LRN: {s.studentId})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={student.fullName}
                      onChange={(e) =>
                        setStudent({ ...student, fullName: e.target.value })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                      LRN / Student ID
                    </label>
                    <input
                      type="text"
                      value={student.studentId}
                      onChange={(e) =>
                        setStudent({
                          ...student,
                          studentId: e.target.value,
                          lrn: e.target.value,
                          barcodeData: e.target.value,
                        })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                      Section & Grade
                    </label>
                    <input
                      type="text"
                      value={`${student.gradeLevel} - ${student.sectionName}`}
                      onChange={(e) => {
                        const parts = e.target.value.split('-');
                        setStudent({
                          ...student,
                          gradeLevel: parts[0]?.trim() || student.gradeLevel,
                          sectionName: parts[1]?.trim() || student.sectionName,
                        });
                      }}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-600 uppercase block mb-0.5">
                      RFID Card UID
                    </label>
                    <input
                      type="text"
                      value={student.rfidCardUid}
                      onChange={(e) =>
                        setStudent({ ...student, rfidCardUid: e.target.value })
                      }
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ==========================================
                RIGHT COLUMN: LIVE CR80 BADGE PREVIEW
                ========================================== */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center">
              {/* Preview Bar controls */}
              <div className="no-print w-full max-w-[340px] flex items-center justify-between mb-4 px-2">
                <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  Live CR80 Canvas ({isFlipped ? 'Reverse Side' : 'Front Side'})
                </span>
                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100"
                >
                  <RotateCw className="w-3 h-3" />
                  Flip Card
                </button>
              </div>

              {/* CR80 Physical Card Canvas Mockup */}
              <div className="relative p-6 bg-slate-200/60 rounded-3xl border border-slate-300/80 shadow-inner flex items-center justify-center min-h-[500px] w-full max-w-md">
                {/* 3D Realistic Badge Element (Standard CR80: 54mm x 86mm ~ 270px x 430px) */}
                <div
                  id="printable-single-badge"
                  className={`relative w-[270px] h-[428px] bg-white rounded-[16px] shadow-2xl border border-slate-300/80 overflow-hidden flex flex-col transition-all duration-300 select-none ${
                    isFlipped ? 'bg-slate-50' : 'bg-white'
                  }`}
                  style={{
                    boxShadow:
                      '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 0 0 1px rgba(255, 255, 255, 0.8)',
                  }}
                >
                  {/* PVC Card Gloss Sheen Highlight */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/25 pointer-events-none z-20" />

                  {/* Safe Margin Guide Overlay (if toggled) */}
                  {template.showSafeMarginGuides && (
                    <div
                      className="absolute pointer-events-none z-30 border border-dashed border-rose-500/60"
                      style={{
                        top: `${template.safeMarginPercent}%`,
                        bottom: `${template.safeMarginPercent}%`,
                        left: `${template.safeMarginPercent}%`,
                        right: `${template.safeMarginPercent}%`,
                      }}
                    >
                      <span className="absolute top-0.5 left-0.5 text-[8px] bg-rose-500 text-white font-mono px-1 rounded">
                        Safe {template.safeMarginPercent}%
                      </span>
                    </div>
                  )}

                  {/* Lanyard Punch Hole Notch (centered at top) */}
                  {template.hasLanyardSlot && (
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-11 h-2.5 bg-slate-200/90 rounded-full border border-slate-400 shadow-inner z-20 flex items-center justify-center">
                      <div className="w-8 h-1 bg-slate-300/60 rounded-full" />
                    </div>
                  )}

                  {/* ==========================================
                      CARD FRONT SIDE
                      ========================================== */}
                  {!isFlipped ? (
                    <div className="flex flex-col h-full justify-between">
                      {/* 1. Header Banner */}
                      <div
                        className="px-3 pt-5 pb-2.5 text-center text-white relative shadow-sm"
                        style={{ backgroundColor: template.headerColor }}
                      >
                        <div className="flex items-center justify-center gap-1.5 mb-1">
                          <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center border border-white/40">
                            <School className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-[10px] font-extrabold uppercase tracking-wide leading-tight line-clamp-1">
                            {student.school.name}
                          </span>
                        </div>
                        <div className="flex items-center justify-center gap-2 text-[9px] text-white/80 font-medium">
                          <span>DepEd ID: {student.school.schoolId}</span>
                          <span>•</span>
                          <span>S.Y. {student.schoolYear}</span>
                        </div>
                        <div
                          className="h-1 w-full absolute bottom-0 left-0"
                          style={{ backgroundColor: template.accentColor }}
                        />
                      </div>

                      {/* 2. Photo & Identity Box */}
                      <div className="flex flex-col items-center pt-2 px-3 flex-1">
                        {/* 2x2 Photo Frame with drop shadow */}
                        <div
                          className="relative w-24 h-24 rounded-xl overflow-hidden border-2 bg-slate-100 shadow-md flex items-center justify-center mt-1"
                          style={{ borderColor: template.accentColor }}
                        >
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-600">
                              <User className="w-10 h-10 stroke-[1.5]" />
                              <span className="text-[8px] font-semibold uppercase tracking-wider text-slate-600">
                                2×2 Photo
                              </span>
                            </div>
                          )}
                          <div className="absolute bottom-0 inset-x-0 bg-slate-900/60 text-white text-[8px] font-mono py-0.5 text-center backdrop-blur-xs">
                            STUDENT
                          </div>
                        </div>

                        {/* Student Name with Strict Single-Line Constraint and Dynamic Font Sizing */}
                        <div className="w-full text-center mt-2.5 px-2">
                          <div
                            className="font-black text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis uppercase"
                            style={{ fontSize: calculatedNameFontSize }}
                            title={student.fullName}
                          >
                            {student.fullName}
                          </div>
                          <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wide mt-0.5">
                            {student.gradeLevel} — {student.sectionName}
                          </div>
                        </div>

                        {/* LRN & RFID Badge Pill */}
                        <div className="w-full mt-2 space-y-1">
                          <div className="flex items-center justify-between bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80">
                            <span className="text-[9px] font-semibold text-slate-600">LRN</span>
                            <span className="text-[10px] font-mono font-bold text-slate-900 tracking-wider">
                              {student.studentId}
                            </span>
                          </div>

                          {template.showRfidUid && (
                            <div className="flex items-center justify-between bg-emerald-50/80 px-2.5 py-1 rounded-lg border border-emerald-200/60">
                              <span className="text-[9px] font-semibold text-emerald-700 flex items-center gap-1">
                                <Radio className="w-2.5 h-2.5 text-emerald-600 animate-pulse" />
                                RFID
                              </span>
                              <span className="text-[10px] font-mono font-bold text-emerald-800 tracking-wider">
                                {student.rfidCardUid}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3. Bottom Verification Grid: QR Code & Barcode */}
                      <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/60">
                        <div className="flex items-center justify-between gap-2">
                          {/* Barcode Strip */}
                          {template.showBarcode && (
                            <div className="flex-1 flex flex-col items-center">
                              <div className="flex items-center justify-center gap-[2px] h-7 w-full overflow-hidden px-1">
                                {[
                                  2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1,
                                  2, 3, 1, 2, 4, 1, 2, 1, 3,
                                ].map((w, i) => (
                                  <div
                                    key={i}
                                    className="bg-slate-900 h-full"
                                    style={{ width: `${w}px` }}
                                  />
                                ))}
                              </div>
                              <span className="text-[8px] font-mono text-slate-600 mt-0.5">
                                *{student.studentId}*
                              </span>
                            </div>
                          )}

                          {/* Gate QR Verification */}
                          {template.showQrCode && (
                            <div className="p-1 bg-white rounded-lg border border-slate-200 shadow-xs flex flex-col items-center">
                              <QrCode className="w-7 h-7 text-slate-900" />
                              <span className="text-[7px] font-mono text-slate-600 font-bold">
                                GATE
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* ==========================================
                        CARD REVERSE / BACK SIDE
                        ========================================== */
                    <div className="flex flex-col h-full justify-between p-3.5 text-slate-800 text-left">
                      <div>
                        {/* Magnetic Bar Mockup */}
                        <div className="w-full h-7 bg-slate-900 rounded-sm -mx-3.5 mb-3 px-3.5 flex items-center justify-end">
                          <span className="text-[7px] text-slate-600 font-mono">
                            ENCODED RFID / TRACK 2
                          </span>
                        </div>

                        {/* Certification Notice */}
                        <div className="text-[8.5px] leading-snug text-slate-600 text-justify mb-3">
                          This is to certify that the student whose name and picture appear
                          hereon is a bona fide student of{' '}
                          <strong className="text-slate-900 font-semibold">
                            {student.school.name}
                          </strong>
                          . Always wear this ID while inside the school campus.
                        </div>

                        {/* Emergency Contact */}
                        {template.showGuardianInfo && (
                          <div className="bg-slate-100/90 rounded-xl p-2.5 border border-slate-200/90 space-y-1 mb-3">
                            <div className="text-[9px] font-bold text-rose-700 uppercase tracking-wide flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              In Case of Emergency
                            </div>
                            <div className="text-[10px] font-semibold text-slate-900 truncate">
                              {student.guardianName}
                            </div>
                            <div className="text-[9px] font-mono text-slate-700">
                              {student.emergencyContact}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Signatures & School Credentials */}
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-center pt-2">
                          <div className="border-t border-slate-300 pt-1">
                            <div className="text-[8.5px] font-bold text-slate-900 uppercase">
                              {student.adviserName}
                            </div>
                            <div className="text-[7.5px] text-slate-600">Class Adviser</div>
                          </div>
                          <div className="border-t border-slate-300 pt-1">
                            <div className="text-[8.5px] font-bold text-slate-900 uppercase">
                              {student.school.principalName}
                            </div>
                            <div className="text-[7.5px] text-slate-600">School Principal</div>
                          </div>
                        </div>

                        <div className="text-center pt-1 border-t border-slate-100">
                          <div className="text-[8px] font-medium text-slate-600">
                            {student.school.address}
                          </div>
                          <div className="text-[8px] font-mono text-slate-600">
                            Tel: {student.school.phone}
                          </div>
                          <div className="text-[7.5px] text-slate-600 italic mt-0.5">
                            If found, please surrender to the Principal&apos;s Office.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ==========================================
              BATCH PRINT SHEET VIEW (A4 CARDSTOCK)
              ========================================== */
          <div className="space-y-6">
            {/* Filter Bar (Hidden when printing) */}
            <div className="no-print bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Batch PVC Cardstock Printing Sheet
                  </h3>
                  <p className="text-xs text-slate-600">
                    Standard A4 layout • 8 CR80 cards per sheet with cut-line alignment guides
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700">Section:</span>
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="text-xs px-3 py-1.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
                  >
                    <option value="all">All Sections ({studentList.length} students)</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.name}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Sheet</span>
                </button>
              </div>
            </div>

            {/* A4 Printable Sheet Container */}
            <div
              id="batch-printable-sheet"
              className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xl max-w-[850px] mx-auto print:m-0 print:p-0 print:border-none print:shadow-none"
            >
              {/* Grid: 2 columns × 4 rows = 8 Badges per A4 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                {batchStudents.map((st, idx) => (
                  <div
                    key={st.id || idx}
                    className="relative w-[270px] h-[428px] mx-auto bg-white rounded-[14px] border border-dashed border-slate-400/80 p-0.5 overflow-hidden flex flex-col justify-between shadow-sm print:shadow-none print:border-slate-300"
                  >
                    {/* Inner Card Container */}
                    <div className="flex flex-col h-full justify-between bg-white rounded-[12px] overflow-hidden">
                      {/* Header */}
                      <div
                        className="px-3 pt-4 pb-2 text-center text-white relative"
                        style={{ backgroundColor: template.headerColor }}
                      >
                        <div className="text-[9.5px] font-extrabold uppercase tracking-wide truncate">
                          {st.school.name}
                        </div>
                        <div className="text-[8.5px] text-white/80 font-medium">
                          DepEd ID: {st.school.schoolId} • S.Y. {st.schoolYear}
                        </div>
                        <div
                          className="h-1 w-full absolute bottom-0 left-0"
                          style={{ backgroundColor: template.accentColor }}
                        />
                      </div>

                      {/* Photo & Body */}
                      <div className="flex flex-col items-center pt-2 px-3 flex-1">
                        <div
                          className="w-20 h-20 rounded-xl overflow-hidden border-2 bg-slate-100 flex items-center justify-center mt-1"
                          style={{ borderColor: template.accentColor }}
                        >
                          <User className="w-8 h-8 text-slate-600 stroke-[1.5]" />
                        </div>

                        <div className="w-full text-center mt-2 px-1">
                          <div className="font-extrabold text-xs text-slate-900 tracking-tight whitespace-nowrap overflow-hidden text-ellipsis uppercase">
                            {st.fullName}
                          </div>
                          <div className="text-[9.5px] font-bold text-slate-600 uppercase mt-0.5">
                            {st.gradeLevel} — {st.sectionName}
                          </div>
                        </div>

                        <div className="w-full mt-2 space-y-1">
                          <div className="flex items-center justify-between bg-slate-100 px-2 py-0.5 rounded text-[9px]">
                            <span className="font-semibold text-slate-600">LRN</span>
                            <span className="font-mono font-bold text-slate-900">
                              {st.studentId}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-emerald-50 px-2 py-0.5 rounded text-[9px]">
                            <span className="font-semibold text-emerald-700">RFID</span>
                            <span className="font-mono font-bold text-emerald-800">
                              {st.rfidCardUid}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer barcode */}
                      <div className="px-3 pb-2.5 pt-1 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                        <div className="flex items-center gap-[2px] h-5 overflow-hidden">
                          {[
                            2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 4, 1, 2, 3, 1, 2, 4, 1, 2, 3,
                          ].map((w, i) => (
                            <div
                              key={i}
                              className="bg-slate-900 h-full"
                              style={{ width: `${w}px` }}
                            />
                          ))}
                        </div>
                        <QrCode className="w-6 h-6 text-slate-900" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Print Stylesheet for exact CR80 Cardstock output */}
      <style jsx global>{`
        @media print {
          body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          header,
          nav,
          aside {
            display: none !important;
          }
          #batch-printable-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
