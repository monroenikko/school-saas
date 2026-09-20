import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { IdCardsService } from '../id-cards.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CardOrientation } from '../dto/id-card-template.dto';

describe('IdCardsService', () => {
  let service: IdCardsService;
  let prisma: PrismaService;

  const tenantId = 'tenant-uuid-1';

  const mockTenant = {
    id: tenantId,
    name: 'St. Jude International Academy',
    slug: '300412',
    address: '1004 Gen. Luna St., Ermita, Manila',
    phone: '+63 2 8524 4611',
    email: 'admin@stjude.edu.ph',
    logoUrl: 'https://example.com/logo.png',
  };

  const mockStudent = {
    id: 'stud-1',
    studentId: '109283746512',
    firstName: 'Juanita Margarita',
    lastName: 'Dela Cruz',
    middleName: 'Reyes',
    gender: 'FEMALE',
    rfidCardUid: 'E200001928374',
    guardianName: 'Maria Dela Cruz',
    guardianPhone: '+63 917 555 1234',
    emergencyContact: '+63 917 555 1234',
    photoUrl: 'https://example.com/avatar.jpg',
    sectionStudents: [
      {
        status: 'ACTIVE',
        section: {
          id: 'sec-1',
          name: 'Diamond',
          gradeLevel: 'Grade 7',
          academicYear: { name: '2026-2027' },
          adviser: { firstName: 'Roberto', lastName: 'Cruz' },
        },
      },
    ],
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdCardsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<IdCardsService>(IdCardsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getTemplates', () => {
    it('should return available CR80 ID card layout templates', () => {
      const templates = service.getTemplates(tenantId);
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThanOrEqual(4);
      expect(templates[0]).toHaveProperty('id');
      expect(templates[0]).toHaveProperty('orientation');
      expect(templates[0]).toHaveProperty('safeMarginPercent');
    });
  });

  describe('getStudentBadgeData', () => {
    it('should return complete badge data for an existing student', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);

      const result = await service.getStudentBadgeData(tenantId, 'stud-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('stud-1');
      expect(result.lrn).toBe('109283746512');
      expect(result.fullName).toBe('Juanita Margarita R. Dela Cruz');
      expect(result.rfidCardUid).toBe('E200001928374');
      expect(result.sectionName).toBe('Diamond');
      expect(result.gradeLevel).toBe('Grade 7');
      expect(result.adviserName).toBe('Roberto Cruz');
      expect(result.school.name).toBe(mockTenant.name);
      expect(result.school.schoolId).toBe('300412');
      expect(result.qrCodeData).toContain('EDVANCE:VERIFY');
      expect(result.barcodeData).toBe('109283746512');
    });

    it('should throw NotFoundException if student is not found', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.student.findFirst.mockResolvedValue(null);

      await expect(service.getStudentBadgeData(tenantId, 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getBatchBadgeData', () => {
    it('should return formatted badge cards for batch printing', async () => {
      mockPrismaService.tenant.findFirst.mockResolvedValue(mockTenant);
      mockPrismaService.student.findMany.mockResolvedValue([mockStudent]);

      const result = await service.getBatchBadgeData(tenantId, { sectionId: 'sec-1' });

      expect(result.total).toBe(1);
      expect(result.badges).toHaveLength(1);
      expect(result.badges[0].fullName).toBe('Juanita Margarita R. Dela Cruz');
      expect(result.badges[0].rfidCardUid).toBe('E200001928374');
      expect(result.badges[0].sectionName).toBe('Diamond');
    });
  });

  describe('saveCustomTemplate', () => {
    it('should successfully save and return a custom template config', () => {
      const dto = {
        name: 'Custom Gold CR80',
        orientation: CardOrientation.PORTRAIT,
        accentColor: '#d97706',
        headerColor: '#78350f',
        textColor: '#0f172a',
        showQrCode: true,
        showBarcode: true,
        showRfidUid: true,
        showGuardianInfo: true,
        safeMarginPercent: 6,
      };

      const result = service.saveCustomTemplate(tenantId, dto);

      expect(result.success).toBe(true);
      expect(result.template.name).toBe('Custom Gold CR80');
      expect(result.template.accentColor).toBe('#d97706');
      expect(result.template.safeMarginPercent).toBe(6);
    });
  });
});
