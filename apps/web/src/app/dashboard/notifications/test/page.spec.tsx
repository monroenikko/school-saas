import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotificationsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    request: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('NotificationsPage', () => {
  const mockStats = {
    totalDispatchedToday: 42,
    tapNotificationsSentToday: 38,
    deliverySuccessRate: 98,
    failedToday: 1,
    unreadCount: 4,
    queue: {
      status: 'IDLE',
      waiting: 0,
      active: 0,
      completed: 120,
      failed: 2,
    },
  };

  const mockNotifications = [
    {
      id: 'notif-1',
      tenantId: 'tenant-1',
      recipient: '+639171234567',
      title: '🟢 ARRIVED: Juan Dela Cruz',
      message: '[EdVance] Juan tapped at Gate 1 at 07:45 AM',
      type: 'ATTENDANCE_TAP',
      channel: 'SMS',
      status: 'DELIVERED',
      isRead: false,
      createdAt: new Date().toISOString(),
    },
  ];

  const mockAnnouncements = [
    {
      id: 'ann-1',
      tenantId: 'tenant-1',
      title: 'First Quarter Examination Schedule',
      content: 'Exams begin next Monday at 8:00 AM sharp.',
      audience: 'ALL',
      priority: 'HIGH',
      dispatchedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.request).mockImplementation((url: string) => {
      if (url.includes('/api/notifications/stats')) {
        return Promise.resolve({ data: mockStats } as any);
      }
      if (url.includes('/api/notifications/announcements')) {
        return Promise.resolve({ data: mockAnnouncements } as any);
      }
      if (url.includes('/api/students')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'stud-1',
                studentId: '2026-0001',
                firstName: 'Juan',
                lastName: 'Dela Cruz',
              },
            ],
          },
        } as any);
      }
      if (url.includes('/api/notifications')) {
        return Promise.resolve({
          data: {
            data: mockNotifications,
            meta: { total: 1, page: 1, limit: 15, totalPages: 1 },
          },
        } as any);
      }
      return Promise.resolve({ data: null } as any);
    });
  });

  it('renders title and 4 KPI summary cards', async () => {
    render(<NotificationsPage />);

    expect(screen.getByText('Notifications & SMS Dispatch Engine')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('42')).toBeInTheDocument(); // totalDispatchedToday
      expect(screen.getByText('38')).toBeInTheDocument(); // tapNotificationsSentToday
      expect(screen.getByText('98%')).toBeInTheDocument(); // deliverySuccessRate
      expect(screen.getByText('BullMQ Queue Status')).toBeInTheDocument();
    });
  });

  it('renders notifications list in table', async () => {
    render(<NotificationsPage />);

    await waitFor(() => {
      expect(screen.getByText('🟢 ARRIVED: Juan Dela Cruz')).toBeInTheDocument();
      expect(screen.getByText('+639171234567')).toBeInTheDocument();
      expect(screen.getByText('DELIVERED')).toBeInTheDocument();
    });
  });

  it('switches to Announcements tab and renders announcements', async () => {
    render(<NotificationsPage />);

    const annTab = screen.getByText('Announcements Hub');
    fireEvent.click(annTab);

    await waitFor(() => {
      expect(screen.getByText('First Quarter Examination Schedule')).toBeInTheDocument();
      expect(screen.getByText('Exams begin next Monday at 8:00 AM sharp.')).toBeInTheDocument();
    });
  });

  it('opens and closes the Broadcast Announcement modal', async () => {
    render(<NotificationsPage />);

    const broadcastBtn = screen.getByRole('button', { name: /Broadcast Announcement/i });
    fireEvent.click(broadcastBtn);

    expect(screen.getByPlaceholderText(/Schedule Changes for National Sports Fest/i)).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByPlaceholderText(/Schedule Changes for National Sports Fest/i)).not.toBeInTheDocument();
  });

  it('opens and closes the Simulate Gate Tap Alert modal', async () => {
    render(<NotificationsPage />);

    const simBtn = screen.getByRole('button', { name: /Simulate Tap Alert/i });
    fireEvent.click(simBtn);

    expect(screen.getByText('Simulate Gate Tap SMS')).toBeInTheDocument();

    const cancelBtn = screen.getByText('Cancel');
    fireEvent.click(cancelBtn);

    expect(screen.queryByText('Simulate Gate Tap SMS')).not.toBeInTheDocument();
  });
});
