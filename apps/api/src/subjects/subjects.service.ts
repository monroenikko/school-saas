import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { CreateSubjectClassDto } from './dto/create-subject-class.dto';
import { UpdateSubjectClassDto } from './dto/update-subject-class.dto';
import { QuerySubjectDto, QuerySubjectClassDto } from './dto/query-subject.dto';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // MASTER SUBJECTS
  // ==========================================

  async findAllSubjects(tenantId: string, query: QuerySubjectDto) {
    const { page = 1, limit = 50, search, gradeLevel } = query;
    const skip = (page - 1) * limit;

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(gradeLevel ? { gradeLevel } : {}),
    };

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [subjects, total] = await Promise.all([
      this.prisma.subject.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ gradeLevel: 'asc' }, { code: 'asc' }],
        include: {
          _count: {
            select: { classes: true },
          },
        },
      }),
      this.prisma.subject.count({ where }),
    ]);

    return {
      data: subjects.map((s) => ({
        ...s,
        credits: Number(s.credits),
        classCount: s._count.classes,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneSubject(tenantId: string, id: string) {
    const subject = await this.prisma.subject.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        _count: {
          select: { classes: true },
        },
      },
    });

    if (!subject) {
      throw new NotFoundException(`Subject with ID "${id}" not found`);
    }

    return {
      ...subject,
      credits: Number(subject.credits),
      classCount: subject._count.classes,
    };
  }

  async createSubject(tenantId: string, dto: CreateSubjectDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new ConflictException('No active school tenant found.');
    }

    const existing = await this.prisma.subject.findUnique({
      where: {
        tenantId_code: {
          tenantId: resolvedTenantId,
          code: dto.code,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Subject with code "${dto.code}" already exists`);
    }

    const created = await this.prisma.subject.create({
      data: {
        tenantId: resolvedTenantId,
        code: dto.code.toUpperCase().trim(),
        name: dto.name.trim(),
        description: dto.description?.trim() || null,
        credits: dto.credits !== undefined ? dto.credits : 3.0,
        gradeLevel: dto.gradeLevel?.trim() || null,
      },
    });

    return {
      ...created,
      credits: Number(created.credits),
    };
  }

  async updateSubject(tenantId: string, id: string, dto: Partial<CreateSubjectDto>) {
    await this.findOneSubject(tenantId, id);

    if (dto.code) {
      const duplicate = await this.prisma.subject.findFirst({
        where: {
          tenantId,
          code: dto.code.toUpperCase().trim(),
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(`Subject code "${dto.code}" is already in use`);
      }
    }

    const updated = await this.prisma.subject.update({
      where: { id },
      data: {
        ...(dto.code ? { code: dto.code.toUpperCase().trim() } : {}),
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() || null } : {}),
        ...(dto.credits !== undefined ? { credits: dto.credits } : {}),
        ...(dto.gradeLevel !== undefined ? { gradeLevel: dto.gradeLevel?.trim() || null } : {}),
      },
    });

    return {
      ...updated,
      credits: Number(updated.credits),
    };
  }

  async removeSubject(tenantId: string, id: string) {
    const subject = await this.findOneSubject(tenantId, id);

    if (subject.classCount > 0) {
      throw new BadRequestException(
        `Cannot delete subject "${subject.name}" because it has ${subject.classCount} active class offering(s).`,
      );
    }

    return this.prisma.subject.delete({
      where: { id },
    });
  }

  // ==========================================
  // TERMS HELPER
  // ==========================================

  async getTerms(tenantId: string) {
    const terms = await this.prisma.term.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: [{ isCurrent: 'desc' }, { startDate: 'asc' }],
      include: {
        academicYear: {
          select: {
            id: true,
            name: true,
            isCurrent: true,
          },
        },
      },
    });

    return terms;
  }

  // ==========================================
  // CLASS OFFERINGS (SUBJECT CLASSES)
  // ==========================================

  async findAllClasses(tenantId: string, query: QuerySubjectClassDto) {
    const {
      page = 1,
      limit = 20,
      search,
      subjectId,
      teacherId,
      sectionId,
      termId,
      academicYearId,
    } = query;

    const skip = (page - 1) * limit;

    const where: any = {
      ...(tenantId ? { tenantId } : {}),
      ...(subjectId ? { subjectId } : {}),
      ...(teacherId ? { teacherId } : {}),
      ...(sectionId ? { sectionId } : {}),
      ...(academicYearId ? { academicYearId } : {}),
      ...(termId ? { terms: { some: { termId } } } : {}),
    };

    if (search) {
      where.OR = [
        { classCode: { contains: search, mode: 'insensitive' } },
        { room: { contains: search, mode: 'insensitive' } },
        { subject: { name: { contains: search, mode: 'insensitive' } } },
        { subject: { code: { contains: search, mode: 'insensitive' } } },
        { teacher: { firstName: { contains: search, mode: 'insensitive' } } },
        { teacher: { lastName: { contains: search, mode: 'insensitive' } } },
        { section: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [classes, total] = await Promise.all([
      this.prisma.subjectClass.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          subject: true,
          teacher: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              employeeId: true,
              specialization: true,
            },
          },
          section: {
            select: {
              id: true,
              name: true,
              gradeLevel: true,
            },
          },
          academicYear: {
            select: {
              id: true,
              name: true,
            },
          },
          terms: {
            include: {
              term: {
                select: {
                  id: true,
                  name: true,
                  startDate: true,
                  endDate: true,
                  isCurrent: true,
                },
              },
            },
          },
          schedules: {
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
          },
          _count: {
            select: {
              enrollments: true,
            },
          },
        },
      }),
      this.prisma.subjectClass.count({ where }),
    ]);

    const formatted = classes.map((c) => ({
      ...c,
      subject: {
        ...c.subject,
        credits: Number(c.subject.credits),
      },
      enrolledCount: c._count.enrollments,
      termsList: c.terms.map((t) => t.term),
    }));

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneClass(tenantId: string, id: string) {
    const subjectClass = await this.prisma.subjectClass.findFirst({
      where: { id, ...(tenantId ? { tenantId } : {}) },
      include: {
        subject: true,
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            employeeId: true,
            specialization: true,
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            gradeLevel: true,
          },
        },
        academicYear: {
          select: {
            id: true,
            name: true,
          },
        },
        terms: {
          include: {
            term: true,
          },
        },
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
        enrollments: {
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
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!subjectClass) {
      throw new NotFoundException(`Subject class with ID "${id}" not found`);
    }

    return {
      ...subjectClass,
      subject: {
        ...subjectClass.subject,
        credits: Number(subjectClass.subject.credits),
      },
      enrolledCount: subjectClass._count.enrollments,
      termsList: subjectClass.terms.map((t) => t.term),
    };
  }

  async createClass(tenantId: string, dto: CreateSubjectClassDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new ConflictException('No active school tenant found.');
    }

    // 1. Verify subject exists
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}) },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID "${dto.subjectId}" not found`);
    }

    // 2. Resolve Academic Year
    let academicYearId = dto.academicYearId;
    if (!academicYearId) {
      const activeYear = await this.prisma.academicYear.findFirst({
        where: { tenantId: resolvedTenantId, isCurrent: true },
      });
      if (!activeYear) {
        throw new BadRequestException(
          'No active academic year found. Please specify academicYearId.',
        );
      }
      academicYearId = activeYear.id;
    }

    // 3. Verify Unique classCode
    const existing = await this.prisma.subjectClass.findUnique({
      where: {
        tenantId_academicYearId_classCode: {
          tenantId: resolvedTenantId,
          academicYearId,
          classCode: dto.classCode.toUpperCase().trim(),
        },
      },
    });
    if (existing) {
      throw new ConflictException(
        `Class code "${dto.classCode}" already exists for this academic year`,
      );
    }

    // 4. Validate terms
    if (dto.termIds && dto.termIds.length > 0) {
      const terms = await this.prisma.term.findMany({
        where: { id: { in: dto.termIds }, tenantId: resolvedTenantId },
      });
      if (terms.length !== dto.termIds.length) {
        throw new BadRequestException('One or more selected terms are invalid');
      }
    }

    // 5. Create in transaction
    const createdClass = await this.prisma.$transaction(async (tx) => {
      const newClass = await tx.subjectClass.create({
        data: {
          tenantId: resolvedTenantId,
          subjectId: dto.subjectId,
          academicYearId,
          teacherId: dto.teacherId || null,
          sectionId: dto.sectionId || null,
          classCode: dto.classCode.toUpperCase().trim(),
          room: dto.room?.trim() || null,
          capacity: dto.capacity || 45,
        },
      });

      // Create SubjectClassTerm entries for multiple select terms
      if (dto.termIds && dto.termIds.length > 0) {
        await tx.subjectClassTerm.createMany({
          data: dto.termIds.map((termId) => ({
            tenantId: resolvedTenantId,
            subjectClassId: newClass.id,
            termId,
          })),
        });
      }

      // Create ClassSchedule entries for dynamic multi-slot schedules
      if (dto.schedules && dto.schedules.length > 0) {
        await tx.classSchedule.createMany({
          data: dto.schedules.map((slot) => ({
            tenantId: resolvedTenantId,
            subjectClassId: newClass.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            room: slot.room?.trim() || dto.room?.trim() || null,
          })),
        });
      }

      return newClass;
    });

    return this.findOneClass(resolvedTenantId, createdClass.id);
  }

  async updateClass(tenantId: string, id: string, dto: UpdateSubjectClassDto) {
    const existing = await this.findOneClass(tenantId, id);

    if (dto.classCode && dto.classCode !== existing.classCode) {
      const duplicate = await this.prisma.subjectClass.findFirst({
        where: {
          tenantId,
          academicYearId: existing.academicYearId,
          classCode: dto.classCode.toUpperCase().trim(),
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `Class code "${dto.classCode}" is already in use for this academic year`,
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // 1. Update scalar fields
      await tx.subjectClass.update({
        where: { id },
        data: {
          ...(dto.subjectId ? { subjectId: dto.subjectId } : {}),
          ...(dto.classCode ? { classCode: dto.classCode.toUpperCase().trim() } : {}),
          ...(dto.teacherId !== undefined ? { teacherId: dto.teacherId || null } : {}),
          ...(dto.sectionId !== undefined ? { sectionId: dto.sectionId || null } : {}),
          ...(dto.room !== undefined ? { room: dto.room?.trim() || null } : {}),
          ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
        },
      });

      // 2. If termIds provided, replace term relations
      if (dto.termIds) {
        await tx.subjectClassTerm.deleteMany({
          where: { subjectClassId: id },
        });
        if (dto.termIds.length > 0) {
          await tx.subjectClassTerm.createMany({
            data: dto.termIds.map((termId) => ({
              tenantId,
              subjectClassId: id,
              termId,
            })),
          });
        }
      }

      // 3. If schedules provided, replace schedules
      if (dto.schedules) {
        await tx.classSchedule.deleteMany({
          where: { subjectClassId: id },
        });
        if (dto.schedules.length > 0) {
          await tx.classSchedule.createMany({
            data: dto.schedules.map((slot) => ({
              tenantId,
              subjectClassId: id,
              dayOfWeek: slot.dayOfWeek,
              startTime: slot.startTime,
              endTime: slot.endTime,
              room: slot.room?.trim() || dto.room?.trim() || null,
            })),
          });
        }
      }
    });

    return this.findOneClass(tenantId, id);
  }

  async removeClass(tenantId: string, id: string) {
    await this.findOneClass(tenantId, id);

    return this.prisma.subjectClass.delete({
      where: { id },
    });
  }
}
