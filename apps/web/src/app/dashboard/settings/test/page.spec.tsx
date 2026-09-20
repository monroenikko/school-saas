import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SettingsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/settings')) {
        return Promise.resolve({
          data: {
            id: 'tenant-1',
            name: 'St. Jude International Academy',
            slug: 'st-jude-academy',
            domain: 'stjude.schoolsaas.com',
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            address: '123 Academic Avenue, QC',
            phone: '+63 2 8123 4567',
            email: 'admin@stjude.edu.ph',
            currency: 'PHP',
            timezone: 'Asia/Manila',
            logoUrl: null,
            currentAcademicYear: {
              name: '2026-2027',
              currentTerm: '1st Semester',
            },
            rfidPolicy: {
              lateCutoffTime: '08:00',
              afternoonExitStartTime: '15:30',
              debounceSeconds: 60,
              autoSmsAlerts: true,
            },
          },
        } as any);
      }

      return Promise.resolve({ data: [] } as any);
    });
  });

  it('renders settings title and loads school institutional details', async () => {
    render(<SettingsPage />);

    expect(screen.getByText(/School Settings & Configuration/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByDisplayValue('St. Jude International Academy')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('+63 2 8123 4567')).toBeInTheDocument();
  });

  it('switches to RFID Gate Policies tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const rfidTab = screen.getByRole('button', { name: /rfid gate policies/i });
    await user.click(rfidTab);

    expect(screen.getByText(/Gate Turnstile Timing & Attendance Policy/i)).toBeInTheDocument();
    expect(screen.getByText(/Late Arrival Cutoff Time/i)).toBeInTheDocument();
  });

  it('switches to Role Permissions Matrix tab', async () => {
    const user = userEvent.setup();
    render(<SettingsPage />);

    const rolesTab = screen.getByRole('button', { name: /role permissions matrix/i });
    await user.click(rolesTab);

    expect(screen.getByText(/Role-Based Access Control \(RBAC\) Matrix/i)).toBeInTheDocument();
    expect(screen.getByText('Learner Students Directory')).toBeInTheDocument();
  });

  it('submits updated settings and displays success message', async () => {
    const user = userEvent.setup();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: { success: true },
    } as any);

    render(<SettingsPage />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('St. Jude International Academy')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(
        '/api/settings',
        expect.objectContaining({
          name: 'St. Jude International Academy',
        }),
      );
    });

    expect(
      screen.getByText(/School settings and attendance policies saved successfully/i),
    ).toBeInTheDocument();
  });
});
