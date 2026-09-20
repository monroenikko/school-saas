import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from '../students.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { StudentStatus, Gender } from '@school-saas/shared';

describe('StudentsService', () => {
  let service: StudentsService;
  let prisma: {
    student: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    section: {
      findUnique: jest.Mock;
    };
    sectionStudent: {
      create: jest.Mock;
      updateMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const tenantId = 'tenant-school-1';

  beforeEach(async () => {
    prisma = {
      student: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      section: {
        findUnique: jest.fn().mockResolvedValue({ id: 'sec-1', academicYearId: 'ay-1' }),
      },
      sectionStudent: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should query students strictly scoped to tenantId', async () => {
      const mockStudents = [
        {
          id: 's-1',
          tenantId,
          studentId: '2026-0001',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          sectionStudents: [
            {
              section: {
                id: 'sec-1',
                name: 'Grade 7 - Rizal',
                gradeLevel: 7,
              },
            },
          ],
        },
      ];

      prisma.student.findMany.mockResolvedValue(mockStudents);
      prisma.student.count.mockResolvedValue(1);

      const result = await service.findAll(tenantId, { page: 1, limit: 10 });

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
      expect(result.data[0].firstName).toBe('Juan');
      expect(result.data[0].currentSection?.name).toBe('Grade 7 - Rizal');
      expect(result.meta.total).toBe(1);
    });

    it('should apply search filters for student ID and names', async () => {
      prisma.student.findMany.mockResolvedValue([]);
      prisma.student.count.mockResolvedValue(0);

      await service.findAll(tenantId, { search: 'Dela Cruz' });

      expect(prisma.student.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId,
            OR: expect.arrayContaining([
              { lastName: { contains: 'Dela Cruz', mode: 'insensitive' } },
            ]),
          }),
        }),
      );
    });
  });

  describe('create', () => {
    it('should prevent duplicate studentId within the same school tenant', async () => {
      prisma.student.findUnique.mockResolvedValueOnce({ id: 'existing-id' });

      await expect(
        service.create(tenantId, {
          studentId: '2026-0001',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new student and link section in a transaction', async () => {
      prisma.student.findUnique.mockResolvedValue(null);
      const createdStudent = {
        id: 'new-id',
        tenantId,
        studentId: '2026-0002',
        firstName: 'Maria',
        lastName: 'Clara',
      };
      prisma.student.create.mockResolvedValue(createdStudent);

      const result = await service.create(tenantId, {
        studentId: '2026-0002',
        firstName: 'Maria',
        lastName: 'Clara',
        sectionId: 'sec-1',
      });

      expect(prisma.student.create).toHaveBeenCalled();
      expect(prisma.sectionStudent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            studentId: 'new-id',
            sectionId: 'sec-1',
          }),
        }),
      );
      expect(result.id).toBe('new-id');
    });
  });

  describe('assignRfid', () => {
    it('should assign RFID badge UID when available', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1', tenantId });
      prisma.student.findUnique.mockResolvedValue(null); // not taken
      prisma.student.update.mockResolvedValue({
        id: 's-1',
        rfidCardUid: 'RFID-12345',
      });

      const result = await service.assignRfid(tenantId, 's-1', 'RFID-12345');

      expect(prisma.student.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { rfidCardUid: 'RFID-12345' },
      });
      expect(result.rfidCardUid).toBe('RFID-12345');
    });

    it('should throw ConflictException if RFID badge is already assigned', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: 's-1', tenantId });
      prisma.student.findUnique.mockResolvedValue({
        id: 'other-student',
        firstName: 'Pedro',
        lastName: 'Penduko',
      });

      await expect(
        service.assignRfid(tenantId, 's-1', 'RFID-12345'),
      ).rejects.toThrow(ConflictException);
    });
  });
});
