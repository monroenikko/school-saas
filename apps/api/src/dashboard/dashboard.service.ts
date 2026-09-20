import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceStatus, Role, StudentStatus, TeacherStatus } from '@school-saas/shared';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(tenantId: string, role: Role) {
    // If super admin and no tenantId specified, query global totals
    const isSuperAdminGlobal = role === Role.SUPER_ADMIN && !tenantId;

    const tenantWhere = isSuperAdminGlobal ? {} : { tenantId };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalStudents,
      totalTeachers,
      totalSections,
      totalSubjects,
      todayAttendances,
      recentAttendances,
      recentTransactions,
      devicesCount,
    ] = await Promise.all([
      this.prisma.student.count({
        where: {
          ...tenantWhere,
          status: StudentStatus.ACTIVE,
        },
      }),
      this.prisma.teacher.count({
        where: {
          ...tenantWhere,
          status: TeacherStatus.ACTIVE,
        },
      }),
      this.prisma.section.count({
        where: tenantWhere,
      }),
      this.prisma.subject.count({
        where: tenantWhere,
      }),
      this.prisma.attendance.findMany({
        where: {
          ...tenantWhere,
          date: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      this.prisma.attendance.findMany({
        where: tenantWhere,
        take: 5,
        orderBy: { timeIn: 'desc' },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
              studentId: true,
            },
          },
          device: {
            select: {
              name: true,
            },
          },
        },
      }),
      this.prisma.parentTransaction.findMany({
        where: tenantWhere,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          student: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.rfidDevice.count({
        where: tenantWhere,
      }),
    ]);

    const presentCount = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE,
    ).length;

    const lateCount = todayAttendances.filter(
      (a) => a.status === AttendanceStatus.LATE,
    ).length;

    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      summary: {
        totalStudents,
        totalTeachers,
        totalSections,
        totalSubjects,
        totalDevices: devicesCount,
        attendance: {
          present: presentCount,
          late: lateCount,
          absent: Math.max(0, totalStudents - presentCount),
          rate: attendanceRate,
        },
      },
      recentAttendances: recentAttendances.map((a) => ({
        id: a.id,
        studentName: `${a.student.firstName} ${a.student.lastName}`,
        studentId: a.student.studentId,
        timeIn: a.timeIn,
        timeOut: a.timeOut,
        status: a.status,
        deviceName: a.device?.name || 'Gate Terminal',
      })),
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        referenceNo: t.referenceNo,
        title: t.title,
        amount: Number(t.amount),
        type: t.type,
        status: t.status,
        studentName: t.student ? `${t.student.firstName} ${t.student.lastName}` : 'N/A',
        paidAt: t.paidAt,
      })),
    };
  }
}
