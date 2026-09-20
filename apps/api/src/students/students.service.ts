import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { QueryStudentDto } from './dto/query-student.dto';
import { StudentStatus } from '@school-saas/shared';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(tenantId: string, query: QueryStudentDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sectionId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(status ? { status } : {}),
    };

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { middleName: { contains: search, mode: 'insensitive' } },
        { rfidCardUid: { contains: search, mode: 'insensitive' } },
        { guardianName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (sectionId) {
      where.sectionStudents = {
        some: {
          sectionId,
          status: 'ACTIVE',
        },
      };
    }

    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          sectionStudents: {
            where: { status: 'ACTIVE' },
            include: {
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
      }),
      this.prisma.student.count({ where }),
    ]);

    const formattedData = students.map((s: any) => ({
      ...s,
      currentSection: s.sectionStudents?.[0]?.section || null,
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
    const student = await this.prisma.student.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        sectionStudents: {
          where: { status: 'ACTIVE' },
          include: {
            section: {
              select: {
                id: true,
                name: true,
                gradeLevel: true,
                room: true,
              },
            },
          },
        },
        attendances: {
          take: 7,
          orderBy: { date: 'desc' },
        },
        parents: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    return {
      ...student,
      currentSection: (student as any).sectionStudents?.[0]?.section || null,
    };
  }

  async create(tenantId: string, dto: CreateStudentDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new ConflictException('No active school tenant found.');
    }

    // 1. Check duplicate studentId within the same school tenant
    const existingStudentId = await this.prisma.student.findUnique({
      where: {
        tenantId_studentId: {
          tenantId: resolvedTenantId,
          studentId: dto.studentId,
        },
      },
    });

    if (existingStudentId) {
      throw new ConflictException(
        `Student with ID "${dto.studentId}" already exists in this school`,
      );
    }

    // 2. Check duplicate RFID card UID if provided
    if (dto.rfidCardUid) {
      const existingRfid = await this.prisma.student.findUnique({
        where: { rfidCardUid: dto.rfidCardUid },
      });

      if (existingRfid) {
        throw new ConflictException(
          `RFID Card UID "${dto.rfidCardUid}" is already assigned to student ${existingRfid.firstName} ${existingRfid.lastName}`,
        );
      }
    }

    const { sectionId, birthDate, ...studentData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const newStudent = await tx.student.create({
        data: {
          ...studentData,
          tenantId: resolvedTenantId,
          birthDate: birthDate ? new Date(birthDate) : undefined,
          status: dto.status || StudentStatus.ACTIVE,
        },
      });

      if (sectionId) {
        const section = await tx.section.findUnique({
          where: { id: sectionId },
        });

        if (section) {
          await tx.sectionStudent.create({
            data: {
              tenantId,
              studentId: newStudent.id,
              sectionId,
              academicYearId: section.academicYearId,
              status: 'ACTIVE',
            },
          });
        }
      }

      return newStudent;
    });
  }

  async update(tenantId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    // Check duplicate studentId if changing
    if (dto.studentId && dto.studentId !== student.studentId) {
      const existingStudentId = await this.prisma.student.findUnique({
        where: {
          tenantId_studentId: {
            tenantId,
            studentId: dto.studentId,
          },
        },
      });
      if (existingStudentId) {
        throw new ConflictException(
          `Student with ID "${dto.studentId}" already exists in this school`,
        );
      }
    }

    // Check duplicate RFID card UID if changing
    if (dto.rfidCardUid && dto.rfidCardUid !== student.rfidCardUid) {
      const existingRfid = await this.prisma.student.findUnique({
        where: { rfidCardUid: dto.rfidCardUid },
      });
      if (existingRfid) {
        throw new ConflictException(
          `RFID Card UID "${dto.rfidCardUid}" is already assigned to another student`,
        );
      }
    }

    const { sectionId, birthDate, ...updateData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const updatedStudent = await tx.student.update({
        where: { id },
        data: {
          ...updateData,
          ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        },
      });

      if (sectionId !== undefined) {
        await tx.sectionStudent.updateMany({
          where: { studentId: id, status: 'ACTIVE' },
          data: { status: 'TRANSFERRED' },
        });

        if (sectionId) {
          const section = await tx.section.findUnique({
            where: { id: sectionId },
          });

          if (section) {
            await tx.sectionStudent.create({
              data: {
                tenantId,
                studentId: id,
                sectionId,
                academicYearId: section.academicYearId,
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      return updatedStudent;
    });
  }

  async assignRfid(tenantId: string, id: string, rfidCardUid: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    const existingRfid = await this.prisma.student.findUnique({
      where: { rfidCardUid },
    });

    if (existingRfid && existingRfid.id !== id) {
      throw new ConflictException(
        `RFID Card UID "${rfidCardUid}" is already assigned to student ${existingRfid.firstName} ${existingRfid.lastName}`,
      );
    }

    return this.prisma.student.update({
      where: { id },
      data: { rfidCardUid },
    });
  }

  async remove(tenantId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${id}" not found`);
    }

    // Soft delete pattern
    return this.prisma.student.update({
      where: { id },
      data: { status: StudentStatus.DROPPED },
    });
  }

  async getStats(tenantId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const [total, active, badged] = await Promise.all([
      this.prisma.student.count({ where: tenantWhere }),
      this.prisma.student.count({
        where: { ...tenantWhere, status: StudentStatus.ACTIVE },
      }),
      this.prisma.student.count({
        where: { ...tenantWhere, rfidCardUid: { not: null } },
      }),
    ]);

    return {
      total,
      active,
      badged,
      unassigned: Math.max(0, total - badged),
    };
  }

  async getSections(tenantId: string) {
    return this.prisma.section.findMany({
      where: tenantId ? { tenantId } : {},
      select: {
        id: true,
        name: true,
        gradeLevel: true,
        room: true,
      },
      orderBy: { gradeLevel: 'asc' },
    });
  }
}
