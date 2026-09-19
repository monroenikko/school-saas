---
name: school-saas-database
description: >-
  Best practices and conventions for PostgreSQL database design with Prisma ORM
  in the School SaaS project. Use when creating or modifying the Prisma schema,
  migrations, seed data, or any database query. Covers multi-tenant data modeling,
  indexing strategy, schema conventions, migration workflow, and query optimization.
---

# PostgreSQL + Prisma — Best Practices & Conventions

## Prisma Schema Conventions

### File Location
```
prisma/
├── schema.prisma          # Single schema file
├── migrations/            # Auto-generated migrations
└── seed.ts                # Seed data
```

### Naming Rules

| Item | Convention | Example |
|------|-----------|---------|
| Model names | PascalCase, singular | `Student`, `AcademicYear` |
| Table names | snake_case, plural (via `@@map`) | `students`, `academic_years` |
| Column names | camelCase in Prisma, snake_case in DB | `firstName` → `first_name` |
| Foreign keys | `<relation>Id` | `tenantId`, `sectionId` |
| Enums | PascalCase | `StudentStatus`, `Role` |
| Enum values | UPPER_SNAKE | `ACTIVE`, `SCHOOL_ADMIN` |

### Model Template
```prisma
model Student {
  id            String        @id @default(uuid()) @map("id")
  tenantId      String        @map("tenant_id")
  studentId     String        @map("student_id")
  firstName     String        @map("first_name")
  lastName      String        @map("last_name")
  status        StudentStatus @default(ACTIVE)
  createdAt     DateTime      @default(now()) @map("created_at")
  updatedAt     DateTime      @updatedAt @map("updated_at")

  // Relations
  tenant        Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  section       Section?      @relation(fields: [sectionId], references: [id])
  attendances   Attendance[]

  // Indexes
  @@index([tenantId])
  @@index([tenantId, studentId])
  @@index([tenantId, sectionId])
  @@unique([tenantId, studentId])
  @@map("students")
}
```

## Multi-Tenancy Rules

### CRITICAL: Every tenant-scoped table MUST have
1. A `tenantId` column with a foreign key to `Tenant`
2. An `@@index([tenantId])` for query performance
3. Unique constraints scoped to tenant: `@@unique([tenantId, studentId])`

### Tables that are NOT tenant-scoped
- `Tenant` itself (the root entity)
- `User` with `role = SUPER_ADMIN` (tenantId is null)

### Tables that ARE tenant-scoped (always include tenantId)
- `Student`, `Teacher`, `Section`, `Subject`, `SubjectAssignment`
- `AcademicYear`, `Attendance`, `RfidDevice`, `RfidEvent`
- `User` (when role != SUPER_ADMIN)

## Indexing Strategy

### Always Index
```prisma
@@index([tenantId])                    // Every tenant-scoped table
@@index([tenantId, status])            // Filtered queries
@@index([tenantId, createdAt])         // Sorted by date
```

### Attendance-Specific Indexes
```prisma
@@index([tenantId, studentId, date])   // Student attendance lookup
@@index([tenantId, date, status])      // Daily attendance report
@@index([tenantId, date])              // Dashboard queries
```

### RFID Indexes
```prisma
@@index([cardUid])                     // Quick card lookup on scan
@@unique([deviceId])                   // Device unique identification
```

## Migration Workflow

```bash
# After changing schema.prisma:
npx prisma migrate dev --name <descriptive-name>

# Naming convention for migrations:
# add_students_table
# add_rfid_card_uid_to_students
# create_attendance_indexes
# add_academic_year_relation

# Generate Prisma Client after schema changes:
npx prisma generate

# View current migration status:
npx prisma migrate status

# Reset database (dev only):
npx prisma migrate reset

# Seed database:
npx prisma db seed
```

## Seed Data

The seed file (`prisma/seed.ts`) should create:
1. **Super Admin** user (platform owner)
2. **Demo Tenant** (sample school for development)
3. **Demo Users** (school admin, teacher, registrar)
4. **Sample Students** (10-20 students with sections)
5. **Sample Sections** (Grade 7-A, Grade 7-B, etc.)
6. **Sample Subjects** (Math, Science, English, Filipino, etc.)
7. **Sample RFID Device** (for testing)

```typescript
// seed.ts
async function main() {
  // 1. Create super admin
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@schoolsaas.com' },
    create: {
      email: 'admin@schoolsaas.com',
      password: await hash('password123', 12),
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
    },
    update: {},
  });

  // 2. Create demo school
  const demoSchool = await prisma.tenant.upsert({
    where: { slug: 'demo-academy' },
    create: {
      name: 'Demo Academy',
      slug: 'demo-academy',
      status: 'ACTIVE',
      plan: 'PREMIUM',
    },
    update: {},
  });

  // ... more seed data
}
```

## Query Patterns

### Always scope by tenantId
```typescript
// ✅ CORRECT
this.prisma.student.findMany({
  where: { tenantId, status: 'ACTIVE' },
});

// ❌ WRONG — missing tenantId
this.prisma.student.findMany({
  where: { status: 'ACTIVE' },
});
```

### Use transactions for multi-table operations
```typescript
await this.prisma.$transaction(async (tx) => {
  const student = await tx.student.create({ data: { ... } });
  await tx.attendance.create({ data: { studentId: student.id, ... } });
  return student;
});
```

### Use select/include wisely
```typescript
// Only fetch needed fields for list views
this.prisma.student.findMany({
  where: { tenantId },
  select: {
    id: true,
    firstName: true,
    lastName: true,
    studentId: true,
    section: { select: { name: true } },
    status: true,
  },
});
```

## Soft Delete Convention

- Use a `status` enum field instead of deleting records
- Archive: `status = 'ARCHIVED'`
- Default queries filter for `status != 'ARCHIVED'`
- Never use `prisma.model.delete()` for business entities

## Date/Time Handling

- Store all timestamps in UTC (`@default(now())`)
- Use `DateTime` for timestamps, `@db.Date` for date-only fields
- Convert to user's timezone on the frontend
- Attendance `date` field uses `@db.Date` (no time component)
- Attendance `timeIn`/`timeOut` use full `DateTime`
