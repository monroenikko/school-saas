import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TransactionsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('TransactionsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url.includes('/api/transactions/stats')) {
        return Promise.resolve({
          data: {
            totalInvoiced: 75000,
            totalCollected: 50000,
            pendingReceivables: 25000,
            totalTransactions: 15,
            completedCount: 10,
            pendingCount: 5,
            overdueCount: 1,
            collectionRate: 66.7,
          },
        } as any);
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

      if (url.includes('/api/transactions')) {
        return Promise.resolve({
          data: {
            data: [
              {
                id: 'txn-1',
                referenceNo: 'TXN-20260920-1001',
                title: '1st Quarter Tuition Fee',
                description: 'Q1 Tuition & Lab fees',
                amount: 7500,
                type: 'TUITION',
                status: 'PENDING',
                paymentMethod: null,
                dueDate: '2026-10-15',
                paidAt: null,
                receiptUrl: null,
                remarks: null,
                createdAt: new Date().toISOString(),
                student: {
                  id: 'stud-1',
                  studentId: '2026-0001',
                  fullName: 'Dela Cruz, Juan',
                  sectionName: 'Diamond',
                  gradeLevel: 'Grade 7',
                },
                parent: {
                  id: 'parent-1',
                  fullName: 'Pedro Dela Cruz',
                  email: 'pedro@example.com',
                  phone: '09171234567',
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

  it('renders billing header, financial KPI cards, and transaction records', async () => {
    render(<TransactionsPage />);

    expect(screen.getByText(/Parent Billing & Accounts/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('TXN-20260920-1001')).toBeInTheDocument();
    });

    expect(screen.getByText('Dela Cruz, Juan')).toBeInTheDocument();
    expect(screen.getByText('1st Quarter Tuition Fee')).toBeInTheDocument();
    expect(screen.getByText(/66.7%/i)).toBeInTheDocument();
  });

  it('opens Issue Invoice modal on button click', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    const issueButton = screen.getByRole('button', { name: /issue invoice/i });
    await user.click(issueButton);

    expect(screen.getByText(/Issue Fee Invoice/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\. 1st Quarter Tuition Fee/i)).toBeInTheDocument();
  });

  it('opens Record Payment modal and submits payment', async () => {
    const user = userEvent.setup();
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { success: true },
    } as any);

    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('TXN-20260920-1001')).toBeInTheDocument();
    });

    const payButton = screen.getByRole('button', { name: /receive pay/i });
    await user.click(payButton);

    expect(screen.getByText(/Record Payment Settlement/i)).toBeInTheDocument();

    const confirmButton = screen.getByRole('button', { name: /confirm settlement/i });
    await user.click(confirmButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        '/api/transactions/txn-1/pay',
        expect.objectContaining({
          paymentMethod: 'CASH',
        }),
      );
    });
  });

  it('opens Official Electronic Receipt modal', async () => {
    const user = userEvent.setup();
    render(<TransactionsPage />);

    await waitFor(() => {
      expect(screen.getByText('TXN-20260920-1001')).toBeInTheDocument();
    });

    const receiptButton = screen.getByTitle(/view official receipt/i);
    await user.click(receiptButton);

    expect(screen.getByText(/Official Electronic Receipt Preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /print receipt/i })).toBeInTheDocument();
  });
});
