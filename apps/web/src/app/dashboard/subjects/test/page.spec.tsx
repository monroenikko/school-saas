import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubjectsPage from '../page';
import { api } from '@/lib/api';
import { DayOfWeek } from '@school-saas/shared';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SubjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/subjects/terms')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 'term-1',
              name: '1st Semester',
              startDate: '2026-08-01',
              endDate: '2026-12-18',
              isCurrent: true,
            },
            {
              id: 'term-2',
              name: '2nd Semester',
              startDate: '2027-01-10',
              endDate: '2027-05-30',
              isCurrent: false,
            },
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
              room: 'Room 201',
              capacity: 45,
              enrolledCount: 30,
              subject: {
                id: 'sub-1',
                code: 'MATH7',
                name: 'General Mathematics 7',
                credits: 3.0,
                gradeLevel: 'Grade 7',
              },
              teacher: {
                id: 't-1',
                firstName: 'Maria',
                lastName: 'Santos',
                employeeId: 'EMP-001',
              },
              section: {
                id: 'sec-1',
                name: 'Diamond',
                gradeLevel: 'Grade 7',
              },
              termsList: [
                { id: 'term-1', name: '1st Semester', isCurrent: true },
              ],
              schedules: [
                {
                  id: 'sch-1',
                  dayOfWeek: DayOfWeek.MONDAY,
                  startTime: '08:00',
                  endTime: '09:30',
                  room: 'Room 201',
                },
              ],
              createdAt: new Date().toISOString(),
            },
          ],
        } as any);
      }
      if (url.includes('/api/subjects')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 'sub-1',
              code: 'MATH7',
              name: 'General Mathematics 7',
              credits: 3.0,
              gradeLevel: 'Grade 7',
              classCount: 1,
              createdAt: new Date().toISOString(),
            },
          ],
        } as any);
      }
      if (url.includes('/api/teachers')) {
        return Promise.resolve({
          success: true,
          data: [
            {
              id: 't-1',
              firstName: 'Maria',
              lastName: 'Santos',
              employeeId: 'EMP-001',
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
            },
          ],
        } as any);
      }
      return Promise.resolve({ success: true, data: [] } as any);
    });
  });

  it('renders page header and class offerings table', async () => {
    render(<SubjectsPage />);

    expect(screen.getByText(/Subjects & Schedules/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('MATH7-SEC-A')).toBeInTheDocument();
    });

    expect(screen.getByText('General Mathematics 7')).toBeInTheDocument();
    expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
    expect(screen.getByText(/Diamond/i)).toBeInTheDocument();
  });

  it('opens Create Class Offering modal with multiple terms select and schedule slots', async () => {
    const user = userEvent.setup();
    render(<SubjectsPage />);

    const createBtn = screen.getByRole('button', { name: /create class offering/i });
    await user.click(createBtn);

    expect(screen.getByRole('heading', { name: /create class offering/i })).toBeInTheDocument();
    expect(screen.getByText(/Applicable Academic Terms \(Multiple Select\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Weekly Timetable Schedules/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add time slot/i })).toBeInTheDocument();
  });

  it('switches to Master Subjects Catalog tab', async () => {
    const user = userEvent.setup();
    render(<SubjectsPage />);

    const catalogTab = screen.getByRole('button', { name: /master subjects catalog/i });
    await user.click(catalogTab);

    await waitFor(() => {
      expect(screen.getByText('MATH7')).toBeInTheDocument();
      expect(screen.getByText('3 Units')).toBeInTheDocument();
    });
  });
});
