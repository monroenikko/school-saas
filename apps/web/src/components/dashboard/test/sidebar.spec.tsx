import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DashboardSidebar } from '../sidebar';

let mockUser: any = {
  id: 'user-school-admin',
  firstName: 'Corazon',
  lastName: 'Aquino',
  role: 'SCHOOL_ADMIN',
  tenantName: 'St. Jude Academy',
};

vi.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

vi.mock('@/context/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    logout: vi.fn(),
  }),
}));

describe('DashboardSidebar', () => {
  it('renders all school modules including Parent Billing for SCHOOL_ADMIN', () => {
    mockUser = {
      id: 'user-school-admin',
      firstName: 'Corazon',
      lastName: 'Aquino',
      role: 'SCHOOL_ADMIN',
      tenantName: 'St. Jude Academy',
    };

    render(<DashboardSidebar isCollapsed={false} setIsCollapsed={() => {}} />);

    // School Admin modules
    expect(screen.getByText('EdVance')).toBeInTheDocument();
    expect(screen.getByText('St. Jude Academy')).toBeInTheDocument();
    expect(screen.getByText('Students Roster')).toBeInTheDocument();
    expect(screen.getByText('Faculty & Teachers')).toBeInTheDocument();
    expect(screen.getByText('RFID Attendance')).toBeInTheDocument();
    expect(screen.getByText('Parent Billing')).toBeInTheDocument();
    expect(screen.getByText('School Settings')).toBeInTheDocument();

    // Should NOT see Platform Administration
    expect(screen.queryByText('Platform Administration')).not.toBeInTheDocument();
  });

  it('renders Platform Administration group for SUPER_ADMIN', () => {
    mockUser = {
      id: 'user-super-admin',
      firstName: 'System',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      tenantName: 'Platform Central',
    };

    render(<DashboardSidebar isCollapsed={false} setIsCollapsed={() => {}} />);

    expect(screen.getByText('Platform Administration')).toBeInTheDocument();
    expect(screen.getByText('All Schools / Tenants')).toBeInTheDocument();
    expect(screen.getByText('Parent Billing')).toBeInTheDocument();
  });
});
