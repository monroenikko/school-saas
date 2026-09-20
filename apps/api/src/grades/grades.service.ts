import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EnrollStudentDto } from './dto/enroll-student.dto';
import { SaveGradesBatchDto } from './dto/save-grades-batch.dto';
import { QueryGradesMatrixDto } from './dto/query-grades.dto';
import { GradingPeriod, EnrollmentStatus } from '@school-saas/shared';

@Injectable()
export class GradesService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // ENROLLMENT MANAGEMENT
  // ==========================================

  async enrollStudents(
    tenantId: string,
    subjectClassId: string,
    dto: EnrollStudentDto,
  ) {
    const subjectClass = await this.prisma.subjectClass.findFirst({
      where: { id: subjectClassId, tenantId },
      include: { section: true },
    });

    if (!subjectClass) {
      throw new NotFoundException(`Subject class with ID "${subjectClassId}" not found`);
    }

    let targetStudentIds: string[] = dto.studentIds ? [...dto.studentIds] : [];

    // If sectionId is specified, fetch all active learners from this section's roster
    if (dto.sectionId) {
      const sectionLearners = await this.prisma.sectionStudent.findMany({
        where: {
          tenantId,
          sectionId: dto.sectionId,
          status: 'ACTIVE',
        },
        select: { studentId: true },
      });
      const sectionIds = sectionLearners.map((s) => s.studentId);
      targetStudentIds = Array.from(new Set([...targetStudentIds, ...sectionIds]));
    }

    if (targetStudentIds.length === 0) {
      throw new BadRequestException('No learners found or specified for enrollment.');
    }

    // Upsert enrollments in transaction
    const enrollments = await this.prisma.$transaction(
      targetStudentIds.map((studentId) =>
        this.prisma.subjectEnrollment.upsert({
          where: {
            studentId_subjectClassId: {
              studentId,
              subjectClassId,
            },
          },
          update: {
            status: EnrollmentStatus.ENROLLED,
          },
          create: {
            tenantId,
            studentId,
            subjectClassId,
            status: EnrollmentStatus.ENROLLED,
          },
        }),
      ),
    );

    return {
      success: true,
      enrolledCount: enrollments.length,
      message: `Successfully enrolled ${enrollments.length} learner(s) into class offering.`,
    };
  }

  async unenrollStudent(tenantId: string, subjectClassId: string, studentId: string) {
    const enrollment = await this.prisma.subjectEnrollment.findFirst({
      where: { tenantId, subjectClassId, studentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment record not found');
    }

    // Check if any grades have been submitted
    const gradeCount = await this.prisma.grade.count({
      where: { tenantId, subjectClassId, studentId },
    });

    if (gradeCount > 0) {
      // Retain record with DROPPED status for audit trail
      await this.prisma.subjectEnrollment.update({
        where: { id: enrollment.id },
        data: { status: EnrollmentStatus.DROPPED },
      });
    } else {
      await this.prisma.subjectEnrollment.delete({
        where: { id: enrollment.id },
      });
    }

    return {
      success: true,
      message: 'Learner removed from class offering.',
    };
  }

  // ==========================================
  // GRADES MATRIX & BATCH ENTRY
  // ==========================================

  async getClassGradesMatrix(
    tenantId: string,
    subjectClassId: string,
    query?: QueryGradesMatrixDto,
  ) {
    const subjectClass = await this.prisma.subjectClass.findFirst({
      where: { id: subjectClassId, tenantId },
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
      },
    });

    if (!subjectClass) {
      throw new NotFoundException(`Subject class with ID "${subjectClassId}" not found`);
    }

    // Fetch all enrolled learners with their grades
    const enrollments = await this.prisma.subjectEnrollment.findMany({
      where: {
        tenantId,
        subjectClassId,
        status: { in: [EnrollmentStatus.ENROLLED, EnrollmentStatus.COMPLETED] },
      },
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            firstName: true,
            lastName: true,
            middleName: true,
            rfidCardUid: true,
            status: true,
          },
        },
        grades: {
          where: query?.period ? { period: query.period } : undefined,
          orderBy: { period: 'asc' },
        },
      },
      orderBy: [
        { student: { lastName: 'asc' } },
        { student: { firstName: 'asc' } },
      ],
    });

    let totalQuarterAverageSum = 0;
    let studentWithGradesCount = 0;

    const studentRows = enrollments.map((enr) => {
      const gradesMap: Record<string, { score: number; remarks: string | null; isPublished: boolean; id: string }> = {};

      let totalScore = 0;
      let count = 0;

      enr.grades.forEach((g) => {
        const numericScore = Number(g.score);
        gradesMap[g.period] = {
          id: g.id,
          score: numericScore,
          remarks: g.remarks,
          isPublished: g.isPublished,
        };
        totalScore += numericScore;
        count += 1;
      });

      const finalAverage = count > 0 ? Number((totalScore / count).toFixed(2)) : null;
      if (finalAverage !== null) {
        totalQuarterAverageSum += finalAverage;
        studentWithGradesCount += 1;
      }

      const remarks = finalAverage !== null ? (finalAverage >= 75.0 ? 'PASSED' : 'FAILED') : null;

      return {
        enrollmentId: enr.id,
        status: enr.status,
        enrolledAt: enr.enrolledAt,
        student: enr.student,
        grades: gradesMap,
        finalAverage,
        remarks,
      };
    });

    const classAverage =
      studentWithGradesCount > 0
        ? Number((totalQuarterAverageSum / studentWithGradesCount).toFixed(2))
        : null;

    return {
      subjectClass: {
        ...subjectClass,
        subject: {
          ...subjectClass.subject,
          credits: Number(subjectClass.subject.credits),
        },
      },
      totalEnrolled: enrollments.length,
      classAverage,
      students: studentRows,
    };
  }

  async saveBatchGrades(
    tenantId: string,
    subjectClassId: string,
    userId: string | null,
    dto: SaveGradesBatchDto,
  ) {
    const subjectClass = await this.prisma.subjectClass.findFirst({
      where: { id: subjectClassId, tenantId },
    });

    if (!subjectClass) {
      throw new NotFoundException(`Subject class with ID "${subjectClassId}" not found`);
    }

    const results = await this.prisma.$transaction(async (tx) => {
      const updatedGrades = [];

      for (const entry of dto.grades) {
        // Resolve subject enrollment
        const enrollment = await tx.subjectEnrollment.findUnique({
          where: {
            studentId_subjectClassId: {
              studentId: entry.studentId,
              subjectClassId,
            },
          },
        });

        // DepEd standard passing calculation (>= 75 is PASSED, < 75 is FAILED)
        const defaultRemarks = entry.score >= 75 ? 'PASSED' : 'FAILED';
        const finalRemarks = entry.remarks?.trim() || defaultRemarks;

        const grade = await tx.grade.upsert({
          where: {
            studentId_subjectClassId_period: {
              studentId: entry.studentId,
              subjectClassId,
              period: dto.period,
            },
          },
          update: {
            score: entry.score,
            remarks: finalRemarks,
            isPublished: dto.isPublished !== undefined ? dto.isPublished : false,
            submittedById: userId || null,
            termId: dto.termId || null,
            subjectEnrollmentId: enrollment ? enrollment.id : null,
          },
          create: {
            tenantId,
            studentId: entry.studentId,
            subjectClassId,
            subjectEnrollmentId: enrollment ? enrollment.id : null,
            termId: dto.termId || null,
            period: dto.period,
            score: entry.score,
            remarks: finalRemarks,
            isPublished: dto.isPublished !== undefined ? dto.isPublished : false,
            submittedById: userId || null,
          },
        });

        updatedGrades.push(grade);
      }

      return updatedGrades;
    });

    return {
      success: true,
      savedCount: results.length,
      period: dto.period,
      message: `Successfully saved ${results.length} grade entries for period ${dto.period}.`,
    };
  }

  async publishGrades(tenantId: string, subjectClassId: string, period: GradingPeriod) {
    const subjectClass = await this.prisma.subjectClass.findFirst({
      where: { id: subjectClassId, tenantId },
    });

    if (!subjectClass) {
      throw new NotFoundException(`Subject class with ID "${subjectClassId}" not found`);
    }

    const updated = await this.prisma.grade.updateMany({
      where: {
        tenantId,
        subjectClassId,
        period,
      },
      data: {
        isPublished: true,
      },
    });

    return {
      success: true,
      publishedCount: updated.count,
      message: `Published ${updated.count} grades for period ${period}.`,
    };
  }

  // ==========================================
  // STUDENT REPORT CARD / TRANSCRIPT
  // ==========================================

  async getStudentReportCard(
    tenantId: string,
    studentId: string,
    academicYearId?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        sectionStudents: {
          where: { status: 'ACTIVE' },
          include: {
            section: true,
            academicYear: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found`);
    }

    const enrollments = await this.prisma.subjectEnrollment.findMany({
      where: {
        tenantId,
        studentId,
        ...(academicYearId
          ? { subjectClass: { academicYearId } }
          : {}),
      },
      include: {
        subjectClass: {
          include: {
            subject: true,
            teacher: true,
            academicYear: true,
          },
        },
        grades: {
          where: { isPublished: true },
          orderBy: { period: 'asc' },
        },
      },
      orderBy: {
        subjectClass: { subject: { code: 'asc' } },
      },
    });

    let totalWeightedScore = 0;
    let totalCredits = 0;

    const subjectsReport = enrollments.map((enr) => {
      const credits = Number(enr.subjectClass.subject.credits) || 1.0;
      const gradesByPeriod: Record<string, number> = {};
      let totalSubjectScore = 0;
      let count = 0;

      enr.grades.forEach((g) => {
        const score = Number(g.score);
        gradesByPeriod[g.period] = score;
        totalSubjectScore += score;
        count += 1;
      });

      const finalGrade = count > 0 ? Number((totalSubjectScore / count).toFixed(2)) : null;

      if (finalGrade !== null) {
        totalWeightedScore += finalGrade * credits;
        totalCredits += credits;
      }

      return {
        subjectCode: enr.subjectClass.subject.code,
        subjectName: enr.subjectClass.subject.name,
        credits,
        classCode: enr.subjectClass.classCode,
        teacher: enr.subjectClass.teacher
          ? `${enr.subjectClass.teacher.firstName} ${enr.subjectClass.teacher.lastName}`
          : 'TBA',
        grades: gradesByPeriod,
        finalGrade,
        remarks: finalGrade !== null ? (finalGrade >= 75.0 ? 'PASSED' : 'FAILED') : 'IN PROGRESS',
      };
    });

    const generalAverage =
      totalCredits > 0 ? Number((totalWeightedScore / totalCredits).toFixed(2)) : null;

    return {
      student: {
        id: student.id,
        studentId: student.studentId,
        fullName: `${student.firstName} ${student.lastName}`,
        currentSection: student.sectionStudents[0]?.section?.name || 'Unassigned',
        gradeLevel: student.sectionStudents[0]?.section?.gradeLevel || 'N/A',
        academicYear: student.sectionStudents[0]?.academicYear?.name || 'Current AY',
      },
      subjects: subjectsReport,
      totalCredits,
      generalAverage,
      remarks:
        generalAverage !== null ? (generalAverage >= 75.0 ? 'PROMOTED' : 'RETAINED') : 'PENDING',
    };
  }
}
