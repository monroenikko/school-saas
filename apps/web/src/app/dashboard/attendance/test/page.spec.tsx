import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AttendancePage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AttendancePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/attendance/stats')) {
        return Promise.resolve({
          data: {
            date: '2026-09-20',
            totalEnrolled: 45,
            presentCount: 38,
            lateCount: 4,
            excusedCount: 1,
            totalTappedIn: 42,
            notTappedCount: 2,
            attendanceRate: 93.3,
          },
        } as any);
      }

      if (url.includes('/api/attendance/recent-taps')) {
        return Promise.resolve({
          data: [
            {
              id: 'tap-1',
              cardUid: 'E28068940000501234A1B2C1',
              deviceId: 'TURNSTILE-01',
              scanType: 'TIME_IN',
              scannedAt: new Date().toISOString(),
              processed: true,
              errorMessage: null,
              student: {
                id: 's-1',
                studentId: '2026-0001',
                fullName: 'Juan Dela Cruz Jr.',
                photoUrl: null,
                sectionName: 'Diamond',
                gradeLevel: 'Grade 7',
              },
            },
          ],
        } as any);
      }

      if (url.includes('/api/rfid/devices')) {
        return Promise.resolve({
          data: [
            {
              id: 'dev-1',
              deviceId: 'TURNSTILE-01',
              name: 'Main Gate Turnstile 1',
              location: 'Main Entrance',
              status: 'ACTIVE',
              isOnline: true,
              lastHeartbeatAt: new Date().toISOString(),
              totalTaps: 42,
              createdAt: new Date().toISOString(),
            },
          ],
        } as any);
      }

      if (url.includes('/api/students')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 's-1',
                studentId: '2026-0001',
                firstName: 'Juan',
                lastName: 'Dela Cruz Jr.',
                rfidCardUid: 'E28068940000501234A1B2C1',
              },
            ],
          },
        } as any);
      }

      if (url.includes('/api/sections')) {
        return Promise.resolve({
          data: {
            data: [{ id: 'sec-1', name: 'Diamond', gradeLevel: 7 }],
          },
        } as any);
      }

      if (url.includes('/api/attendance')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'att-1',
                date: '2026-09-20T00:00:00.000Z',
                timeIn: '2026-09-20T07:28:00.000Z',
                timeOut: null,
                status: 'PRESENT',
                remarks: 'On time tap',
                student: {
                  id: 's-1',
                  studentId: '2026-0001',
                  fullName: 'Dela Cruz Jr., Juan',
                  photoUrl: null,
                  rfidCardUid: 'E28068940000501234A1B2C1',
                  sectionName: 'Diamond',
                  gradeLevel: 'Grade 7',
                },
                device: {
                  id: 'dev-1',
                  deviceId: 'TURNSTILE-01',
                  name: 'Main Gate Turnstile 1',
                  location: 'Main Entrance',
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

  it('renders attendance page title, KPI cards, and records table', async () => {
    render(<AttendancePage />);

    expect(screen.getByText(/RFID Attendance & Turnstile Gate/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Dela Cruz Jr., Juan')).toBeInTheDocument();
    });

    expect(screen.getByText('38')).toBeInTheDocument(); // Present Today
    expect(screen.getByText('93.3%')).toBeInTheDocument(); // Attendance rate
    expect(screen.getByText('Main Gate Turnstile 1')).toBeInTheDocument();
  });

  it('switches to Live Gate Stream tab and shows turnstile tap events', async () => {
    const user = userEvent.setup();
    render(<AttendancePage />);

    const streamTab = screen.getByRole('button', { name: /live gate stream/i });
    await user.click(streamTab);

    expect(screen.getByText(/Live Turnstile Event Stream/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Juan Dela Cruz Jr.')).toBeInTheDocument();
    });
  });

  it('opens and submits Simulate RFID Tap modal', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        scanType: 'TIME_IN',
        scannedAt: new Date().toISOString(),
        student: { firstName: 'Juan', lastName: 'Dela Cruz Jr.', studentId: '2026-0001' },
        attendance: { status: 'PRESENT' },
        device: { name: 'Main Gate Turnstile 1', deviceId: 'TURNSTILE-01' },
      },
    } as any);

    render(<AttendancePage />);

    const simButton = screen.getByRole('button', { name: /simulate rfid tap/i });
    await user.click(simButton);

    expect(screen.getByText(/Simulate RFID Gate Tap/i)).toBeInTheDocument();

    const cardInput = screen.getByPlaceholderText(/e\.g\. E2806894/i);
    await user.type(cardInput, 'E28068940000501234A1B2C1');

    const submitTap = screen.getByRole('button', { name: /tap turnstile/i });
    await user.click(submitTap);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/rfid/tap', expect.objectContaining({
        cardUid: 'E28068940000501234A1B2C1',
      }));
    });
  });
});
