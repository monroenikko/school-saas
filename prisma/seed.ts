import { PrismaClient, Role, TenantStatus, StudentStatus, TeacherStatus, Gender, ParentRelationship, DayOfWeek, EnrollmentStatus, GradingPeriod, TransactionType, PaymentStatus, PaymentMethod, DeviceStatus, AttendanceStatus, ScanType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);
  const superAdminPasswordHash = await bcrypt.hash('SuperAdmin123!', 10);

  // 1. Create Super Admin (platform level, no tenantId)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@schoolsaas.com' },
    update: {},
    create: {
      email: 'admin@schoolsaas.com',
      passwordHash: superAdminPasswordHash,
      firstName: 'System',
      lastName: 'SuperAdmin',
      role: Role.SUPER_ADMIN,
    },
  });
  console.log(`✅ Super Admin created: ${superAdmin.email}`);

  // 2. Create Demo Tenant (School)
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'st-jude-academy' },
    update: {},
    create: {
      name: 'St. Jude International Academy',
      slug: 'st-jude-academy',
      domain: 'stjude.schoolsaas.com',
      plan: 'ENTERPRISE',
      status: TenantStatus.ACTIVE,
      address: '123 Academic Avenue, Quezon City, Metro Manila',
      phone: '+63 2 8123 4567',
      email: 'admissions@stjude.edu.ph',
      currency: 'PHP',
      timezone: 'Asia/Manila',
    },
  });
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.id})`);

  // 3. Create School Admin User
  const schoolAdminUser = await prisma.user.upsert({
    where: { email: 'principal@stjude.edu.ph' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'principal@stjude.edu.ph',
      passwordHash: defaultPasswordHash,
      firstName: 'Corazon',
      lastName: 'Aquino',
      role: Role.SCHOOL_ADMIN,
    },
  });
  console.log(`✅ School Admin created: ${schoolAdminUser.email}`);

  // 4. Academic Year & Terms
  const academicYear = await prisma.academicYear.upsert({
    where: {
      tenantId_name: {
        tenantId: tenant.id,
        name: '2026-2027',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      name: '2026-2027',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2027-05-31'),
      isCurrent: true,
    },
  });

  const term1 = await prisma.term.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: '1st Semester',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      name: '1st Semester',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-18'),
      isCurrent: true,
    },
  });

  const term2 = await prisma.term.upsert({
    where: {
      tenantId_academicYearId_name: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: '2nd Semester',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      name: '2nd Semester',
      startDate: new Date('2027-01-05'),
      endDate: new Date('2027-05-31'),
      isCurrent: false,
    },
  });
  console.log(`✅ Academic Year & Terms created (1st & 2nd Semester)`);

  // 5. Teachers
  const teacherUser1 = await prisma.user.upsert({
    where: { email: 'msantos@stjude.edu.ph' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'msantos@stjude.edu.ph',
      passwordHash: defaultPasswordHash,
      firstName: 'Maria',
      lastName: 'Santos',
      role: Role.TEACHER,
    },
  });

  const teacher1 = await prisma.teacher.upsert({
    where: {
      tenantId_employeeId: {
        tenantId: tenant.id,
        employeeId: 'TCH-2026-001',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: teacherUser1.id,
      employeeId: 'TCH-2026-001',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'msantos@stjude.edu.ph',
      phone: '09170010001',
      specialization: 'Mathematics',
      status: TeacherStatus.ACTIVE,
    },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: { email: 'rcruz@stjude.edu.ph' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'rcruz@stjude.edu.ph',
      passwordHash: defaultPasswordHash,
      firstName: 'Roberto',
      lastName: 'Cruz',
      role: Role.TEACHER,
    },
  });

  const teacher2 = await prisma.teacher.upsert({
    where: {
      tenantId_employeeId: {
        tenantId: tenant.id,
        employeeId: 'TCH-2026-002',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: teacherUser2.id,
      employeeId: 'TCH-2026-002',
      firstName: 'Roberto',
      lastName: 'Cruz',
      email: 'rcruz@stjude.edu.ph',
      phone: '09170010002',
      specialization: 'Natural Sciences',
      status: TeacherStatus.ACTIVE,
    },
  });
  console.log(`✅ Teachers seeded (Maria Santos, Roberto Cruz)`);

  // 6. Sections
  const sectionDiamond = await prisma.section.upsert({
    where: {
      tenantId_academicYearId_name_gradeLevel: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: 'Diamond',
        gradeLevel: 'Grade 7',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      termId: term1.id,
      name: 'Diamond',
      gradeLevel: 'Grade 7',
      room: 'Room 201',
      adviserId: teacher1.id,
    },
  });

  const sectionRuby = await prisma.section.upsert({
    where: {
      tenantId_academicYearId_name_gradeLevel: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        name: 'Ruby',
        gradeLevel: 'Grade 7',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      academicYearId: academicYear.id,
      termId: term1.id,
      name: 'Ruby',
      gradeLevel: 'Grade 7',
      room: 'Room 202',
      adviserId: teacher2.id,
    },
  });
  console.log(`✅ Sections created (Grade 7 - Diamond, Grade 7 - Ruby)`);

  // 7. Parents
  const parentUser = await prisma.user.upsert({
    where: { email: 'parent.delacruz@gmail.com' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'parent.delacruz@gmail.com',
      passwordHash: defaultPasswordHash,
      firstName: 'Juan',
      lastName: 'Dela Cruz Sr.',
      role: Role.PARENT,
    },
  });

  const parent1 = await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: {
      tenantId: tenant.id,
      userId: parentUser.id,
      firstName: 'Juan',
      lastName: 'Dela Cruz Sr.',
      email: 'parent.delacruz@gmail.com',
      phone: '09171234567',
      address: '45 Sunshine St, Quezon City',
      occupation: 'Software Engineer',
    },
  });

  // 8. Students
  const student1 = await prisma.student.upsert({
    where: {
      tenantId_studentId: {
        tenantId: tenant.id,
        studentId: '2026-0001',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: '2026-0001',
      firstName: 'Juan',
      lastName: 'Dela Cruz Jr.',
      gender: Gender.MALE,
      birthDate: new Date('2013-05-14'),
      rfidCardUid: 'E28068940000501234A1B2C1',
      status: StudentStatus.ACTIVE,
      guardianName: 'Juan Dela Cruz Sr.',
      guardianEmail: 'parent.delacruz@gmail.com',
      guardianPhone: '09171234567',
    },
  });

  const student2 = await prisma.student.upsert({
    where: {
      tenantId_studentId: {
        tenantId: tenant.id,
        studentId: '2026-0002',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: '2026-0002',
      firstName: 'Maria',
      lastName: 'Bautista',
      gender: Gender.FEMALE,
      birthDate: new Date('2013-08-22'),
      rfidCardUid: 'E28068940000501234A1B2C2',
      status: StudentStatus.ACTIVE,
      guardianName: 'Corazon Bautista',
      guardianEmail: 'cbautista@gmail.com',
      guardianPhone: '09187654321',
    },
  });

  const student3 = await prisma.student.upsert({
    where: {
      tenantId_studentId: {
        tenantId: tenant.id,
        studentId: '2026-0003',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: '2026-0003',
      firstName: 'Angelo',
      lastName: 'Garcia',
      gender: Gender.MALE,
      birthDate: new Date('2013-11-03'),
      rfidCardUid: 'E28068940000501234A1B2C3',
      status: StudentStatus.ACTIVE,
      guardianName: 'Manuel Garcia',
      guardianEmail: 'mgarcia@gmail.com',
      guardianPhone: '09191112233',
    },
  });

  // Link Parent to Student
  await prisma.studentParent.upsert({
    where: {
      studentId_parentId: {
        studentId: student1.id,
        parentId: parent1.id,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      parentId: parent1.id,
      relationship: ParentRelationship.FATHER,
      isEmergencyContact: true,
      canPickup: true,
    },
  });
  console.log(`✅ Students & Parent links created`);

  // 9. Student Listing on Section
  await prisma.sectionStudent.upsert({
    where: {
      sectionId_studentId: {
        sectionId: sectionDiamond.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      sectionId: sectionDiamond.id,
      studentId: student1.id,
      academicYearId: academicYear.id,
      status: 'ACTIVE',
    },
  });

  await prisma.sectionStudent.upsert({
    where: {
      sectionId_studentId: {
        sectionId: sectionDiamond.id,
        studentId: student2.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      sectionId: sectionDiamond.id,
      studentId: student2.id,
      academicYearId: academicYear.id,
      status: 'ACTIVE',
    },
  });

  await prisma.sectionStudent.upsert({
    where: {
      sectionId_studentId: {
        sectionId: sectionDiamond.id,
        studentId: student3.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      sectionId: sectionDiamond.id,
      studentId: student3.id,
      academicYearId: academicYear.id,
      status: 'ACTIVE',
    },
  });
  console.log(`✅ Students listed in Section Grade 7 - Diamond`);

  // 10. Subjects Catalog
  const subjectMath = await prisma.subject.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'MATH7',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'MATH7',
      name: 'General Mathematics 7',
      description: 'Foundations of numbers, algebra, geometry, and statistics for Grade 7',
      credits: 3.0,
      gradeLevel: 'Grade 7',
    },
  });

  const subjectSci = await prisma.subject.upsert({
    where: {
      tenantId_code: {
        tenantId: tenant.id,
        code: 'SCI7',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      code: 'SCI7',
      name: 'Integrated Science 7',
      description: 'Introduction to physics, chemistry, biology, and earth sciences',
      credits: 3.0,
      gradeLevel: 'Grade 7',
    },
  });
  console.log(`✅ Subjects Catalog created (MATH7, SCI7)`);

  // 11. Subject Class Offerings with Multiple Term Selection & Schedules
  const mathClass = await prisma.subjectClass.upsert({
    where: {
      tenantId_academicYearId_classCode: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        classCode: 'MATH7-DIA-T1',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      subjectId: subjectMath.id,
      academicYearId: academicYear.id,
      teacherId: teacher1.id,
      sectionId: sectionDiamond.id,
      classCode: 'MATH7-DIA-T1',
      room: 'Room 201',
      capacity: 45,
    },
  });

  // Attach multiple terms to subject class offering
  await prisma.subjectClassTerm.upsert({
    where: {
      subjectClassId_termId: {
        subjectClassId: mathClass.id,
        termId: term1.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      subjectClassId: mathClass.id,
      termId: term1.id,
    },
  });

  // Schedules for Math Class (Mon & Wed 08:00 - 09:30)
  await prisma.classSchedule.deleteMany({
    where: { subjectClassId: mathClass.id },
  });
  await prisma.classSchedule.createMany({
    data: [
      {
        tenantId: tenant.id,
        subjectClassId: mathClass.id,
        dayOfWeek: DayOfWeek.MONDAY,
        startTime: '08:00',
        endTime: '09:30',
        room: 'Room 201',
      },
      {
        tenantId: tenant.id,
        subjectClassId: mathClass.id,
        dayOfWeek: DayOfWeek.WEDNESDAY,
        startTime: '08:00',
        endTime: '09:30',
        room: 'Room 201',
      },
    ],
  });

  const sciClass = await prisma.subjectClass.upsert({
    where: {
      tenantId_academicYearId_classCode: {
        tenantId: tenant.id,
        academicYearId: academicYear.id,
        classCode: 'SCI7-DIA-T1',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      subjectId: subjectSci.id,
      academicYearId: academicYear.id,
      teacherId: teacher2.id,
      sectionId: sectionDiamond.id,
      classCode: 'SCI7-DIA-T1',
      room: 'Science Lab 1',
      capacity: 40,
    },
  });

  await prisma.subjectClassTerm.upsert({
    where: {
      subjectClassId_termId: {
        subjectClassId: sciClass.id,
        termId: term1.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      subjectClassId: sciClass.id,
      termId: term1.id,
    },
  });

  await prisma.classSchedule.deleteMany({
    where: { subjectClassId: sciClass.id },
  });
  await prisma.classSchedule.createMany({
    data: [
      {
        tenantId: tenant.id,
        subjectClassId: sciClass.id,
        dayOfWeek: DayOfWeek.TUESDAY,
        startTime: '09:30',
        endTime: '11:00',
        room: 'Science Lab 1',
      },
      {
        tenantId: tenant.id,
        subjectClassId: sciClass.id,
        dayOfWeek: DayOfWeek.THURSDAY,
        startTime: '09:30',
        endTime: '11:00',
        room: 'Science Lab 1',
      },
    ],
  });
  console.log(`✅ Subject Classes with Schedules & Terms created`);

  // 12. Student Enrollment in Subjects
  const mathEnrollment1 = await prisma.subjectEnrollment.upsert({
    where: {
      studentId_subjectClassId: {
        studentId: student1.id,
        subjectClassId: mathClass.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: student1.id,
      subjectClassId: mathClass.id,
      status: EnrollmentStatus.ENROLLED,
    },
  });

  await prisma.subjectEnrollment.upsert({
    where: {
      studentId_subjectClassId: {
        studentId: student2.id,
        subjectClassId: mathClass.id,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: student2.id,
      subjectClassId: mathClass.id,
      status: EnrollmentStatus.ENROLLED,
    },
  });
  console.log(`✅ Students enrolled into subject classes`);

  // 13. Student Grades
  await prisma.grade.upsert({
    where: {
      studentId_subjectClassId_period: {
        studentId: student1.id,
        subjectClassId: mathClass.id,
        period: GradingPeriod.Q1,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: student1.id,
      subjectClassId: mathClass.id,
      subjectEnrollmentId: mathEnrollment1.id,
      termId: term1.id,
      period: GradingPeriod.Q1,
      score: 94.50,
      remarks: 'EXCELLENT',
      isPublished: true,
      submittedById: teacherUser1.id,
    },
  });

  await prisma.grade.upsert({
    where: {
      studentId_subjectClassId_period: {
        studentId: student1.id,
        subjectClassId: mathClass.id,
        period: GradingPeriod.Q2,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: student1.id,
      subjectClassId: mathClass.id,
      subjectEnrollmentId: mathEnrollment1.id,
      termId: term1.id,
      period: GradingPeriod.Q2,
      score: 92.00,
      remarks: 'VERY SATISFACTORY',
      isPublished: true,
      submittedById: teacherUser1.id,
    },
  });
  console.log(`✅ Grades created for enrolled subjects`);

  // 14. Parent Transactions
  await prisma.parentTransaction.upsert({
    where: { referenceNo: 'TXN-2026-0001' },
    update: {},
    create: {
      tenantId: tenant.id,
      parentId: parent1.id,
      studentId: student1.id,
      referenceNo: 'TXN-2026-0001',
      title: '1st Quarter Tuition & Misc Fee',
      description: 'Tuition, library, laboratory, and student activity fees',
      amount: 15500.00,
      type: TransactionType.TUITION,
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.GCASH,
      paidAt: new Date('2026-08-10T10:30:00Z'),
      remarks: 'Official Receipt #OR-8921 issued',
    },
  });

  await prisma.parentTransaction.upsert({
    where: { referenceNo: 'TXN-2026-0002' },
    update: {},
    create: {
      tenantId: tenant.id,
      parentId: parent1.id,
      studentId: student1.id,
      referenceNo: 'TXN-2026-0002',
      title: 'RFID Student ID Card & Lanyard',
      description: 'Smart campus RFID badge with break-away lanyard',
      amount: 350.00,
      type: TransactionType.RFID_BADGE,
      status: PaymentStatus.COMPLETED,
      paymentMethod: PaymentMethod.CASH,
      paidAt: new Date('2026-08-05T09:15:00Z'),
      remarks: 'Card UID: E28068940000501234A1B2C1 issued',
    },
  });

  await prisma.parentTransaction.upsert({
    where: { referenceNo: 'TXN-2026-0003' },
    update: {},
    create: {
      tenantId: tenant.id,
      parentId: parent1.id,
      studentId: student1.id,
      referenceNo: 'TXN-2026-0003',
      title: '2nd Quarter Tuition Installment',
      description: 'Second quarterly installment for SY 2026-2027',
      amount: 14000.00,
      type: TransactionType.TUITION,
      status: PaymentStatus.PENDING,
      dueDate: new Date('2026-11-15'),
      remarks: 'Due on Nov 15, 2026',
    },
  });
  console.log(`✅ Parent transactions created`);

  // 15. RFID Devices & Attendance
  const rfidDevice = await prisma.rfidDevice.upsert({
    where: {
      tenantId_deviceId: {
        tenantId: tenant.id,
        deviceId: 'GATE-01',
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      deviceId: 'GATE-01',
      name: 'Main Entrance Turnstile',
      location: 'Gate 1 North Campus',
      apiKeyHash: await bcrypt.hash('rfid-secret-device-key-01', 10),
      status: DeviceStatus.ACTIVE,
      lastHeartbeatAt: new Date(),
    },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeIn = new Date();
  timeIn.setHours(7, 28, 0, 0);

  const timeOut = new Date();
  timeOut.setHours(16, 45, 0, 0);

  await prisma.attendance.upsert({
    where: {
      tenantId_studentId_date: {
        tenantId: tenant.id,
        studentId: student1.id,
        date: today,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      studentId: student1.id,
      deviceId: rfidDevice.id,
      date: today,
      timeIn: timeIn,
      timeOut: timeOut,
      status: AttendanceStatus.PRESENT,
      remarks: 'On time tap in at Gate 1',
    },
  });
  console.log(`✅ RFID Device & Attendance seeded`);

  console.log('🎉 Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
