import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SectionsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SectionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/sections/stats')) {
        return Promise.resolve({
          success: true,
          data: {
            totalSections: 6,
            totalStudents: 180,
            averageClassSize: 30,
            utilizationRate: 67,
          },
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
      if (url.includes('/api/sections/sec-1')) {
        return Promise.resolve({
          success: true,
          data: {
            id: 'sec-1',
            name: 'Diamond',
            gradeLevel: 'Grade 7',
            capacity: 45,
            studentCount: 1,
            students: [
              {
                id: 'ss-1',
                studentId: 's-1',
                status: 'ACTIVE',
                student: {
                  id: 's-1',
                  studentId: '2026-0001',
                  firstName: 'Juan',
                  lastName: 'Dela Cruz',
                  rfidCardUid: 'E28068940000501234A1B2C1',
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
              room: 'Room 201',
              capacity: 45,
              studentCount: 35,
              classCount: 6,
              adviser: {
                id: 't-1',
                firstName: 'Maria',
                lastName: 'Santos',
                employeeId: 'EMP-001',
              },
              createdAt: new Date().toISOString(),
            },
          ],
        } as any);
      }
      return Promise.resolve({ success: true, data: [] } as any);
    });
  });

  it('renders section directory and cards with adviser info', async () => {
    render(<SectionsPage />);

    expect(screen.getByRole('heading', { name: /Sections/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Diamond')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Grade 7').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Maria Santos/i)).toBeInTheDocument();
    expect(screen.getByText(/Room 201/i)).toBeInTheDocument();
  });

  it('opens Add Section modal when clicking action button', async () => {
    const user = userEvent.setup();
    render(<SectionsPage />);

    const addButton = screen.getByRole('button', { name: /add section/i });
    await user.click(addButton);

    expect(screen.getByRole('heading', { name: /add new section/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create section/i })).toBeInTheDocument();
  });

  it('opens Students drawer when clicking View Students', async () => {
    const user = userEvent.setup();
    render(<SectionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Diamond')).toBeInTheDocument();
    });

    const rosterButton = screen.getByRole('button', { name: /view students/i });
    await user.click(rosterButton);

    await waitFor(() => {
      expect(screen.getByText(/Dela Cruz, Juan/i)).toBeInTheDocument();
    });
  });
});
