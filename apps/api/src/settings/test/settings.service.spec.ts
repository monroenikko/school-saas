import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '../settings.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const tenantId = 'tenant-st-jude';

  const mockTenant = {
    id: tenantId,
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
    academicYears: [
      {
        id: 'ay-1',
        name: '2026-2027',
        isCurrent: true,
        terms: [{ id: 'term-1', name: '1st Semester', isCurrent: true }],
      },
    ],
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getSettings', () => {
    it('should return school profile, academic term, and RFID timing policy', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenant);

      const settings = await service.getSettings(tenantId);

      expect(settings.name).toBe('St. Jude International Academy');
      expect(settings.currentAcademicYear?.name).toBe('2026-2027');
      expect(settings.rfidPolicy.lateCutoffTime).toBe('08:00');
    });
  });

  describe('updateSettings', () => {
    it('should update tenant phone and address', async () => {
      mockPrismaService.tenant.update.mockResolvedValue({
        ...mockTenant,
        phone: '+63 2 9999 8888',
      });

      const result = await service.updateSettings(tenantId, {
        phone: '+63 2 9999 8888',
        lateCutoffTime: '08:15',
      });

      expect(result.success).toBe(true);
      expect(mockPrismaService.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            phone: '+63 2 9999 8888',
          }),
        }),
      );
    });
  });
});
