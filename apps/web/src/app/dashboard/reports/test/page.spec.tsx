import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ReportsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    request: vi.fn(),
  },
}));

describe('ReportsPage', () => {
  const mockSF1Data = {
    school: {
      name: 'St. Jude International Academy',
      schoolId: '300412',
      district: 'Manila North',
      division: 'City of Manila',
      schoolYear: '2026-2027',
    },
    section: {
      id: 'sec-1',
      name: 'Diamond',
      gradeLevel: 'Grade 7',
      room: 'Room 201',
      adviserName: 'Maria Santos',
    },
    maleStudents: [
      {
        id: 'stud-1',
        lrn: '2026-0001',
        fullName: 'Dela Cruz, Juan',
        birthDate: '2013-05-15',
        age: 13,
        guardianName: 'Pedro Dela Cruz',
        guardianContact: '+639171234567',
      },
    ],
    femaleStudents: [
      {
        id: 'stud-2',
        lrn: '2026-0002',
        fullName: 'Santos, Ana',
        birthDate: '2013-08-20',
        age: 13,
        guardianName: 'Elena Santos',
        guardianContact: '+639189876543',
      },
    ],
    summary: { maleCount: 1, femaleCount: 1, totalCount: 2 },
  };

  const mockSF2Data = {
    school: { name: 'St. Jude International Academy', schoolId: '300412' },
    section: { id: 'sec-1', name: 'Diamond', gradeLevel: 'Grade 7', adviserName: 'Maria Santos' },
    month: 'September',
    year: 2026,
    schoolDays: [1, 2, 3],
    studentAttendance: [
      {
        id: 'stud-1',
        lrn: '2026-0001',
        fullName: 'Dela Cruz, Juan',
        dailyRecords: { 1: 'P', 2: 'P', 3: 'L' },
        totalPresent: 3,
        totalAbsent: 0,
        totalLate: 1,
      },
    ],
    summary: {
      totalSchoolDays: 3,
      enrollmentCount: 1,
      totalPresent: 3,
      totalAbsent: 0,
      averageDailyAttendance: 1,
      attendancePercentage: 100,
    },
  };

  const mockSF9Data = {
    school: { name: 'St. Jude International Academy', schoolId: '300412', schoolYear: '2026-2027' },
    student: {
      id: 'stud-1',
      lrn: '2026-0001',
      name: 'Dela Cruz, Juan',
      gender: 'MALE',
      gradeLevel: 'Grade 7',
      sectionName: 'Diamond',
      adviserName: 'Maria Santos',
    },
    learningAreas: [
      { code: 'MATH', name: 'Mathematics 7', q1: 90, q2: 92, q3: 91, q4: 93, finalRating: 92, remarks: 'PASSED' },
    ],
    generalAverage: 92,
    descriptor: 'Outstanding',
    promotionStatus: 'PROMOTED',
    attendanceMonths: [
      { month: 'Sep', schoolDays: 20, daysPresent: 20, daysAbsent: 0 },
    ],
  };

  const mockFinancialData = {
    school: { name: 'St. Jude International Academy' },
    metrics: {
      totalTransactions: 5,
      totalInvoiced: 50000,
      totalCollected: 45000,
      pendingReceivables: 5000,
      collectionRate: 90,
    },
    methodBreakdown: {
      CASH: 20000,
      GCASH: 25000,
      BANK_TRANSFER: 0,
      CREDIT_CARD: 0,
    },
    transactions: [
      {
        id: 'tx-1',
        referenceNo: 'TXN-2026-001',
        title: 'Tuition Fee 1st Qtr',
        amount: 15000,
        status: 'COMPLETED',
        paymentMethod: 'GCASH',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.request).mockImplementation((url: string) => {
      if (url.includes('/api/sections')) {
        return Promise.resolve({
          data: {
            data: [{ id: 'sec-1', name: 'Diamond', gradeLevel: 'Grade 7' }],
          },
        } as any);
      }
      if (url.includes('/api/students')) {
        return Promise.resolve({
          data: {
            data: [{ id: 'stud-1', studentId: '2026-0001', firstName: 'Juan', lastName: 'Dela Cruz' }],
          },
        } as any);
      }
      if (url.includes('/api/reports/sf1')) {
        return Promise.resolve({ data: mockSF1Data } as any);
      }
      if (url.includes('/api/reports/sf2')) {
        return Promise.resolve({ data: mockSF2Data } as any);
      }
      if (url.includes('/api/reports/sf9')) {
        return Promise.resolve({ data: mockSF9Data } as any);
      }
      if (url.includes('/api/reports/financial')) {
        return Promise.resolve({ data: mockFinancialData } as any);
      }
      return Promise.resolve({ data: null } as any);
    });
  });

  it('renders title and 4 report selector cards', async () => {
    render(<ReportsPage />);

    expect(screen.getByText('School Reports & DepEd Forms Generator')).toBeInTheDocument();
    expect(screen.getByText('School Register')).toBeInTheDocument();
    expect(screen.getByText('Daily Attendance Report')).toBeInTheDocument();
    expect(screen.getByText('Progress Report Card')).toBeInTheDocument();
    expect(screen.getByText('Revenue & Collection Statement')).toBeInTheDocument();
  });

  it('renders SF1 School Register with student records', async () => {
    render(<ReportsPage />);

    await waitFor(() => {
      expect(screen.getByText(/School Form 1 \(SF1\)/i)).toBeInTheDocument();
      expect(screen.getByText('Dela Cruz, Juan')).toBeInTheDocument();
      expect(screen.getByText('Santos, Ana')).toBeInTheDocument();
      expect(screen.getByText('2 Students')).toBeInTheDocument();
    });
  });

  it('switches to SF2 and renders daily attendance grid', async () => {
    render(<ReportsPage />);

    const sf2Btn = screen.getByText('Daily Attendance Report');
    fireEvent.click(sf2Btn);

    await waitFor(() => {
      expect(screen.getByText(/School Form 2 \(SF2\)/i)).toBeInTheDocument();
      expect(screen.getByText('Registered Learners')).toBeInTheDocument();
      expect(screen.getByText('100%')).toBeInTheDocument(); // Attendance rate
    });
  });

  it('switches to SF9 and renders Form 138 report card', async () => {
    render(<ReportsPage />);

    const sf9Btn = screen.getByText('Progress Report Card');
    fireEvent.click(sf9Btn);

    await waitFor(() => {
      expect(screen.getByText(/Learner's Progress Report Card/i)).toBeInTheDocument();
      expect(screen.getByText('Mathematics 7')).toBeInTheDocument();
      expect(screen.getByText('General Average')).toBeInTheDocument();
      expect(screen.getByText('PROMOTED')).toBeInTheDocument();
    });
  });

  it('switches to Financial Statement and renders collections', async () => {
    render(<ReportsPage />);

    const finBtn = screen.getByText('Revenue & Collection Statement');
    fireEvent.click(finBtn);

    await waitFor(() => {
      expect(screen.getByText('Revenue & Collection Statement')).toBeInTheDocument();
      expect(screen.getByText('₱45,000')).toBeInTheDocument();
      expect(screen.getByText('TXN-2026-001')).toBeInTheDocument();
    });
  });

  it('triggers window.print when Print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});

    render(<ReportsPage />);

    const printBtn = screen.getByRole('button', { name: /Print Form/i });
    fireEvent.click(printBtn);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
