import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSchoolSettingsDto } from './dto/update-school-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==========================================
  // GET SCHOOL PROFILE & SYSTEM CONFIGURATION
  // ==========================================

  async getSettings(tenantId: string) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new BadRequestException('No active school tenant found.');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: resolvedTenantId },
      include: {
        academicYears: {
          where: { isCurrent: true },
          take: 1,
          include: {
            terms: {
              where: { isCurrent: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`School tenant with ID "${resolvedTenantId}" not found`);
    }

    const currentYear = tenant.academicYears[0];
    const currentTerm = currentYear?.terms[0];

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      plan: tenant.plan,
      status: tenant.status,
      address: tenant.address,
      phone: tenant.phone,
      email: tenant.email,
      currency: tenant.currency,
      timezone: tenant.timezone,
      logoUrl: tenant.logoUrl,
      currentAcademicYear: currentYear
        ? {
            id: currentYear.id,
            name: currentYear.name,
            currentTerm: currentTerm ? currentTerm.name : '1st Semester',
          }
        : null,
      rfidPolicy: {
        lateCutoffTime: '08:00',
        afternoonExitStartTime: '15:30',
        debounceSeconds: 60,
        autoSmsAlerts: true,
      },
    };
  }

  // ==========================================
  // UPDATE SCHOOL PROFILE & SETTINGS
  // ==========================================

  async updateSettings(tenantId: string, dto: UpdateSchoolSettingsDto) {
    const resolvedTenantId =
      tenantId ||
      (await this.prisma.tenant.findFirst({
        where: { status: 'ACTIVE' },
        select: { id: true },
      }))?.id;

    if (!resolvedTenantId) {
      throw new BadRequestException('No active school tenant found.');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: resolvedTenantId },
      data: {
        name: dto.name?.trim() || undefined,
        address: dto.address?.trim() || undefined,
        phone: dto.phone?.trim() || undefined,
        email: dto.email?.trim() || undefined,
        timezone: dto.timezone?.trim() || undefined,
        currency: dto.currency?.trim() || undefined,
      },
    });

    return {
      success: true,
      message: 'School settings updated successfully.',
      data: {
        ...updated,
        rfidPolicy: {
          lateCutoffTime: dto.lateCutoffTime || '08:00',
          debounceSeconds: 60,
        },
      },
    };
  }
}
