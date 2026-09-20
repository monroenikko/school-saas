import { Test, TestingModule } from '@nestjs/testing';
import { SectionsService } from '../sections.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('SectionsService', () => {
  let service: SectionsService;
  let prisma: {
    section: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    academicYear: {
      findFirst: jest.Mock;
    };
    sectionStudent: {
      updateMany: jest.Mock;
      upsert: jest.Mock;
      count: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const tenantId = 'tenant-school-1';

  beforeEach(async () => {
    prisma = {
      section: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      academicYear: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ay-2026', isCurrent: true }),
      },
      sectionStudent: {
        updateMany: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SectionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SectionsService>(SectionsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query sections strictly scoped to tenantId', async () => {
      const mockSections = [
        {
          id: 'sec-1',
          name: 'Rizal',
          gradeLevel: 'Grade 7',
          adviser: { firstName: 'Maria', lastName: 'Santos' },
          _count: { students: 35, subjectClasses: 8 },
        },
      ];

      prisma.section.findMany.mockResolvedValue(mockSections);
      prisma.section.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(prisma.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
      expect(result.data[0].studentCount).toBe(35);
      expect(result.meta.total).toBe(1);
    });

    it('should query sections scoped to query.tenantId when provided', async () => {
      prisma.section.findMany.mockResolvedValue([]);
      prisma.section.count.mockResolvedValue(0);

      await service.findAll('', { page: 1, limit: 10, tenantId: 'tenant-school-2' });

      expect(prisma.section.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-school-2' }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should prevent duplicate section name in the same grade level and academic year', async () => {
      prisma.section.findUnique.mockResolvedValueOnce({ id: 'existing-sec' });

      await expect(
        service.create(tenantId, {
          name: 'Rizal',
          gradeLevel: 'Grade 7',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should auto-attach current active academic year if not provided', async () => {
      prisma.section.findUnique.mockResolvedValue(null);
      prisma.section.create.mockResolvedValue({
        id: 'new-sec',
        name: 'Bonifacio',
        gradeLevel: 'Grade 8',
        academicYearId: 'ay-2026',
      });

      const result = await service.create(tenantId, {
        name: 'Bonifacio',
        gradeLevel: 'Grade 8',
      });

      expect(prisma.section.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            academicYearId: 'ay-2026',
          }),
        }),
      );
      expect(result.id).toBe('new-sec');
    });
  });

  describe('assignStudents', () => {
    it('should bulk enroll students into section in a transaction', async () => {
      prisma.section.findFirst.mockResolvedValue({
        id: 'sec-1',
        tenantId,
        academicYearId: 'ay-2026',
      });
      prisma.sectionStudent.count.mockResolvedValue(2);

      const result = await service.assignStudents(tenantId, 'sec-1', ['s-1', 's-2']);

      expect(prisma.sectionStudent.updateMany).toHaveBeenCalled();
      expect(prisma.sectionStudent.upsert).toHaveBeenCalledTimes(2);
      expect(result.assignedCount).toBe(2);
      expect(result.totalEnrolled).toBe(2);
    });
  });
});
