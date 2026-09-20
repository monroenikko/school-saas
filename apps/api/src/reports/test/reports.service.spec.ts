import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from '../reports.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let prisma: PrismaService;

  const tenantId = 'tenant-uuid-1';

  const mockTenant = {
    id: tenantId,
    name: 'St. Jude International Academy',
    slug: '300412',
    address: 'Manila, Philippines',
    phone: '+63281234567',
    email: 'admin@stjude.edu.ph',
  };

  const mockSection = {
    id: 'sec-1',
    name: 'Diamond',
    gradeLevel: 'Grade 7',
    room: 'Room 201',
    academicYear: { name: '2026-2027' },
    adviser: { firstName: 'Maria', lastName: 'Santos' },
    students: [
      {
        studentId: 'stud-1',
        student: {
          id: 'stud-1',
          studentId: '2026-0001',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          middleName: 'Reyes',
          gender: 'MALE',
          birthDate: new Date('2013-05-15'),
          guardianName: 'Pedro Dela Cruz',
          guardianPhone: '+639171234567',
        },
      },
      {
        studentId: 'stud-2',
        student: {
          id: 'stud-2',
          studentId: '2026-0002',
          firstName: 'Ana',
          lastName: 'Santos',
          middleName: 'Garcia',
          gender: 'FEMALE',
          birthDate: new Date('2013-08-20'),
          guardianName: 'Elena Santos',
          guardianPhone: '+639189876543',
        },
      },
    ],
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    section: {
      findFirst: jest.fn(),
    },
    attendance: {
      findMany: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    parentTransaction: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSF1', () => {
    it('should generate DepEd SF1 with gender segregation and age computation', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);

      const res = await service.generateSF1(tenantId, { sectionId: 'sec-1' });

      expect(res.school?.name).toBe('St. Jude International Academy');
      expect(res.section?.name).toBe('Diamond');
      expect(res.maleStudents).toHaveLength(1);
      expect(res.femaleStudents).toHaveLength(1);
      expect(res.summary.totalCount).toBe(2);
      expect(res.maleStudents[0].fullName).toContain('Dela Cruz, Juan');
    });
  });

  describe('generateSF2', () => {
    it('should generate DepEd SF2 daily attendance ledger and statistics', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);
      mockPrismaService.attendance.findMany.mockResolvedValue([
        {
          studentId: 'stud-1',
          date: new Date(2026, 8, 1),
          status: 'PRESENT',
        },
        {
          studentId: 'stud-2',
          date: new Date(2026, 8, 1),
          status: 'LATE',
        },
      ]);

      const res = await service.generateSF2(tenantId, {
        sectionId: 'sec-1',
        month: 9,
        year: 2026,
      });

      expect(res.school?.name).toBe('St. Jude International Academy');
      expect(res.summary.enrollmentCount).toBe(2);
      expect(res.studentAttendance).toHaveLength(2);
      expect(res.studentAttendance[0].totalPresent).toBeGreaterThanOrEqual(1);
    });
  });

  describe('generateSF9', () => {
    it('should generate DepEd SF9 / Form 138 report card with general average', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.student.findFirst.mockResolvedValue({
        id: 'stud-1',
        studentId: '2026-0001',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        gender: 'MALE',
        sectionStudents: [
          {
            section: {
              name: 'Diamond',
              gradeLevel: 'Grade 7',
              academicYear: { name: '2026-2027' },
              adviser: { firstName: 'Maria', lastName: 'Santos' },
            },
          },
        ],
        grades: [
          {
            period: 'Q1',
            score: '92.00',
            subjectClass: {
              subject: { id: 's-1', code: 'MATH7', name: 'Mathematics 7' },
            },
          },
          {
            period: 'Q2',
            score: '94.00',
            subjectClass: {
              subject: { id: 's-1', code: 'MATH7', name: 'Mathematics 7' },
            },
          },
        ],
      });

      const res = await service.generateSF9(tenantId, 'stud-1');

      expect(res.student.name).toContain('Dela Cruz, Juan');
      expect(res.learningAreas).toHaveLength(1);
      expect(res.learningAreas[0].finalRating).toBe(93);
      expect(res.learningAreas[0].remarks).toBe('PASSED');
      expect(res.generalAverage).toBe(93);
      expect(res.descriptor).toBe('Outstanding');
      expect(res.promotionStatus).toBe('PROMOTED');
    });
  });

  describe('generateFinancialSummary', () => {
    it('should aggregate transactions, collections, and method breakdown', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.parentTransaction.findMany.mockResolvedValue([
        {
          id: 'tx-1',
          referenceNo: 'TXN-001',
          title: 'Tuition Q1',
          amount: '5000',
          status: 'COMPLETED',
          paymentMethod: 'GCASH',
          createdAt: new Date(),
        },
        {
          id: 'tx-2',
          referenceNo: 'TXN-002',
          title: 'Uniform Fee',
          amount: '2000',
          status: 'PENDING',
          paymentMethod: 'CASH',
          createdAt: new Date(),
        },
      ]);

      const res = await service.generateFinancialSummary(tenantId, {});

      expect(res.metrics.totalInvoiced).toBe(7000);
      expect(res.metrics.totalCollected).toBe(5000);
      expect(res.metrics.pendingReceivables).toBe(2000);
      expect(res.metrics.collectionRate).toBe(71);
      expect(res.methodBreakdown.GCASH).toBe(5000);
    });
  });

  describe('exportCSV', () => {
    it('should serialize SF1 to CSV format', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.section.findFirst.mockResolvedValue(mockSection);

      const csv = await service.exportCSV('SF1', tenantId, { type: 'SF1', sectionId: 'sec-1' });

      expect(csv).toContain('DEPED SCHOOL FORM 1');
      expect(csv).toContain('Dela Cruz');
      expect(csv).toContain('2026-0001');
    });
  });
});
