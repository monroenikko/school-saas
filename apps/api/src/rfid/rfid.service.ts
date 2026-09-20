import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRfidDeviceDto } from './dto/create-rfid-device.dto';
import { UpdateRfidDeviceDto } from './dto/update-rfid-device.dto';
import { RfidTapEventDto } from './dto/rfid-tap-event.dto';
import { AttendanceStatus, DeviceStatus, ScanType } from '@school-saas/shared';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class RfidService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DEVICE MANAGEMENT
  // ==========================================

  async registerDevice(tenantId: string, dto: CreateRfidDeviceDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new ConflictException('No active school tenant found.');
    }

    const existing = await this.prisma.rfidDevice.findUnique({
      where: {
        tenantId_deviceId: {
          tenantId: resolvedTenantId,
          deviceId: dto.deviceId.toUpperCase().trim(),
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Device with ID "${dto.deviceId}" already exists for this school.`,
      );
    }

    // Generate cryptographic raw API key
    const rawApiKey = `rfid_sec_${crypto.randomBytes(24).toString('hex')}`;
    const apiKeyHash = await bcrypt.hash(rawApiKey, 10);

    const device = await this.prisma.rfidDevice.create({
      data: {
        tenantId: resolvedTenantId,
        deviceId: dto.deviceId.toUpperCase().trim(),
        name: dto.name.trim(),
        location: dto.location?.trim() || null,
        apiKeyHash,
        status: DeviceStatus.ACTIVE,
      },
    });

    return {
      success: true,
      data: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
        location: device.location,
        status: device.status,
        createdAt: device.createdAt,
        // Show raw API key once to the administrator
        rawApiKey,
      },
      message: 'RFID Turnstile Gate successfully registered. Please save the API Key securely.',
    };
  }

  async listDevices(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const devices = await this.prisma.rfidDevice.findMany({
      where: tenantWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { attendances: true },
        },
      },
    });

    const now = Date.now();
    const HEARTBEAT_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes

    const devicesWithStatus = devices.map((d) => {
      const isOnline =
        d.lastHeartbeatAt !== null &&
        now - new Date(d.lastHeartbeatAt).getTime() < HEARTBEAT_THRESHOLD_MS;

      return {
        id: d.id,
        deviceId: d.deviceId,
        name: d.name,
        location: d.location,
        status: d.status,
        isOnline,
        lastHeartbeatAt: d.lastHeartbeatAt,
        totalTaps: d._count.attendances,
        createdAt: d.createdAt,
      };
    });

    return devicesWithStatus;
  }

  async updateDevice(tenantId: string, id: string, dto: UpdateRfidDeviceDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const device = await this.prisma.rfidDevice.findFirst({
      where: { id, ...tenantWhere },
    });

    if (!device) {
      throw new NotFoundException(`RFID Device with ID "${id}" not found`);
    }

    const updated = await this.prisma.rfidDevice.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.location !== undefined ? { location: dto.location?.trim() || null } : {}),
        ...(dto.status ? { status: dto.status } : {}),
      },
    });

    return updated;
  }

  async recordHeartbeat(deviceId: string, apiKey?: string) {
    const device = await this.prisma.rfidDevice.findFirst({
      where: { deviceId },
    });

    if (!device) {
      throw new NotFoundException(`RFID Device "${deviceId}" not found`);
    }

    if (apiKey) {
      const isValid = await bcrypt.compare(apiKey, device.apiKeyHash);
      if (!isValid) {
        throw new UnauthorizedException('Invalid RFID device API key');
      }
    }

    const updated = await this.prisma.rfidDevice.update({
      where: { id: device.id },
      data: { lastHeartbeatAt: new Date() },
    });

    return {
      success: true,
      deviceId: updated.deviceId,
      lastHeartbeatAt: updated.lastHeartbeatAt,
    };
  }

  // ==========================================
  // REAL-TIME TAP EVENT PIPELINE
  // ==========================================

  async processTap(tenantId: string, dto: RfidTapEventDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    // 1. Resolve Device
    const device = await this.prisma.rfidDevice.findFirst({
      where: {
        deviceId: dto.deviceId.toUpperCase().trim(),
        ...tenantWhere,
      },
    });

    if (!device) {
      throw new NotFoundException(`Gate device "${dto.deviceId}" not found`);
    }

    if (device.status !== DeviceStatus.ACTIVE) {
      throw new BadRequestException(
        `Gate device "${device.deviceId}" is currently ${device.status}. Taps cannot be processed.`,
      );
    }

    const effectiveTenantId = tenantId || device.tenantId;
    const scanDate = dto.scannedAt ? new Date(dto.scannedAt) : new Date();

    // 2. Resolve Student by Card UID
    const student = await this.prisma.student.findFirst({
      where: {
        tenantId: effectiveTenantId,
        rfidCardUid: dto.cardUid.toUpperCase().trim(),
      },
      include: {
        sectionStudents: {
          where: { status: 'ACTIVE' },
          include: { section: true },
        },
      },
    });

    if (!student) {
      // Log failed scan attempt
      await this.prisma.rfidScanLog.create({
        data: {
          tenantId: effectiveTenantId,
          cardUid: dto.cardUid.toUpperCase().trim(),
          deviceId: device.deviceId,
          scanType: dto.scanType || ScanType.TIME_IN,
          scannedAt: scanDate,
          processed: false,
          errorMessage: 'Unrecognized RFID Card UID. No active student linked.',
        },
      });

      throw new NotFoundException(
        `Unrecognized RFID Card UID "${dto.cardUid}". Please assign this card in the Students Directory.`,
      );
    }

    // 3. Duplicate Tap Debouncing (45 seconds buffer)
    const recentScan = await this.prisma.rfidScanLog.findFirst({
      where: {
        tenantId: effectiveTenantId,
        cardUid: student.rfidCardUid || dto.cardUid,
        scannedAt: {
          gte: new Date(scanDate.getTime() - 45 * 1000),
        },
      },
      orderBy: { scannedAt: 'desc' },
    });

    const studentFullName = `${student.firstName} ${student.lastName}`;
    const sectionName = student.sectionStudents[0]?.section?.name || 'Unassigned';
    const gradeLevel = student.sectionStudents[0]?.section?.gradeLevel || 'N/A';

    if (recentScan) {
      return {
        success: true,
        isDuplicate: true,
        eventType: recentScan.scanType === ScanType.TIME_IN ? 'TIME_IN' : 'TIME_OUT',
        status: AttendanceStatus.PRESENT,
        time: scanDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        student: {
          id: student.id,
          studentId: student.studentId,
          fullName: studentFullName,
          photoUrl: (student as any).photoUrl || null,
          gradeLevel,
          sectionName,
        },
        device: {
          id: device.id,
          deviceId: device.deviceId,
          name: device.name,
        },
        message: `Card tap already registered recently. Please proceed, ${student.firstName}!`,
      };
    }

    // 4. Determine Date & Morning Cutoff (8:00 AM)
    const attendanceDate = new Date(scanDate);
    attendanceDate.setHours(0, 0, 0, 0);

    const existingAttendance = await this.prisma.attendance.findUnique({
      where: {
        tenantId_studentId_date: {
          tenantId: effectiveTenantId,
          studentId: student.id,
          date: attendanceDate,
        },
      },
    });

    let eventType: 'TIME_IN' | 'TIME_OUT' = 'TIME_IN';
    let attendanceStatus: AttendanceStatus = AttendanceStatus.PRESENT;

    // Evaluate DepEd Late arrival rule: after 8:00 AM local time
    const scanHours = scanDate.getHours();
    const scanMinutes = scanDate.getMinutes();
    const isLate = scanHours > 8 || (scanHours === 8 && scanMinutes > 0);

    if (!existingAttendance) {
      // First tap of the day -> TIME_IN
      eventType = 'TIME_IN';
      attendanceStatus = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      await this.prisma.$transaction([
        this.prisma.attendance.create({
          data: {
            tenantId: effectiveTenantId,
            studentId: student.id,
            deviceId: device.id,
            date: attendanceDate,
            timeIn: scanDate,
            status: attendanceStatus,
            remarks: isLate ? 'Late arrival (Gate turnstile tap)' : 'On-time arrival',
          },
        }),
        this.prisma.rfidScanLog.create({
          data: {
            tenantId: effectiveTenantId,
            cardUid: dto.cardUid.toUpperCase().trim(),
            deviceId: device.deviceId,
            scanType: ScanType.TIME_IN,
            scannedAt: scanDate,
            processed: true,
          },
        }),
      ]);
    } else {
      // Already has a record today -> TIME_OUT (Exit)
      eventType = 'TIME_OUT';
      attendanceStatus = existingAttendance.status as any as AttendanceStatus;

      await this.prisma.$transaction([
        this.prisma.attendance.update({
          where: { id: existingAttendance.id },
          data: {
            timeOut: scanDate,
            deviceId: device.id,
          },
        }),
        this.prisma.rfidScanLog.create({
          data: {
            tenantId: effectiveTenantId,
            cardUid: dto.cardUid.toUpperCase().trim(),
            deviceId: device.deviceId,
            scanType: ScanType.TIME_OUT,
            scannedAt: scanDate,
            processed: true,
          },
        }),
      ]);
    }

    const formattedTime = scanDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const greetingMessage =
      eventType === 'TIME_IN'
        ? `Welcome to campus, ${student.firstName}! (${attendanceStatus === AttendanceStatus.LATE ? 'Late Entry' : 'On-Time'})`
        : `Goodbye, ${student.firstName}! Have a safe trip home. (Time-Out)`;

    return {
      success: true,
      isDuplicate: false,
      eventType,
      status: attendanceStatus,
      time: formattedTime,
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: studentFullName,
        photoUrl: (student as any).photoUrl || null,
        gradeLevel,
        sectionName,
      },
      device: {
        id: device.id,
        deviceId: device.deviceId,
        name: device.name,
      },
      message: greetingMessage,
    };
  }
}
