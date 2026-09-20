import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TeachersPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TeachersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/teachers/stats')) {
        return Promise.resolve({
          data: { total: 12, active: 10, onLeave: 2 },
        } as any);
      }
      if (url.includes('/api/teachers')) {
        return Promise.resolve({
          data: [
            {
              id: 't-1',
              employeeId: 'TCH-2026-001',
              firstName: 'Maria',
              lastName: 'Santos',
              email: 'msantos@stjude.edu.ph',
              phone: '09170010001',
              specialization: 'Mathematics',
              status: 'ACTIVE',
              advisorySections: [{ id: 'sec-1', name: 'Grade 7 - Rizal', gradeLevel: 7 }],
              createdAt: new Date().toISOString(),
            },
          ],
          meta: { total: 1, totalPages: 1 },
        } as any);
      }
      return Promise.resolve({ data: [] } as any);
    });
  });

  it('renders directory heading and teacher table correctly', async () => {
    render(<TeachersPage />);

    expect(screen.getByText(/Faculty & Teachers Directory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    expect(screen.getByText('TCH-2026-001')).toBeInTheDocument();
    expect(screen.getAllByText('Mathematics').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Grade 7 - Rizal').length).toBeGreaterThanOrEqual(1);
  });

  it('opens Add New Faculty modal when clicking action button', async () => {
    const user = userEvent.setup();
    render(<TeachersPage />);

    const addButton = screen.getByRole('button', { name: /add new faculty/i });
    await user.click(addButton);

    expect(screen.getByText(/Register New Faculty/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /register faculty/i })).toBeInTheDocument();
  });
});
