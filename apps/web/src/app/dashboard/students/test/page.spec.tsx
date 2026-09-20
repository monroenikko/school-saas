import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudentsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('StudentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/students/stats')) {
        return Promise.resolve({
          data: { total: 42, active: 40, badged: 38, unassigned: 4 },
        } as any);
      }
      if (url.includes('/api/students/sections')) {
        return Promise.resolve({
          data: [
            { id: 'sec-1', name: 'Grade 7 - Rizal', gradeLevel: 7 },
            { id: 'sec-2', name: 'Grade 8 - Bonifacio', gradeLevel: 8 },
          ],
        } as any);
      }
      if (url.includes('/api/students')) {
        return Promise.resolve({
          data: [
            {
              id: 's-1',
              studentId: '2026-0001',
              firstName: 'Juan',
              lastName: 'Dela Cruz',
              middleName: 'Protacio',
              gender: 'MALE',
              status: 'ACTIVE',
              rfidCardUid: 'E28068940000501234A1B2C1',
              guardianName: 'Juan Dela Cruz Sr.',
              guardianPhone: '09171234567',
              currentSection: { id: 'sec-1', name: 'Grade 7 - Rizal', gradeLevel: 7 },
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, totalPages: 1 },
        } as any);
      }
      return Promise.resolve({ data: [] } as any);
    });
  });

  it('renders directory heading and stats correctly', async () => {
    render(<StudentsPage />);

    expect(screen.getByText(/Students Directory & Rosters/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz')).toBeInTheDocument();
    });

    expect(screen.getByText('2026-0001')).toBeInTheDocument();
    expect(screen.getAllByText('Grade 7 - Rizal').length).toBeGreaterThanOrEqual(1);
  });

  it('opens Enroll New Student modal when clicking action button', async () => {
    const user = userEvent.setup();
    render(<StudentsPage />);

    const enrollButton = screen.getByRole('button', { name: /enroll new student/i });
    await user.click(enrollButton);

    expect(screen.getByText(/Learner Identity/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enroll student/i })).toBeInTheDocument();
  });
});
