import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardHeader } from '../header';

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/overview',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: 'test-1',
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'TEACHER',
      tenantName: 'St. Jude Academy',
    },
    logout: vi.fn(),
  }),
}));

describe('DashboardHeader', () => {
  it('renders breadcrumbs and brand correctly', () => {
    render(<DashboardHeader onMenuToggle={() => {}} />);
    expect(screen.getByText('EdVance')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('displays academic year context pill', () => {
    render(<DashboardHeader onMenuToggle={() => {}} />);
    expect(screen.getByText(/SY 2026-2027/i)).toBeInTheDocument();
  });
});
