import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from '../grades.service';
import { PrismaService } from '../../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GradingPeriod, EnrollmentStatus } from '@school-saas/shared';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: {
    subjectClass: {
      findFirst: jest.Mock;
    };
    subjectEnrollment: {
      upsert: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    sectionStudent: {
      findMany: jest.Mock;
    };
    grade: {
      upsert: jest.Mock;
      updateMany: jest.Mock;
      count: jest.Mock;
    };
    student: {
      findFirst: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  const tenantId = 'tenant-school-1';
  const classId = 'class-math-7';

  beforeEach(async () => {
    prisma = {
      subjectClass: {
        findFirst: jest.fn(),
      },
      subjectEnrollment: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      sectionStudent: {
        findMany: jest.fn(),
      },
      grade: {
        upsert: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      student: {
        findFirst: jest.fn(),
      },
      $transaction: jest.fn((cbOrArray) => {
        if (Array.isArray(cbOrArray)) {
          return Promise.resolve(cbOrArray);
        }
        return cbOrArray(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('enrollStudents', () => {
    it('should enroll individual students into a class offering', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });

      const result = await service.enrollStudents(tenantId, classId, {
        studentIds: ['s-1', 's-2'],
      });

      expect(prisma.subjectClass.findFirst).toHaveBeenCalledWith({
        where: { id: classId, tenantId },
        include: { section: true },
      });
      expect(prisma.subjectEnrollment.upsert).toHaveBeenCalledTimes(2);
      expect(result.enrolledCount).toBe(2);
    });

    it('should enroll entire section when sectionId is provided', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });
      prisma.sectionStudent.findMany.mockResolvedValueOnce([
        { studentId: 'sec-s-1' },
        { studentId: 'sec-s-2' },
        { studentId: 'sec-s-3' },
      ]);

      const result = await service.enrollStudents(tenantId, classId, {
        sectionId: 'sec-diamond',
      });

      expect(prisma.sectionStudent.findMany).toHaveBeenCalledWith({
        where: { tenantId, sectionId: 'sec-diamond', status: 'ACTIVE' },
        select: { studentId: true },
      });
      expect(prisma.subjectEnrollment.upsert).toHaveBeenCalledTimes(3);
      expect(result.enrolledCount).toBe(3);
    });

    it('should throw BadRequestException if no learners specified or found', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });

      await expect(
        service.enrollStudents(tenantId, classId, { studentIds: [] }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('saveBatchGrades', () => {
    it('should auto-compute PASSED remarks for DepEd score >= 75.0', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });
      prisma.subjectEnrollment.findUnique.mockResolvedValueOnce({
        id: 'enr-1',
      });
      prisma.grade.upsert.mockResolvedValueOnce({
        id: 'g-1',
        score: 88,
        remarks: 'PASSED',
      });

      const result = await service.saveBatchGrades(tenantId, classId, 'user-teacher-1', {
        period: GradingPeriod.Q1,
        grades: [{ studentId: 's-1', score: 88 }],
      });

      expect(prisma.grade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            score: 88,
            remarks: 'PASSED',
          }),
        }),
      );
      expect(result.savedCount).toBe(1);
    });

    it('should auto-compute FAILED remarks for DepEd score < 75.0', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });
      prisma.subjectEnrollment.findUnique.mockResolvedValueOnce({
        id: 'enr-2',
      });
      prisma.grade.upsert.mockResolvedValueOnce({
        id: 'g-2',
        score: 72,
        remarks: 'FAILED',
      });

      await service.saveBatchGrades(tenantId, classId, 'user-teacher-1', {
        period: GradingPeriod.Q1,
        grades: [{ studentId: 's-2', score: 72 }],
      });

      expect(prisma.grade.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            score: 72,
            remarks: 'FAILED',
          }),
        }),
      );
    });
  });

  describe('getClassGradesMatrix', () => {
    it('should format grade rows and compute quarterly averages', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        subject: { name: 'Mathematics 7', credits: 3.0 },
      });
      prisma.subjectEnrollment.findMany.mockResolvedValueOnce([
        {
          id: 'enr-1',
          status: EnrollmentStatus.ENROLLED,
          student: { id: 's-1', studentId: '2026-001', firstName: 'Juan', lastName: 'Dela Cruz' },
          grades: [
            { period: GradingPeriod.Q1, score: 85, isPublished: true },
            { period: GradingPeriod.Q2, score: 95, isPublished: true },
          ],
        },
      ]);

      const result = await service.getClassGradesMatrix(tenantId, classId);

      expect(result.students[0].finalAverage).toBe(90.0);
      expect(result.students[0].remarks).toBe('PASSED');
      expect(result.classAverage).toBe(90.0);
    });
  });

  describe('publishGrades', () => {
    it('should mark grades as published for target period', async () => {
      prisma.subjectClass.findFirst.mockResolvedValueOnce({
        id: classId,
        tenantId,
      });
      prisma.grade.updateMany.mockResolvedValueOnce({ count: 25 });

      const result = await service.publishGrades(tenantId, classId, GradingPeriod.Q1);

      expect(prisma.grade.updateMany).toHaveBeenCalledWith({
        where: { tenantId, subjectClassId: classId, period: GradingPeriod.Q1 },
        data: { isPublished: true },
      });
      expect(result.publishedCount).toBe(25);
    });
  });
});
