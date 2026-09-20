import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { ManualAttendanceDto } from './dto/manual-attendance.dto';
import { AttendanceStatus, StudentStatus } from '@school-saas/shared';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // DAILY ATTENDANCE RECORDS (PAGINATED & FILTERED)
  // ==========================================

  async getDailyAttendance(tenantId: string, query: QueryAttendanceDto) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const targetDate = query.date ? new Date(query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      ...tenantWhere,
      date: targetDate,
      ...(query.status ? { status: query.status } : {}),
      ...(query.sectionId
        ? {
            student: {
              sectionStudents: {
                some: {
                  sectionId: query.sectionId,
                  status: 'ACTIVE',
                },
              },
            },
          }
        : {}),
      ...(query.search
        ? {
            student: {
              OR: [
                { firstName: { contains: query.search, mode: 'insensitive' } },
                { lastName: { contains: query.search, mode: 'insensitive' } },
                { studentId: { contains: query.search, mode: 'insensitive' } },
                { rfidCardUid: { contains: query.search, mode: 'insensitive' } },
              ],
            },
          }
        : {}),
    };

    const [total, records]: [number, any[]] = await Promise.all([
      this.prisma.attendance.count({ where }),
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ timeIn: 'desc' }, { createdAt: 'desc' }],
        include: {
          student: {
            select: {
              id: true,
              studentId: true,
              firstName: true,
              lastName: true,
              middleName: true,
              gender: true,
              rfidCardUid: true,
              sectionStudents: {
                where: { status: 'ACTIVE' },
                select: {
                  section: {
                    select: {
                      id: true,
                      name: true,
                      gradeLevel: true,
                    },
                  },
                },
              },
            },
          },
          device: {
            select: {
              id: true,
              deviceId: true,
              name: true,
              location: true,
            },
          },
        },
      }),
    ]);

    const formattedRecords = records.map((record: any) => {
      const activeSection = record.student?.sectionStudents?.[0]?.section;
      return {
        id: record.id,
        date: record.date,
        timeIn: record.timeIn,
        timeOut: record.timeOut,
        status: record.status,
        remarks: record.remarks,
        student: record.student
          ? {
              id: record.student.id,
              studentId: record.student.studentId,
              fullName: `${record.student.lastName}, ${record.student.firstName}${
                record.student.middleName ? ` ${record.student.middleName[0]}.` : ''
              }`,
              photoUrl: (record.student as any).photoUrl || null,
              rfidCardUid: record.student.rfidCardUid,
              sectionName: activeSection?.name || 'Unassigned',
              gradeLevel: activeSection?.gradeLevel || 'N/A',
            }
          : null,
        device: record.device
          ? {
              id: record.device.id,
              deviceId: record.device.deviceId,
              name: record.device.name,
              location: record.device.location,
            }
          : null,
      };
    });

    return {
      data: formattedRecords,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        queryDate: targetDate.toISOString().split('T')[0],
      },
    };
  }

  // ==========================================
  // SUMMARY STATISTICS (HEADCOUNTS & RATE %)
  // ==========================================

  async getAttendanceStats(tenantId: string, dateStr?: string) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const targetDate = dateStr ? new Date(dateStr) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const [totalEnrolled, todayRecords] = await Promise.all([
      this.prisma.student.count({
        where: {
          ...tenantWhere,
          status: StudentStatus.ACTIVE,
        },
      }),
      this.prisma.attendance.findMany({
        where: {
          ...tenantWhere,
          date: targetDate,
        },
        select: {
          status: true,
          timeIn: true,
          timeOut: true,
        },
      }),
    ]);

    const presentCount = todayRecords.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = todayRecords.filter((r) => r.status === AttendanceStatus.LATE).length;
    const excusedCount = todayRecords.filter((r) => r.status === AttendanceStatus.EXCUSED).length;

    const totalTappedIn = presentCount + lateCount;
    const notTappedCount = Math.max(0, totalEnrolled - totalTappedIn - excusedCount);

    const attendanceRate =
      totalEnrolled > 0
        ? Number(((totalTappedIn / totalEnrolled) * 100).toFixed(1))
        : 0;

    return {
      date: targetDate.toISOString().split('T')[0],
      totalEnrolled,
      presentCount,
      lateCount,
      excusedCount,
      totalTappedIn,
      notTappedCount,
      attendanceRate,
    };
  }

  // ==========================================
  // RECENT TAPS (LIVE GATE TURNSTILE FEED)
  // ==========================================

  async getRecentTaps(tenantId: string, limit = 15) {
    const tenantWhere = tenantId ? { tenantId } : {};

    const logs = await this.prisma.rfidScanLog.findMany({
      where: tenantWhere,
      orderBy: { scannedAt: 'desc' },
      take: limit,
    });

    // Resolve student cards in bulk
    const cardUids = Array.from(new Set(logs.map((l) => l.cardUid)));
    const students = await this.prisma.student.findMany({
      where: {
        ...tenantWhere,
        rfidCardUid: { in: cardUids },
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        rfidCardUid: true,
        sectionStudents: {
          where: { status: 'ACTIVE' },
          select: { section: true },
        },
      },
    });

    const studentMap = new Map(students.map((s) => [s.rfidCardUid, s]));

    return logs.map((log) => {
      const student = studentMap.get(log.cardUid);
      return {
        id: log.id,
        cardUid: log.cardUid,
        deviceId: log.deviceId,
        scanType: log.scanType,
        scannedAt: log.scannedAt,
        processed: log.processed,
        errorMessage: log.errorMessage,
        student: student
          ? {
              id: student.id,
              studentId: student.studentId,
              fullName: `${student.firstName} ${student.lastName}`,
              photoUrl: (student as any).photoUrl || null,
              sectionName: student.sectionStudents[0]?.section?.name || 'Unassigned',
              gradeLevel: student.sectionStudents[0]?.section?.gradeLevel || 'N/A',
            }
          : null,
      };
    });
  }

  // ==========================================
  // MANUAL ATTENDANCE OVERRIDE
  // ==========================================

  async recordManualAttendance(tenantId: string, dto: ManualAttendanceDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new BadRequestException('No active school tenant found.');
    }

    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId: resolvedTenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${dto.studentId}" not found`);
    }

    const attendanceDate = new Date(dto.date);
    attendanceDate.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendance.upsert({
      where: {
        tenantId_studentId_date: {
          tenantId: resolvedTenantId,
          studentId: dto.studentId,
          date: attendanceDate,
        },
      },
      update: {
        status: dto.status,
        timeIn: dto.timeIn ? new Date(dto.timeIn) : undefined,
        timeOut: dto.timeOut ? new Date(dto.timeOut) : undefined,
        remarks: dto.remarks?.trim() || null,
      },
      create: {
        tenantId: resolvedTenantId,
        studentId: dto.studentId,
        date: attendanceDate,
        status: dto.status,
        timeIn: dto.timeIn ? new Date(dto.timeIn) : new Date(),
        timeOut: dto.timeOut ? new Date(dto.timeOut) : null,
        remarks: dto.remarks?.trim() || 'Manual adjustment',
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      data: record,
      message: `Attendance record successfully saved for ${record.student.firstName} ${record.student.lastName}.`,
    };
  }
}
