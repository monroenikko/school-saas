import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GradesPage from '../page';
import { api } from '@/lib/api';
import { GradingPeriod } from '@school-saas/shared';

let mockAuthUser: any = {
  id: 'user-admin',
  firstName: 'Admin',
  lastName: 'User',
  role: 'SCHOOL_ADMIN',
  permissions: ['sections:read', 'sections:create', 'sections:update', 'grades:read', 'grades:create', 'grades:update'],
};

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockAuthUser,
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('GradesPage - Class List, Permissions, Enlistment & Trimestral Gradesheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      id: 'user-admin',
      firstName: 'Admin',
      lastName: 'User',
      role: 'SCHOOL_ADMIN',
      permissions: ['sections:read', 'sections:create', 'sections:update', 'grades:read', 'grades:create', 'grades:update'],
    };

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/sections/academic-years')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 'ay-1', name: '2026-2027', isCurrent: true },
            { id: 'ay-2', name: '2025-2026', isCurrent: false },
          ],
        } as any);
      }
      if (url.includes('/api/subjects/classes')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 'class-1',
              classCode: 'MATH7-SEC-A',
              enrolledCount: 30,
              subject: { id: 'sub-1', code: 'MATH7', name: 'General Mathematics 7', credits: 3.0 },
              teacher: { id: 't-1', firstName: 'Maria', lastName: 'Santos', employeeId: 'EMP-001' },
              section: { id: 'sec-1', name: 'Diamond', gradeLevel: 'Grade 7' },
            },
          ],
        } as any);
      }
      if (url.includes('/api/sections/sec-1')) {
        return Promise.resolve({
          success: true,
          data: {
            id: 'sec-1',
            name: 'Diamond',
            gradeLevel: 'Grade 7',
            room: 'Room 204',
            capacity: 40,
            academicYear: { id: 'ay-1', name: '2026-2027' },
            adviser: {
              id: 't-1',
              firstName: 'Roberto',
              lastName: 'Cruz',
              employeeId: 'EMP-002',
            },
            students: [
              {
                id: 'sec-stud-1',
                studentId: 'stud-1',
                status: 'ACTIVE',
                student: {
                  id: 'stud-1',
                  studentId: '2026-0001',
                  firstName: 'Juan',
                  lastName: 'Dela Cruz',
                  middleName: 'Reyes',
                  gender: 'MALE',
                  status: 'ACTIVE',
                },
              },
            ],
          },
        } as any);
      }
      if (url.includes('/api/sections')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 'sec-1',
              name: 'Diamond',
              gradeLevel: 'Grade 7',
              room: 'Room 204',
              capacity: 40,
              studentCount: 35,
              academicYear: { id: 'ay-1', name: '2026-2027' },
              adviser: {
                id: 't-1',
                firstName: 'Roberto',
                lastName: 'Cruz',
                employeeId: 'EMP-002',
              },
            },
            {
              id: 'sec-2',
              name: 'STEM-A',
              gradeLevel: 'Grade 11',
              track: 'Academic',
              strand: 'STEM',
              room: 'SHS Lab 1',
              capacity: 45,
              studentCount: 40,
              academicYear: { id: 'ay-1', name: '2026-2027' },
              adviser: {
                id: 't-2',
                firstName: 'Elena',
                lastName: 'Bautista',
                employeeId: 'EMP-003',
              },
            },
          ],
        } as any);
      }
      if (url.includes('/api/teachers')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 't-1', firstName: 'Maria', lastName: 'Santos', employeeId: 'EMP-001' },
            { id: 't-2', firstName: 'Elena', lastName: 'Bautista', employeeId: 'EMP-003' },
          ],
        } as any);
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 'sub-1', code: 'MATH7', name: 'Mathematics 7', gradeLevel: 'Grade 7', credits: 3.0 },
          ],
        } as any);
      }
      if (url.includes('/api/students')) {
        return Promise.resolve({
          success: true,
          data: [
            { id: 'stud-1', studentId: '2026-0001', firstName: 'Juan', lastName: 'Dela Cruz' },
            { id: 'stud-2', studentId: '2026-0002', firstName: 'Ana', lastName: 'Santos' },
          ],
        } as any);
      }
      if (url.includes('/api/grades/classes/class-1/matrix')) {
        return Promise.resolve({
          success: true,
          data: {
            subjectClass: {
              id: 'class-1',
              classCode: 'MATH7-SEC-A',
              capacity: 45,
              subject: { id: 'sub-1', code: 'MATH7', name: 'General Mathematics 7', credits: 3.0 },
              teacher: { id: 't-1', firstName: 'Maria', lastName: 'Santos' },
              section: { id: 'sec-1', name: 'Diamond', gradeLevel: 'Grade 7' },
            },
            totalEnrolled: 1,
            classAverage: 90.0,
            students: [
              {
                enrollmentId: 'enr-1',
                status: 'ENROLLED',
                student: {
                  id: 's-1',
                  studentId: '2026-0001',
                  firstName: 'Juan',
                  lastName: 'Dela Cruz',
                },
                grades: {
                  PRELIM: { score: 90, remarks: 'PASSED', isPublished: true },
                  MIDTERM: { score: 92, remarks: 'PASSED', isPublished: true },
                  FINALS: { score: 88, remarks: 'PASSED', isPublished: true },
                },
                finalAverage: 90.0,
                remarks: 'PASSED',
              },
            ],
          },
        } as any);
      }
      return Promise.resolve({ success: true, data: [] } as any);
    });
  });

  it('renders Access Restricted when user lacks permission to view class list', async () => {
    mockAuthUser = {
      id: 'user-parent',
      firstName: 'Maria',
      lastName: 'Parent',
      role: 'PARENT',
      permissions: [],
    };

    render(<GradesPage />);
    await waitFor(() => {
      expect(screen.getByText(/Access Restricted/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Class List & Trimestral Gradesheet/i)).not.toBeInTheDocument();
  });

  it('renders Class List table with sections, school year, SHS track/strand, and actions dropdown', async () => {
    const user = userEvent.setup();
    render(<GradesPage />);

    expect(screen.getByText(/Class List & Trimestral Gradesheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Trimestral Academic Calendar/i)).toBeInTheDocument();

    // Verify sections table & school year
    await waitFor(() => {
      expect(screen.getByText(/Section Diamond/i)).toBeInTheDocument();
      expect(screen.getByText(/Section STEM-A/i)).toBeInTheDocument();
    });

    // Check School Year badge
    expect(screen.getAllByText('2026-2027').length).toBeGreaterThanOrEqual(1);

    // Check SHS Track & Strand badge for Grade 11
    expect(screen.getByText(/Academic • STEM/i)).toBeInTheDocument();

    expect(screen.getByText(/Room 204/i)).toBeInTheDocument();
    expect(screen.getByText(/Roberto Cruz/i)).toBeInTheDocument();

    // Verify actions dropdown button exists
    const actionsBtn = screen.getByRole('button', { name: /Actions for Section Diamond/i });
    expect(actionsBtn).toBeInTheDocument();

    // Click dropdown to open menu
    await user.click(actionsBtn);
    expect(screen.getByRole('button', { name: /Enlist Students/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Enlist \/ Manage Subjects/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Trimestral Gradesheet/i }).length).toBeGreaterThanOrEqual(2);
  });

  it('opens Create Grade & Section modal and dynamically displays Track/Strand for Grade 11/12', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({
      success: true,
      data: { id: 'sec-new', name: 'Emerald', gradeLevel: 'Grade 11', track: 'Academic', strand: 'STEM' },
    } as any);

    render(<GradesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Section Diamond/i)).toBeInTheDocument();
    });

    const createSectionBtn = screen.getByRole('button', { name: /Create Grade & Section/i });
    expect(createSectionBtn).toBeInTheDocument();
    await user.click(createSectionBtn);

    // Verify modal elements
    expect(screen.getByRole('heading', { name: /Create Grade & Section/i })).toBeInTheDocument();
    expect(screen.getAllByText(/School Year/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/Grade Level/i).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Faculty Adviser/i)).toBeInTheDocument();

    // Initially Grade 7: SHS configuration should NOT be present
    expect(screen.queryByText(/Senior High School Program Configuration/i)).not.toBeInTheDocument();

    // Change grade level to Grade 11
    const gradeSelect = screen.getByDisplayValue('Grade 7');
    await user.selectOptions(gradeSelect, 'Grade 11');

    // Senior High Program Configuration should now appear
    expect(screen.getByText(/Senior High School Program Configuration/i)).toBeInTheDocument();
    expect(screen.getByText(/Academic Track/i)).toBeInTheDocument();

    // Fill in section name
    const sectionNameInput = screen.getByPlaceholderText(/e\.g\. Diamond, STEM-A, Rizal/i);
    await user.type(sectionNameInput, 'Emerald');

    // Submit
    const saveBtn = screen.getByRole('button', { name: /Save Section/i });
    await user.click(saveBtn);

    expect(api.post).toHaveBeenCalledWith(
      '/api/sections',
      expect.objectContaining({
        name: 'Emerald',
        gradeLevel: 'Grade 11',
        schoolYear: '2026-2027',
        track: 'Academic',
        strand: 'STEM',
      }),
    );
  });

  it('transitions to dedicated Enlist Students view with top search bar and bottom roster div', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({
      success: true,
      message: 'Student enlisted successfully',
    } as any);

    render(<GradesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Section Diamond/i)).toBeInTheDocument();
    });

    // Open Actions dropdown and select "Enlist Students"
    const actionsBtn = screen.getByRole('button', { name: /Actions for Section Diamond/i });
    await user.click(actionsBtn);

    const enlistStudentsBtn = screen.getByRole('button', { name: /Enlist Students/i });
    await user.click(enlistStudentsBtn);

    // Verify transition to Enlist Students view
    expect(screen.getByText(/Enlist Students — Section Diamond/i)).toBeInTheDocument();

    // Top Search Bar
    const searchInput = screen.getByPlaceholderText(/Type student name or LRN to enlist/i);
    expect(searchInput).toBeInTheDocument();

    // Bottom Div for enlisted students roster
    await waitFor(() => {
      expect(screen.getByText(/Enlisted Students on Current Section/i)).toBeInTheDocument();
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });

    // Search for unassigned student (e.g., Ana Santos)
    await user.type(searchInput, 'Ana');
    await waitFor(() => {
      expect(screen.getByText(/Santos, Ana/i)).toBeInTheDocument();
    });

    // Click Enlist (+)
    const enlistPlusBtn = screen.getByRole('button', { name: /Enlist \(\+\)/i });
    await user.click(enlistPlusBtn);

    expect(api.post).toHaveBeenCalledWith('/api/sections/sec-1/students', {
      studentIds: ['stud-2'],
    });
  });

  it('transitions to Enlist / Manage Subjects view with period ordering and Add Subject Offering modal', async () => {
    const user = userEvent.setup();
    render(<GradesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Section Diamond/i)).toBeInTheDocument();
    });

    const actionsBtn = screen.getByRole('button', { name: /Actions for Section Diamond/i });
    await user.click(actionsBtn);

    const manageSubjectsBtn = screen.getByRole('button', { name: /Enlist \/ Manage Subjects/i });
    await user.click(manageSubjectsBtn);

    // Verify transition to Enlist & Customize Subjects view
    expect(screen.getByText(/Enlist & Customize Subjects — Section Diamond/i)).toBeInTheDocument();
    expect(screen.getByText(/Enlisted Subject Courses & Timetable Sequence/i)).toBeInTheDocument();
    expect(screen.getByText(/Period 1/i)).toBeInTheDocument();
    expect(screen.getByText(/MATH7-SEC-A/i)).toBeInTheDocument();

    // Add Subject Offering modal
    const addSubjectBtn = screen.getByRole('button', { name: /Add Subject Offering/i });
    await user.click(addSubjectBtn);

    expect(screen.getByText(/Enlist Subject Offering — Section Diamond/i)).toBeInTheDocument();
    expect(screen.getByText('Subject Course')).toBeInTheDocument();
    expect(screen.getByText('Assigned Faculty / Teacher')).toBeInTheDocument();
  });

  it('switches to Trimestral Gradesheet tab and displays 1st, 2nd, and 3rd Term columns', async () => {
    const user = userEvent.setup();
    render(<GradesPage />);

    const gradesheetTab = screen.getByRole('button', { name: /Trimestral Gradesheet/i });
    await user.click(gradesheetTab);

    // Columns
    expect(screen.getAllByText('1st Term').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('2nd Term').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('3rd Term').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Final Term Average/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });
  });

  it('allows saving draft trimestral grades', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({ success: true, message: 'Grades saved' } as any);

    render(<GradesPage />);

    const gradesheetTab = screen.getByRole('button', { name: /Trimestral Gradesheet/i });
    await user.click(gradesheetTab);

    await waitFor(() => {
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });

    const saveDraftBtn = screen.getByRole('button', { name: /Save Draft/i });
    await user.click(saveDraftBtn);

    expect(api.post).toHaveBeenCalledWith(
      '/api/grades/classes/class-1/batch',
      expect.objectContaining({
        period: GradingPeriod.PRELIM,
        isPublished: false,
      }),
    );
  });
});
