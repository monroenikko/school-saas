import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from '../tenants.service';
import { PrismaService } from '../../prisma/prisma.service';
import { Role, TenantStatus } from '@school-saas/shared';

describe('TenantsService', () => {
  let service: TenantsService;
  let prisma: PrismaService;

  const mockTenants = [
    {
      id: 'tenant-1',
      name: 'St. Jude International Academy',
      slug: 'st-jude-academy',
      domain: 'stjude.edu.ph',
      status: TenantStatus.ACTIVE,
      plan: 'ENTERPRISE',
      logoUrl: null,
      currency: 'PHP',
      timezone: 'Asia/Manila',
    },
    {
      id: 'tenant-2',
      name: 'Oakwood Academy',
      slug: 'oakwood-academy',
      domain: 'oakwood.edu.ph',
      status: TenantStatus.ACTIVE,
      plan: 'STANDARD',
      logoUrl: null,
      currency: 'PHP',
      timezone: 'Asia/Manila',
    },
  ];

  const mockPrismaService = {
    tenant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('returns all active tenants for SUPER_ADMIN', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue(mockTenants);

      const result = await service.findAll(Role.SUPER_ADMIN, null);

      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        where: { status: TenantStatus.ACTIVE },
        orderBy: { name: 'asc' },
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('St. Jude International Academy');
    });

    it('returns only current tenant for SCHOOL_ADMIN', async () => {
      mockPrismaService.tenant.findMany.mockResolvedValue([mockTenants[0]]);

      const result = await service.findAll(Role.SCHOOL_ADMIN, 'tenant-1');

      expect(prisma.tenant.findMany).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('tenant-1');
    });
  });

  describe('findOne', () => {
    it('returns tenant when found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(mockTenants[0]);

      const result = await service.findOne('tenant-1');

      expect(prisma.tenant.findUnique).toHaveBeenCalledWith({
        where: { id: 'tenant-1' },
        select: expect.objectContaining({ id: true, name: true }),
      });
      expect(result.id).toBe('tenant-1');
    });

    it('throws NotFoundException when tenant is not found', async () => {
      mockPrismaService.tenant.findUnique.mockResolvedValue(null);

      await expect(service.findOne('invalid-id')).rejects.toThrow(
        'School tenant with ID "invalid-id" not found',
      );
    });
  });
});
