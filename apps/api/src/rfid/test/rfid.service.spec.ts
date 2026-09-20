import { Test, TestingModule } from '@nestjs/testing';
import { RfidService } from '../rfid.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, DeviceStatus, ScanType } from '@school-saas/shared';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('RfidService', () => {
  let service: RfidService;
  let prisma: PrismaService;

  const tenantId = 'tenant-st-jude';

  const mockDevice = {
    id: 'dev-uuid-1',
    tenantId,
    deviceId: 'GATE-01',
    name: 'Main Turnstile Gate 1',
    location: 'Gate A',
    apiKeyHash: '$2a$10$abcdefghijklmnopqrstuvwxyz123456',
    status: DeviceStatus.ACTIVE,
    lastHeartbeatAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    _count: { attendances: 12 },
  };

  const mockStudent = {
    id: 'stud-uuid-1',
    tenantId,
    studentId: '2026-0001',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    rfidCardUid: 'E2000019',
    photoUrl: null,
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
  };

  const mockPrismaService = {
    tenant: {
      findFirst: jest.fn(),
    },
    rfidDevice: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    attendance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    rfidScanLog: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((promises) => Promise.all(promises)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfidService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<RfidService>(RfidService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDevice', () => {
    it('registers new RFID device and returns raw API key', async () => {
      mockPrismaService.rfidDevice.findUnique.mockResolvedValue(null);
      mockPrismaService.rfidDevice.create.mockResolvedValue(mockDevice);

      const result = await service.registerDevice(tenantId, {
        deviceId: 'GATE-01',
        name: 'Main Turnstile Gate 1',
        location: 'Gate A',
      });

      expect(result.success).toBe(true);
      expect(result.data.deviceId).toBe('GATE-01');
      expect(result.data.rawApiKey).toContain('rfid_sec_');
    });

    it('throws ConflictException if deviceId already exists', async () => {
      mockPrismaService.rfidDevice.findUnique.mockResolvedValue(mockDevice);

      await expect(
        service.registerDevice(tenantId, {
          deviceId: 'GATE-01',
          name: 'Main Turnstile Gate 1',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('listDevices', () => {
    it('returns devices with computed isOnline flag based on heartbeat', async () => {
      mockPrismaService.rfidDevice.findMany.mockResolvedValue([mockDevice]);

      const devices = await service.listDevices(tenantId);

      expect(devices).toHaveLength(1);
      expect(devices[0].deviceId).toBe('GATE-01');
      expect(devices[0].isOnline).toBe(true);
      expect(devices[0].totalTaps).toBe(12);
    });
  });

  describe('processTap', () => {
    it('throws NotFoundException if RFID card is unrecognized', async () => {
      mockPrismaService.rfidDevice.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.student.findFirst.mockResolvedValue(null);
      mockPrismaService.rfidScanLog.create.mockResolvedValue({});

      await expect(
        service.processTap(tenantId, {
          deviceId: 'GATE-01',
          cardUid: 'UNKNOWN-CARD',
        }),
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.rfidScanLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            cardUid: 'UNKNOWN-CARD',
            processed: false,
          }),
        }),
      );
    });

    it('records TIME_IN attendance on first tap of the day', async () => {
      mockPrismaService.rfidDevice.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.rfidScanLog.findFirst.mockResolvedValue(null); // No recent scan (not duplicate)
      mockPrismaService.attendance.findUnique.mockResolvedValue(null); // No attendance today

      const scanTime = new Date('2026-09-20T07:45:00.000Z');

      const result = await service.processTap(tenantId, {
        deviceId: 'GATE-01',
        cardUid: 'E2000019',
        scannedAt: scanTime.toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('TIME_IN');
      expect(result.student.fullName).toBe('Juan Dela Cruz');
      expect(result.student.sectionName).toBe('Diamond');
      expect(mockPrismaService.$transaction).toHaveBeenCalled();
    });

    it('records TIME_OUT departure if student already has a record today', async () => {
      mockPrismaService.rfidDevice.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.rfidScanLog.findFirst.mockResolvedValue(null); // Not duplicate
      mockPrismaService.attendance.findUnique.mockResolvedValue({
        id: 'att-1',
        tenantId,
        studentId: mockStudent.id,
        status: AttendanceStatus.PRESENT,
        timeIn: new Date('2026-09-20T07:45:00.000Z'),
        timeOut: null,
      });

      const departureTime = new Date('2026-09-20T16:30:00.000Z');

      const result = await service.processTap(tenantId, {
        deviceId: 'GATE-01',
        cardUid: 'E2000019',
        scannedAt: departureTime.toISOString(),
      });

      expect(result.success).toBe(true);
      expect(result.eventType).toBe('TIME_OUT');
      expect(result.message).toContain('Goodbye');
    });

    it('gracefully suppresses duplicate card tap within debounce buffer', async () => {
      mockPrismaService.rfidDevice.findFirst.mockResolvedValue(mockDevice);
      mockPrismaService.student.findFirst.mockResolvedValue(mockStudent);
      mockPrismaService.rfidScanLog.findFirst.mockResolvedValue({
        id: 'log-1',
        scanType: ScanType.TIME_IN,
        scannedAt: new Date(),
      });

      const result = await service.processTap(tenantId, {
        deviceId: 'GATE-01',
        cardUid: 'E2000019',
      });

      expect(result.success).toBe(true);
      expect(result.isDuplicate).toBe(true);
      expect(result.message).toContain('already registered recently');
    });
  });
});
