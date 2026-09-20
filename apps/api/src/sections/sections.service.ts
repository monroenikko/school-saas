import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { QuerySectionDto } from './dto/query-section.dto';

@Injectable()
export class SectionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QuerySectionDto) {
    const {
      page = 1,
      limit = 20,
      search,
      gradeLevel,
      academicYearId,
      sortBy = 'gradeLevel',
      sortOrder = 'asc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
      ...(academicYearId ? { academicYearId } : {}),
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { gradeLevel: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [sections, total] = await Promise.all([
      this.prisma.section.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          adviser: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              employeeId: true,
            },
          },
          _count: {
            select: {
              students: {
                where: { status: 'ACTIVE' },
              },
              subjectClasses: true,
            },
          },
        },
      }),
      this.prisma.section.count({ where }),
    ]);

    const formattedData = sections.map((s) => ({
      ...s,
      studentCount: s._count.students,
      classCount: s._count.subjectClasses,
    }));

    return {
      data: formattedData,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        adviser: true,
        academicYear: true,
        students: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
                gender: true,
                rfidCardUid: true,
                status: true,
                guardianName: true,
                guardianPhone: true,
              },
            },
          },
        },
        subjectClasses: {
          include: {
            subject: true,
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                employeeId: true,
              },
            },
            schedules: true,
            terms: {
              include: {
                term: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    return {
      ...section,
      enrolledStudents: section.students.map((ss) => ss.student),
    };
  }

  async create(tenantId: string, dto: CreateSectionDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new ConflictException('No active school tenant found.');
    }

    let academicYearId = dto.academicYearId;

    if (!academicYearId) {
      const currentYear = await this.prisma.academicYear.findFirst({
        where: { tenantId: resolvedTenantId, isCurrent: true },
      });
      if (!currentYear) {
        const anyYear = await this.prisma.academicYear.findFirst({
          where: { tenantId: resolvedTenantId },
          orderBy: { createdAt: 'desc' },
        });
        academicYearId = anyYear?.id;
      } else {
        academicYearId = currentYear.id;
      }
    }

    if (!academicYearId) {
      throw new ConflictException(
        'No active academic year found. Please configure an academic year first.',
      );
    }

    // Check duplicate section name + grade level within academic year
    const existing = await this.prisma.section.findUnique({
      where: {
        tenantId_academicYearId_name_gradeLevel: {
          tenantId: resolvedTenantId,
          academicYearId,
          name: dto.name,
          gradeLevel: dto.gradeLevel,
        },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Section "${dto.name}" for ${dto.gradeLevel} already exists in this academic year`,
      );
    }

    return this.prisma.section.create({
      data: {
        tenantId: resolvedTenantId,
        academicYearId,
        name: dto.name,
        gradeLevel: dto.gradeLevel,
        room: dto.room,
        adviserId: dto.adviserId,
        termId: dto.termId,
      },
      include: {
        adviser: true,
      },
    });
  }

  async update(tenantId: string, id: string, dto: UpdateSectionDto) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    return this.prisma.section.update({
      where: { id },
      data: dto,
      include: {
        adviser: true,
      },
    });
  }

  async assignStudents(tenantId: string, sectionId: string, studentIds: string[]) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, tenantId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${sectionId}" not found`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Deactivate old active section enrollment for these students
      await tx.sectionStudent.updateMany({
        where: {
          tenantId,
          studentId: { in: studentIds },
          status: 'ACTIVE',
        },
        data: {
          status: 'TRANSFERRED',
        },
      });

      // 2. Enroll students into this section
      for (const studentId of studentIds) {
        await tx.sectionStudent.upsert({
          where: {
            sectionId_studentId: {
              sectionId,
              studentId,
            },
          },
          update: {
            status: 'ACTIVE',
            academicYearId: section.academicYearId,
          },
          create: {
            tenantId,
            sectionId,
            studentId,
            academicYearId: section.academicYearId,
            status: 'ACTIVE',
          },
        });
      }

      const count = await tx.sectionStudent.count({
        where: { sectionId, status: 'ACTIVE' },
      });

      return {
        success: true,
        assignedCount: studentIds.length,
        totalEnrolled: count,
      };
    });
  }

  async removeStudent(tenantId: string, sectionId: string, studentId: string) {
    const record = await this.prisma.sectionStudent.findFirst({
      where: { sectionId, studentId, tenantId },
    });

    if (!record) {
      throw new NotFoundException('Student is not enrolled in this section');
    }

    return this.prisma.sectionStudent.update({
      where: { id: record.id },
      data: { status: 'DROPPED' },
    });
  }

  async remove(tenantId: string, id: string) {
    const section = await this.prisma.section.findFirst({
      where: { id, tenantId },
    });

    if (!section) {
      throw new NotFoundException(`Section with ID "${id}" not found`);
    }

    return this.prisma.section.delete({
      where: { id },
    });
  }

  async getStats(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const [totalSections, totalEnrolled] = await Promise.all([
      this.prisma.section.count({ where: tenantWhere }),
      this.prisma.sectionStudent.count({
        where: { ...tenantWhere, status: 'ACTIVE' },
      }),
    ]);

    return {
      totalSections,
      totalEnrolled,
    };
  }
}
