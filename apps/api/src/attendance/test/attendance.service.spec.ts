import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from '../attendance.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, ScanType } from '@school-saas/shared';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: PrismaService;

  const tenantId = 'tenant-st-jude';

  const mockAttendanceRecord = {
    id: 'att-1',
    tenantId,
    studentId: 'stud-1',
    deviceId: 'dev-1',
    date: new Date('2026-09-20T00:00:00.000Z'),
    timeIn: new Date('2026-09-20T07:45:00.000Z'),
    timeOut: new Date('2026-09-20T16:30:00.000Z'),
    status: AttendanceStatus.PRESENT,
    remarks: 'On-time arrival',
    student: {
      id: 'stud-1',
      studentId: '2026-0001',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      middleName: 'Santos',
      gender: 'MALE',
      photoUrl: null,
      rfidCardUid: 'E2000019',
      sectionStudents: [
        {
          status: 'ACTIVE',
          section: {
            id: 'sec-1',
            name: 'Diamond',
            gradeLevel: 'Grade 7',
          },
        },
      ],
    },
    device: {
      id: 'dev-1',
      deviceId: 'GATE-01',
      name: 'Main Turnstile Gate 1',
      location: 'Gate A',
    },
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    student: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    attendance: {
      count: jest.fn(),
      findMany: jest.fn(),
      upsert: jest.fn(),
    },
    rfidScanLog: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDailyAttendance', () => {
    it('returns paginated attendance records with student profile and section', async () => {
      mockPrismaService.attendance.count.mockResolvedValue(1);
      mockPrismaService.attendance.findMany.mockResolvedValue([mockAttendanceRecord]);

      const result = await service.getDailyAttendance(tenantId, {
        date: '2026-09-20',
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].student?.fullName).toBe('Dela Cruz, Juan S.');
      expect(result.data[0].student?.sectionName).toBe('Diamond');
      expect(result.data[0].device?.deviceId).toBe('GATE-01');
      expect(result.meta.total).toBe(1);
    });
  });

  describe('getAttendanceStats', () => {
    it('computes attendance rate, present count, and late counts correctly', async () => {
      mockPrismaService.student.count.mockResolvedValue(100);
      mockPrismaService.attendance.findMany.mockResolvedValue([
        { status: AttendanceStatus.PRESENT, timeIn: new Date(), timeOut: null },
        { status: AttendanceStatus.PRESENT, timeIn: new Date(), timeOut: null },
        { status: AttendanceStatus.LATE, timeIn: new Date(), timeOut: null },
        { status: AttendanceStatus.EXCUSED, timeIn: null, timeOut: null },
      ]);

      const stats = await service.getAttendanceStats(tenantId, '2026-09-20');

      expect(stats.totalEnrolled).toBe(100);
      expect(stats.presentCount).toBe(2);
      expect(stats.lateCount).toBe(1);
      expect(stats.excusedCount).toBe(1);
      expect(stats.totalTappedIn).toBe(3);
      expect(stats.notTappedCount).toBe(96); // 100 - 3 - 1
      expect(stats.attendanceRate).toBe(3.0); // (3/100)*100
    });
  });

  describe('getRecentTaps', () => {
    it('returns recent scan logs linked to students', async () => {
      mockPrismaService.rfidScanLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          cardUid: 'E2000019',
          deviceId: 'GATE-01',
          scanType: ScanType.TIME_IN,
          scannedAt: new Date(),
          processed: true,
          errorMessage: null,
        },
      ]);
      mockPrismaService.student.findMany.mockResolvedValue([
        {
          id: 'stud-1',
          studentId: '2026-0001',
          firstName: 'Juan',
          lastName: 'Dela Cruz',
          photoUrl: null,
          rfidCardUid: 'E2000019',
          sectionStudents: [
            {
              status: 'ACTIVE',
              section: { name: 'Diamond', gradeLevel: 'Grade 7' },
            },
          ],
        },
      ]);

      const taps = await service.getRecentTaps(tenantId, 10);

      expect(taps).toHaveLength(1);
      expect(taps[0].cardUid).toBe('E2000019');
      expect(taps[0].student?.fullName).toBe('Juan Dela Cruz');
      expect(taps[0].student?.sectionName).toBe('Diamond');
    });
  });

  describe('recordManualAttendance', () => {
    it('upserts manual attendance record with status and custom remarks', async () => {
      mockPrismaService.student.findFirst.mockResolvedValue({
        id: 'stud-1',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
      });
      mockPrismaService.attendance.upsert.mockResolvedValue({
        id: 'att-manual-1',
        status: AttendanceStatus.EXCUSED,
        remarks: 'Medical leave',
        student: { id: 'stud-1', firstName: 'Juan', lastName: 'Dela Cruz' },
      });

      const result = await service.recordManualAttendance(tenantId, {
        studentId: 'stud-1',
        date: '2026-09-20',
        status: AttendanceStatus.EXCUSED,
        remarks: 'Medical leave',
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe(AttendanceStatus.EXCUSED);
      expect(result.message).toContain('Juan Dela Cruz');
    });
  });
});
