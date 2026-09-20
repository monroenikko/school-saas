import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UsersPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('UsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/users/stats')) {
        return Promise.resolve({
          data: {
            totalUsers: 10,
            schoolAdmins: 2,
            teachers: 6,
            staff: 2,
            activeUsers: 9,
            suspendedUsers: 1,
            activeRate: 90,
          },
        } as any);
      }

      if (url.includes('/api/users')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'u-1',
                email: 'msantos@stjude.edu.ph',
                firstName: 'Maria',
                lastName: 'Santos',
                fullName: 'Maria Santos',
                role: 'TEACHER',
                status: 'ACTIVE',
                avatarUrl: null,
                createdAt: new Date().toISOString(),
                linkedTeacher: {
                  employeeId: 'TCH-2026-001',
                  specialization: 'Mathematics',
                },
              },
            ],
            meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
          },
        } as any);
      }

      return Promise.resolve({ data: [] } as any);
    });
  });

  it('renders staff directory heading, KPI cards, and table', async () => {
    render(<UsersPage />);

    expect(screen.getByText(/Users & Staff Management/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    expect(screen.getByText('msantos@stjude.edu.ph')).toBeInTheDocument();
    expect(screen.getAllByText('Faculty Teacher').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('90%')).toBeInTheDocument();
  });

  it('opens Add Staff Account modal on click', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    const addButton = screen.getByRole('button', { name: /add staff account/i });
    await user.click(addButton);

    expect(screen.getByRole('heading', { name: /add staff account/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. msantos@stjude\.edu\.ph/i)).toBeInTheDocument();
  });

  it('opens Edit Staff Profile modal on click', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    const editBtn = screen.getByTitle(/edit profile & role/i);
    await user.click(editBtn);

    expect(screen.getByText(/Edit Staff Profile/i)).toBeInTheDocument();
  });

  it('opens Reset Password modal on click', async () => {
    const user = userEvent.setup();
    render(<UsersPage />);

    await waitFor(() => {
      expect(screen.getByText('Maria Santos')).toBeInTheDocument();
    });

    const resetBtn = screen.getByTitle(/reset password/i);
    await user.click(resetBtn);

    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter new password/i)).toBeInTheDocument();
  });
});
