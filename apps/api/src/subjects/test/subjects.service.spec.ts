import { Test, TestingModule } from '@nestjs/testing';
import { SubjectsService } from '../subjects.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DayOfWeek } from '@school-saas/shared';

describe('SubjectsService', () => {
  let service: SubjectsService;
  let prisma: {
    subject: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    subjectClass: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      count: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    subjectClassTerm: {
      createMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    classSchedule: {
      createMany: jest.Mock;
      deleteMany: jest.Mock;
    };
    academicYear: {
      findFirst: jest.Mock;
    };
    term: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const tenantId = 'tenant-school-1';

  beforeEach(async () => {
    prisma = {
      subject: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subjectClass: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subjectClassTerm: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      classSchedule: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      academicYear: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ay-2026', isCurrent: true }),
      },
      term: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubjectsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubjectsService>(SubjectsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSubject', () => {
    it('should create a master subject successfully', async () => {
      prisma.subject.findUnique.mockResolvedValueOnce(null);
      prisma.subject.create.mockResolvedValueOnce({
        id: 'sub-1',
        tenantId,
        code: 'MATH7',
        name: 'General Mathematics 7',
        credits: 3.0,
      });

      const result = await service.createSubject(tenantId, {
        code: 'math7',
        name: 'General Mathematics 7',
        credits: 3.0,
      });

      expect(prisma.subject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId,
            code: 'MATH7',
            name: 'General Mathematics 7',
          }),
        }),
      );
      expect(result.code).toBe('MATH7');
    });

    it('should throw ConflictException on duplicate code within tenant', async () => {
      prisma.subject.findUnique.mockResolvedValueOnce({ id: 'existing' });

      await expect(
        service.createSubject(tenantId, {
          code: 'MATH7',
          name: 'General Mathematics 7',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('createClass', () => {
    it('should create a class offering with multiple select terms and dynamic schedule slots', async () => {
      prisma.subject.findFirst.mockResolvedValueOnce({
        id: 'sub-1',
        name: 'General Mathematics 7',
      });
      prisma.subjectClass.findUnique.mockResolvedValueOnce(null);
      prisma.term.findMany.mockResolvedValueOnce([
        { id: 'term-1', name: '1st Semester' },
        { id: 'term-2', name: '2nd Semester' },
      ]);
      prisma.subjectClass.create.mockResolvedValueOnce({
        id: 'class-1',
        tenantId,
        classCode: 'MATH7-SEC-A',
      });

      // Mock findOneClass returned value after creation
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: 'class-1',
        tenantId,
        classCode: 'MATH7-SEC-A',
        subject: { id: 'sub-1', name: 'Math 7', credits: 3.0 },
        terms: [
          { term: { id: 'term-1', name: '1st Semester' } },
          { term: { id: 'term-2', name: '2nd Semester' } },
        ],
        schedules: [
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '09:30' },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '09:30' },
        ],
        _count: { enrollments: 0 },
      });

      const result = await service.createClass(tenantId, {
        subjectId: 'sub-1',
        classCode: 'MATH7-SEC-A',
        teacherId: 'teacher-1',
        sectionId: 'sec-1',
        termIds: ['term-1', 'term-2'],
        schedules: [
          { dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00', endTime: '09:30' },
          { dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00', endTime: '09:30' },
        ],
      });

      expect(prisma.subjectClass.create).toHaveBeenCalled();
      expect(prisma.subjectClassTerm.createMany).toHaveBeenCalledWith({
        data: [
          { tenantId, subjectClassId: 'class-1', termId: 'term-1' },
          { tenantId, subjectClassId: 'class-1', termId: 'term-2' },
        ],
      });
      expect(prisma.classSchedule.createMany).toHaveBeenCalledWith({
        data: [
          expect.objectContaining({ dayOfWeek: DayOfWeek.MONDAY, startTime: '08:00' }),
          expect.objectContaining({ dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '08:00' }),
        ],
      });
      expect(result.termsList).toHaveLength(2);
    });

    it('should throw NotFoundException if subject does not exist', async () => {
      prisma.subject.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createClass(tenantId, {
          subjectId: 'non-existent',
          classCode: 'TEST-1',
          termIds: ['term-1'],
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAllClasses', () => {
    it('should return paginated classes scoped to tenantId', async () => {
      const mockClasses = [
        {
          id: 'class-1',
          classCode: 'MATH7-A',
          subject: { name: 'Math', credits: 3.0 },
          terms: [{ term: { name: '1st Semester' } }],
          schedules: [],
          _count: { enrollments: 25 },
        },
      ];

      prisma.subjectClass.findMany.mockResolvedValue(mockClasses);
      prisma.subjectClass.count.mockResolvedValue(1);

      const result = await service.findAllClasses(tenantId, { page: 1, limit: 10 });

      expect(prisma.subjectClass.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId }),
        }),
      );
      expect(result.data[0].enrolledCount).toBe(25);
    });
  });
});
