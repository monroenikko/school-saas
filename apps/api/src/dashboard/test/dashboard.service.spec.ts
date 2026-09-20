import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from '../dashboard.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, Role, StudentStatus, TeacherStatus } from '@school-saas/shared';

describe('DashboardService', () => {
  let service: DashboardService;
  let prisma: {
    student: { count: jest.Mock };
    teacher: { count: jest.Mock };
    section: { count: jest.Mock };
    subject: { count: jest.Mock };
    attendance: { findMany: jest.Mock };
    parentTransaction: { findMany: jest.Mock };
    rfidDevice: { count: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      student: { count: jest.fn() },
      teacher: { count: jest.fn() },
      section: { count: jest.fn() },
      subject: { count: jest.fn() },
      attendance: { findMany: jest.fn() },
      parentTransaction: { findMany: jest.fn() },
      rfidDevice: { count: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getStats', () => {
    it('should compute summary stats scoped strictly to tenantId', async () => {
      const tenantId = 'tenant-123';
      prisma.student.count.mockResolvedValue(100);
      prisma.teacher.count.mockResolvedValue(15);
      prisma.section.count.mockResolvedValue(6);
      prisma.subject.count.mockResolvedValue(12);
      prisma.rfidDevice.count.mockResolvedValue(2);
      prisma.attendance.findMany
        .mockResolvedValueOnce([
          { status: AttendanceStatus.PRESENT },
          { status: AttendanceStatus.LATE },
        ])
        .mockResolvedValueOnce([]);
      prisma.parentTransaction.findMany.mockResolvedValue([]);

      const result = await service.getStats(tenantId, Role.SCHOOL_ADMIN);

      expect(prisma.student.count).toHaveBeenCalledWith({
        where: {
          tenantId,
          status: StudentStatus.ACTIVE,
        },
      });
      expect(result.summary.totalStudents).toBe(100);
      expect(result.summary.totalTeachers).toBe(15);
      expect(result.summary.attendance.present).toBe(2);
      expect(result.summary.attendance.rate).toBe(2); // 2/100 = 2%
    });
  });
});
