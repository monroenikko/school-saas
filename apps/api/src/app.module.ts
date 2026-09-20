import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { StudentsModule } from './students/students.module';
import { TeachersModule } from './teachers/teachers.module';
import { SectionsModule } from './sections/sections.module';
import { SubjectsModule } from './subjects/subjects.module';
import { GradesModule } from './grades/grades.module';
import { TenantsModule } from './tenants/tenants.module';
import { RfidModule } from './rfid/rfid.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TransactionsModule } from './transactions/transactions.module';
import { UsersModule } from './users/users.module';
import { SettingsModule } from './settings/settings.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    DashboardModule,
    StudentsModule,
    TeachersModule,
    SectionsModule,
    SubjectsModule,
    GradesModule,
    TenantsModule,
    RfidModule,
    AttendanceModule,
    TransactionsModule,
    UsersModule,
    SettingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


