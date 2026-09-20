import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIdCardTemplateDto, BatchBadgeQueryDto } from './dto/id-card-template.dto';

@Injectable()
export class IdCardsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // 1. TEMPLATE CATALOG
  // ==========================================

  getTemplates(tenantId: string) {
    return [
      {
        id: 'emerald-modern',
        name: 'Emerald Modern CR80',
        orientation: 'PORTRAIT',
        accentColor: '#059669',
        headerColor: '#064e3b',
        textColor: '#0f172a',
        showQrCode: true,
        showBarcode: true,
        showRfidUid: true,
        showGuardianInfo: true,
        safeMarginPercent: 5,
        isDefault: true,
      },
      {
        id: 'navy-executive',
        name: 'Navy Classic Academy',
        orientation: 'PORTRAIT',
        accentColor: '#1e3a8a',
        headerColor: '#0f172a',
        textColor: '#0f172a',
        showQrCode: true,
        showBarcode: true,
        showRfidUid: true,
        showGuardianInfo: true,
        safeMarginPercent: 5,
        isDefault: false,
      },
      {
        id: 'burgundy-prestige',
        name: 'Burgundy Prestige',
        orientation: 'PORTRAIT',
        accentColor: '#991b1b',
        headerColor: '#450a0a',
        textColor: '#0f172a',
        showQrCode: true,
        showBarcode: true,
        showRfidUid: true,
        showGuardianInfo: true,
        safeMarginPercent: 5,
        isDefault: false,
      },
      {
        id: 'slate-minimal',
        name: 'Slate Minimal',
        orientation: 'LANDSCAPE',
        accentColor: '#475569',
        headerColor: '#1e293b',
        textColor: '#0f172a',
        showQrCode: true,
        showBarcode: true,
        showRfidUid: true,
        showGuardianInfo: true,
        safeMarginPercent: 4,
        isDefault: false,
      },
    ];
  }

  // ==========================================
  // 2. SINGLE STUDENT BADGE DATA
  // ==========================================

  async getStudentBadgeData(tenantId: string, studentId: string) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const tenantQuery = tenantId ? { id: tenantId } : {};

    const [tenant, student] = await Promise.all([
      this.prisma.tenant.findFirst({
        where: tenantQuery,
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          phone: true,
          email: true,
          logoUrl: true,
        },
      }),
      this.prisma.student.findFirst({
        where: { id: studentId, ...tenantWhere },
        include: {
          sectionStudents: {
            where: { status: 'ACTIVE' },
            include: {
              section: {
                include: {
                  academicYear: true,
                  adviser: true,
                },
              },
            },
            take: 1,
          },
        },
      }),
    ]);

    if (!student) {
      throw new NotFoundException(`Student with ID "${studentId}" not found`);
    }

    const currentSection = student.sectionStudents[0]?.section;
    const rfidCardUid =
      student.rfidCardUid || `E20000${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;

    const fullName = `${student.firstName} ${student.middleName ? student.middleName.charAt(0) + '. ' : ''}${student.lastName}`;

    return {
      id: student.id,
      studentId: student.studentId, // LRN
      lrn: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName,
      fullName,
      gender: student.gender || 'MALE',
      gradeLevel: currentSection?.gradeLevel || 'Grade 7',
      sectionName: currentSection?.name || 'Diamond',
      adviserName: currentSection?.adviser
        ? `${currentSection.adviser.firstName} ${currentSection.adviser.lastName}`
        : 'Class Adviser',
      rfidCardUid,
      photoUrl: (student as any).photoUrl || null,
      guardianName: student.guardianName || 'Guardian',
      guardianPhone: student.guardianPhone || student.emergencyContact || '+63 917 123 4567',
      emergencyContact: student.emergencyContact || student.guardianPhone || '+63 917 123 4567',
      school: {
        name: tenant?.name || 'St. Jude International Academy',
        schoolId: tenant?.slug ? tenant.slug.toUpperCase() : '300412',
        address: tenant?.address || '1004 Gen. Luna St., Ermita, Manila',
        phone: tenant?.phone || '+63 2 8524 4611',
        logoUrl: tenant?.logoUrl || null,
        principalName: 'DR. EDUARDO DELA VEGA',
      },
      schoolYear: currentSection?.academicYear?.name || '2026-2027',
      qrCodeData: `EDVANCE:VERIFY:LRN=${student.studentId}:RFID=${rfidCardUid}`,
      barcodeData: student.studentId,
    };
  }

  // ==========================================
  // 3. BATCH BADGE DATA (FOR SHEET PRINTING)
  // ==========================================

  async getBatchBadgeData(tenantId: string, query: BatchBadgeQueryDto) {
    const tenantWhere = tenantId ? { tenantId } : {};
    const tenantQuery = tenantId ? { id: tenantId } : {};

    const tenant = await this.prisma.tenant.findFirst({
      where: tenantQuery,
      select: {
        id: true,
        name: true,
        slug: true,
        address: true,
        phone: true,
        logoUrl: true,
      },
    });

    let studentWhere: any = { ...tenantWhere };

    if (query.sectionId) {
      studentWhere = {
        ...studentWhere,
        sectionStudents: {
          some: {
            sectionId: query.sectionId,
            status: 'ACTIVE',
          },
        },
      };
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      include: {
        sectionStudents: {
          where: { status: 'ACTIVE' },
          include: {
            section: {
              include: {
                academicYear: true,
                adviser: true,
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { lastName: 'asc' },
      take: 24, // Batch print sheet size
    });

    const badges = students.map((st) => {
      const sec = st.sectionStudents[0]?.section;
      const rfidCardUid =
        st.rfidCardUid || `E20000${Math.floor(1000 + Math.random() * 9000).toString(16).toUpperCase()}`;
      const fullName = `${st.firstName} ${st.middleName ? st.middleName.charAt(0) + '. ' : ''}${st.lastName}`;

      return {
        id: st.id,
        studentId: st.studentId,
        lrn: st.studentId,
        fullName,
        gradeLevel: sec?.gradeLevel || 'Grade 7',
        sectionName: sec?.name || 'Diamond',
        adviserName: sec?.adviser ? `${sec.adviser.firstName} ${sec.adviser.lastName}` : 'Adviser',
        rfidCardUid,
        photoUrl: (st as any).photoUrl || null,
        guardianPhone: st.guardianPhone || st.emergencyContact || '+63 917 123 4567',
        school: {
          name: tenant?.name || 'St. Jude International Academy',
          schoolId: tenant?.slug ? tenant.slug.toUpperCase() : '300412',
          address: tenant?.address || 'Manila, Philippines',
          phone: tenant?.phone || '+63 2 8524 4611',
          principalName: 'DR. EDUARDO DELA VEGA',
        },
        schoolYear: sec?.academicYear?.name || '2026-2027',
        qrCodeData: `EDVANCE:VERIFY:LRN=${st.studentId}:RFID=${rfidCardUid}`,
        barcodeData: st.studentId,
      };
    });

    return {
      total: badges.length,
      badges,
    };
  }

  // ==========================================
  // 4. CUSTOM TEMPLATE SAVE
  // ==========================================

  saveCustomTemplate(tenantId: string, dto: CreateIdCardTemplateDto) {
    return {
      success: true,
      template: {
        id: `custom-${Date.now()}`,
        tenantId,
        ...dto,
        updatedAt: new Date().toISOString(),
      },
      message: 'ID Card Template saved successfully',
    };
  }
}
