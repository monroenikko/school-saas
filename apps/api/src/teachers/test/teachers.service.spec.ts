import { Test, TestingModule } from '@nestjs/testing';
import { TeachersService } from '../teachers.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TeacherStatus } from '@school-saas/shared';

describe('TeachersService', () => {
  let service: TeachersService;
  let prisma: {
    teacher: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  const tenantId = 'tenant-school-1';

  beforeEach(async () => {
    prisma = {
      teacher: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeachersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TeachersService>(TeachersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query teachers strictly scoped to tenantId', async () => {
      const mockTeachers = [
        {
          id: 't-1',
          tenantId,
          employeeId: 'TCH-2026-001',
          firstName: 'Maria',
          lastName: 'Santos',
          specialization: 'Mathematics',
        },
      ];

      prisma.teacher.findMany.mockResolvedValue(mockTeachers);
      prisma.teacher.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
      expect(result.data[0].employeeId).toBe('TCH-2026-001');
      expect(result.meta.total).toBe(1);
    });

    it('should filter by specialization when provided', async () => {
      prisma.teacher.findMany.mockResolvedValue([]);
      prisma.teacher.count.mockResolvedValue(0);

      await service.findAll(tenantId, { specialization: 'Science' });

      expect(prisma.teacher.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            specialization: 'Science',
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should throw ConflictException on duplicate employeeId', async () => {
      prisma.teacher.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.create(tenantId, {
          employeeId: 'TCH-2026-001',
          firstName: 'Maria',
          lastName: 'Santos',
          email: 'msantos@school.edu',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new teacher when employeeId is unique', async () => {
      prisma.teacher.findUnique.mockResolvedValue(null);
      const newTeacher = {
        id: 'new-t-1',
        tenantId,
        employeeId: 'TCH-2026-002',
        firstName: 'Roberto',
        lastName: 'Cruz',
        email: 'rcruz@school.edu',
      };
      prisma.teacher.create.mockResolvedValue(newTeacher);

      const result = await service.create(tenantId, {
        employeeId: 'TCH-2026-002',
        firstName: 'Roberto',
        lastName: 'Cruz',
        email: 'rcruz@school.edu',
      });

      expect(prisma.teacher.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            employeeId: 'TCH-2026-002',
          }),
        }),
      );
      expect(result.id).toBe('new-t-1');
    });
  });

  describe('remove', () => {
    it('should soft-delete teacher by setting status to INACTIVE', async () => {
      prisma.teacher.findFirst.mockResolvedValue({ id: 't-1', tenantId });
      prisma.teacher.update.mockResolvedValue({
        id: 't-1',
        status: TeacherStatus.INACTIVE,
      });

      const result = await service.remove(tenantId, 't-1');

      expect(prisma.teacher.update).toHaveBeenCalledWith({
        where: { id: 't-1' },
        data: { status: TeacherStatus.INACTIVE },
      });
      expect(result.status).toBe(TeacherStatus.INACTIVE);
    });
  });
});
