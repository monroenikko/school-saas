import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GradesPage from '../page';
import { api } from '@/lib/api';
import { GradingPeriod } from '@school-saas/shared';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('GradesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
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
      if (url.includes('/api/sections')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 'sec-1',
              name: 'Diamond',
              gradeLevel: 'Grade 7',
              studentCount: 35,
            },
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
                  Q1: { score: 90, remarks: 'PASSED', isPublished: true },
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

  it('renders page header, class details, and student grade matrix', async () => {
    render(<GradesPage />);

    expect(screen.getByText(/Academic Grading & Subject Enrollment/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });

    expect(screen.getByText('2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('PASSED').length).toBeGreaterThanOrEqual(1);
  });

  it('opens Enroll Entire Section modal when clicking action button', async () => {
    const user = userEvent.setup();
    render(<GradesPage />);

    const enrollSectionBtn = screen.getByRole('button', { name: /enroll entire section/i });
    await user.click(enrollSectionBtn);

    expect(screen.getByRole('heading', { name: /enroll entire section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enroll section learners/i })).toBeInTheDocument();
  });

  it('allows editing scores and saving draft grades', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({ success: true, message: 'Grades saved' } as any);

    render(<GradesPage />);

    await waitFor(() => {
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });

    const saveBtn = screen.getByRole('button', { name: /save Q1 draft/i });
    await user.click(saveBtn);

    expect(api.post).toHaveBeenCalledWith(
      '/api/grades/classes/class-1/batch',
      expect.objectContaining({
        period: GradingPeriod.Q1,
        isPublished: false,
      }),
    );
  });
});
