import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardHeader } from '../header';

let mockUser = {
  id: 'test-1',
  firstName: 'Maria',
  lastName: 'Santos',
  role: 'TEACHER',
  tenantName: 'St. Jude Academy',
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/overview',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}));

vi.mock('@/lib/api', () => ({
  apiClient: {
    getActiveTenantId: vi.fn(() => ''),
    setActiveTenantId: vi.fn(),
    request: vi.fn(() =>
      Promise.resolve({
        data: [
          { id: 't-1', name: 'St. Jude International Academy', slug: 'st-jude' },
          { id: 't-2', name: 'Oakwood Academy', slug: 'oakwood' },
        ],
      }),
    ),
  },
}));

describe('DashboardHeader', () => {
  beforeEach(() => {
    mockUser = {
      id: 'test-1',
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'TEACHER',
      tenantName: 'St. Jude Academy',
    };
  });

  it('renders breadcrumbs and brand correctly', () => {
    render(<DashboardHeader onMenuToggle={() => {}} />);
    expect(screen.getByText('EdVance')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('displays academic year context pill and school badge for staff', () => {
    render(<DashboardHeader onMenuToggle={() => {}} />);
    expect(screen.getByText(/SY 2026-2027/i)).toBeInTheDocument();
    expect(screen.getByText('St. Jude Academy')).toBeInTheDocument();
  });

  it('renders School Selector dropdown for SUPER_ADMIN', async () => {
    mockUser = {
      id: 'super-admin',
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantName: '',
    };

    render(<DashboardHeader onMenuToggle={() => {}} />);
    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: /select school/i })).toBeInTheDocument();
      expect(screen.getByText(/All Schools \(Global\)/i)).toBeInTheDocument();
    });
  });

  it('toggles notification dropdown when bell icon is clicked', async () => {
    const { fireEvent } = await import('@testing-library/react');
    render(<DashboardHeader onMenuToggle={() => {}} />);

    const bellBtn = screen.getByRole('button', { name: /notifications/i });
    expect(bellBtn).toBeInTheDocument();

    fireEvent.click(bellBtn);
    expect(screen.getByText('View All Notifications & Dispatch Logs')).toBeInTheDocument();
  });
});

