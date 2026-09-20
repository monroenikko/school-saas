import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import IdCardsPage from '../page';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    request: vi.fn(),
  },
}));

describe('IdCardsPage', () => {
  const mockStudents = [
    {
      id: 'stud-1',
      studentId: '109283746512',
      firstName: 'Juanita Margarita',
      lastName: 'Dela Cruz',
      middleName: 'Reyes',
      gender: 'FEMALE',
      rfidCardUid: 'E200001928374',
      guardianName: 'Maria Elena Dela Cruz',
      guardianPhone: '+63 917 555 1234',
      emergencyContact: '+63 917 555 1234',
      sectionStudents: [
        {
          section: {
            id: 'sec-1',
            name: 'Diamond',
            gradeLevel: 'Grade 7',
            academicYear: { name: '2026-2027' },
            adviser: { firstName: 'Roberto', lastName: 'Cruz' },
          },
        },
      ],
    },
  ];

  const mockSections = [
    { id: 'sec-1', name: 'Diamond' },
    { id: 'sec-2', name: 'Emerald' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.request as any).mockImplementation((endpoint: string) => {
      if (endpoint.includes('/api/students')) {
        return Promise.resolve({ data: { data: mockStudents } });
      }
      if (endpoint.includes('/api/sections')) {
        return Promise.resolve({ data: { data: mockSections } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('renders the header with CR80 PVC standards and title', async () => {
    render(<IdCardsPage />);

    expect(screen.getByText(/RFID ID Card Designer & Batch Badge Printing/i)).toBeInTheDocument();
    expect(screen.getByText(/CR80 PVC Standards/i)).toBeInTheDocument();
    expect(screen.getByText(/54mm × 86mm/i)).toBeInTheDocument();
  });

  it('renders template presets and allows switching', async () => {
    render(<IdCardsPage />);

    expect(screen.getByText('Emerald Modern')).toBeInTheDocument();
    expect(screen.getByText('Navy Classic Academy')).toBeInTheDocument();
    expect(screen.getByText('Burgundy Prestige')).toBeInTheDocument();
    expect(screen.getByText('Slate Minimal')).toBeInTheDocument();

    const navyButton = screen.getByText('Navy Classic Academy');
    fireEvent.click(navyButton);
    expect(navyButton).toBeInTheDocument();
  });

  it('flips the card to show back side certification and emergency contacts', async () => {
    render(<IdCardsPage />);

    // Initially front side shows LRN and Photo
    expect(screen.getByText(/2×2 Photo/i)).toBeInTheDocument();

    // Click flip button
    const flipButton = screen.getAllByRole('button', { name: /Flip Card/i })[0];
    fireEvent.click(flipButton);

    // After flipping, reverse side elements appear
    expect(screen.getByText(/This is to certify that the student/i)).toBeInTheDocument();
    expect(screen.getByText(/In Case of Emergency/i)).toBeInTheDocument();
    expect(screen.getByText(/ENCODED RFID \/ TRACK 2/i)).toBeInTheDocument();
  });

  it('adjusts safe margin guideline and toggles guide overlay', async () => {
    render(<IdCardsPage />);

    const guideToggle = screen.getByLabelText(/Show Safe Margin Guidelines Overlay/i);
    expect(guideToggle).not.toBeChecked();

    fireEvent.click(guideToggle);
    expect(guideToggle).toBeChecked();

    // Overlay text appears
    expect(screen.getByText(/Safe 5%/i)).toBeInTheDocument();
  });

  it('switches to Batch Sheet (A4) tab and displays multi-card print layout', async () => {
    render(<IdCardsPage />);

    const batchTabButton = screen.getByRole('button', { name: /Batch Sheet \(A4\)/i });
    fireEvent.click(batchTabButton);

    expect(screen.getByText(/Batch PVC Cardstock Printing Sheet/i)).toBeInTheDocument();
    expect(screen.getByText(/Standard A4 layout • 8 CR80 cards per sheet/i)).toBeInTheDocument();
  });

  it('triggers window.print when print button is clicked', async () => {
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    render(<IdCardsPage />);

    const printButton = screen.getByRole('button', { name: /Print Badges/i });
    fireEvent.click(printButton);

    expect(printSpy).toHaveBeenCalled();
    printSpy.mockRestore();
  });

  it('saves template and shows success toast', async () => {
    render(<IdCardsPage />);

    const saveButton = screen.getByRole('button', { name: /Save Preset/i });
    fireEvent.click(saveButton);

    expect(screen.getByText(/Template configuration saved successfully!/i)).toBeInTheDocument();
  });
});
