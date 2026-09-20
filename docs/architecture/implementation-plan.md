# 🏫 School SaaS Platform — Full Implementation Plan

> **Reference Document** — Created 2026-09-19
> This document captures the complete architecture and phased roadmap for the School SaaS platform.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 16 (App Router) + React 19 + TypeScript + TailwindCSS v4 (**Light Theme by default**) |
| **Backend** | Node.js + NestJS + TypeScript |
| **API Docs** | Swagger / OpenAPI 3.0 (`/api/docs`) with Bearer Auth & Interactive UI |
| **Database** | PostgreSQL 16 + Prisma ORM |
| **Cache/Queue** | Redis 7 + BullMQ |
| **Auth** | JWT (Access + Refresh tokens, HttpOnly cookies) |
| **Monorepo** | Turborepo |
| **Containerization** | Docker + Docker Compose |
| **Mobile** (Phase 2+) | Flutter |
| **RFID Agent** (Phase 2+) | Python + PyInstaller + Inno Setup |

---

## Multi-Tenancy Strategy

- **Approach**: Shared database with `tenant_id` column on every school-scoped table
- **Isolation**: NestJS middleware extracts `tenant_id` from JWT, guards enforce scoping
- **Database**: PostgreSQL Row-Level Security (RLS) as additional safety layer
- **Tenant Hierarchy**: Platform → Tenant/School → Campus → Academic Year → Department → Users → Students

---

## RBAC Permissions Model & Administrative Architecture

### Administrative Roles & Scoping

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SUPER_ADMIN (Platform)                           │
│  • Full control of the entire SaaS platform across all schools             │
│  • Tenant provisioning, subscription plans, platform billing & health       │
│  • Cross-tenant global analytics & optional tenant impersonation            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐     ┌───────────────────────────────┐
│   SCHOOL_ADMIN (School A)     │     │   SCHOOL_ADMIN (School B)     │
│ • Full control of School A    │     │ • Full control of School B    │
│ • ALL modules for tenant A    │     │ • ALL modules for tenant B    │
│ • Full Transaction & Billing  │     │ • Full Transaction & Billing  │
│ • Strict isolation from B     │     │ • Strict isolation from A     │
└───────────────┬───────────────┘     └───────────────┬───────────────┘
                │                                     │
    ┌───────────┴───────────┐             ┌───────────┴───────────┐
    ▼                       ▼             ▼                       ▼
 TEACHER                 REGISTRAR     TEACHER                 REGISTRAR
(Assigned sections)     (Admissions)  (Assigned sections)     (Admissions)
```

### Roles Breakdown

| Role | Scope | Authority & Module Permissions |
|------|-------|--------------------------------|
| **`SUPER_ADMIN`** | Platform Root (`tenant_id = null`) | **Controls the whole SaaS platform.**<br>• Full access across all tenants with `*` permissions.<br>• Manages schools/tenants (create, update, suspend, plan tiers).<br>• Platform analytics, global audit logs, system-level settings.<br>• Bypasses tenant guards; can specify `x-tenant-id` for school inspection. |
| **`SCHOOL_ADMIN`** | Tenant Scoped (`tenant_id = school_id`) | **Every school/tenant has its own dedicated admin.**<br>• **Full authority over ALL modules for their tenant**.<br>• **Transaction & Billing Control**: Full access to parent billing, tuition records, RFID card fees, payment receipts (GCash/Cash), and invoice statuses.<br>• Full CRUD on Students, Teachers, Sections, Subjects, Schedules, RFID Gate Turnstiles, Grades, Staff, and School Settings.<br>• **Strictly isolated**: zero access to any other school's data. |
| **`REGISTRAR`** | Tenant Scoped | Manages student admissions, enrollments, section assignments, and academic records. |
| **`TEACHER`** | Tenant Scoped | Views assigned sections/students, records attendance, inputs grades, views teaching schedules. |
| **`STAFF`** | Tenant Scoped | Front-desk operations, manual attendance logging, basic parent transaction collection. |
| **`PARENT`** (Phase 2) | Tenant Scoped | Mobile/Web portal: views own child's attendance taps, report cards, and billing balances. |
| **`STUDENT`** (Phase 2) | Tenant Scoped | Portal: views own schedule, grades, and attendance history. |

### Module Permissions Mapping

```typescript
// Defined in packages/shared/src/constants/permissions.ts
export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: ['*'], // Controls entire SaaS platform
  [Role.SCHOOL_ADMIN]: [
    // Full access to ALL modules for the tenant:
    'students:read', 'students:create', 'students:update', 'students:delete',
    'teachers:read', 'teachers:create', 'teachers:update', 'teachers:delete',
    'attendance:read', 'attendance:create', 'attendance:update',
    'sections:read', 'sections:create', 'sections:update', 'sections:delete',
    'subjects:read', 'subjects:create', 'subjects:update', 'subjects:delete',
    'grades:read', 'grades:create', 'grades:update',
    'devices:read', 'devices:create', 'devices:update', 'devices:delete',
    'users:read', 'users:manage', 'settings:read', 'settings:update',
    // Full Transaction & Financial Visibility:
    'transactions:read', 'transactions:manage',
  ],
  [Role.STAFF]: [
    'students:read', 'students:create', 'students:update',
    'teachers:read',
    'sections:read',
    'attendance:read', 'attendance:create', 'attendance:update',
    'transactions:read', 'transactions:manage',
  ],
  [Role.TEACHER]: [
    'students:read',
    'sections:read',
    'subjects:read',
    'grades:read', 'grades:create', 'grades:update',
    'attendance:read', 'attendance:create',
  ],
  [Role.STUDENT]: [
    'attendance:read',
    'grades:read',
    'sections:read',
    'subjects:read',
  ],
  [Role.PARENT]: [
    'attendance:read',
    'grades:read',
    'transactions:read',
  ],
};
```

---

## Project Structure

```
saas/
├── apps/
│   ├── web/                    # Next.js 15 frontend
│   │   ├── app/
│   │   │   ├── (auth)/         # Login, register, forgot password
│   │   │   ├── (dashboard)/    # Protected dashboard routes
│   │   │   │   ├── overview/
│   │   │   │   ├── students/
│   │   │   │   ├── teachers/
│   │   │   │   ├── sections/
│   │   │   │   ├── subjects/
│   │   │   │   ├── attendance/
│   │   │   │   ├── rfid-devices/
│   │   │   │   ├── users/
│   │   │   │   └── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── ui/             # Reusable UI (Button, Modal, Table, etc.)
│   │   │   ├── layout/         # Sidebar, Header, Breadcrumbs
│   │   │   └── forms/          # Form components
│   │   ├── lib/                # API client, auth helpers, utils
│   │   ├── hooks/              # Custom React hooks
│   │   └── types/
│   │
│   └── api/                    # NestJS backend
│       └── src/
│           ├── auth/
│           ├── users/
│           ├── tenants/
│           ├── students/
│           ├── teachers/
│           ├── sections/
│           ├── subjects/
│           ├── attendance/
│           ├── rfid/
│           ├── notifications/
│           ├── common/
│           │   ├── guards/
│           │   ├── decorators/
│           │   ├── interceptors/
│           │   └── pipes/
│           ├── database/
│           └── config/
│
├── packages/
│   └── shared/                 # Shared types, enums, constants
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── nginx.conf              # Reverse proxy (production)
│
├── docker-compose.yml          # Dev: PostgreSQL + Redis
├── docker-compose.prod.yml     # Prod: Full stack
├── turbo.json
├── package.json
├── .env.example
└── README.md
```

---

## Database Schema (Core Tables)

### Tenant (School)
```
tenants: id, name, slug, logo, address, contact_email, contact_phone, status, plan, settings(jsonb), created_at, updated_at
```

### Users & Auth
```
users: id, tenant_id, email, password, first_name, last_name, role, permissions[], avatar, is_active, last_login_at, created_at, updated_at
refresh_tokens: id, user_id, token, expires_at, created_at
```

### Students
```
students: id, tenant_id, student_id, first_name, last_name, middle_name, date_of_birth, gender, address, contact_number, guardian_name, guardian_phone, guardian_email, rfid_card_uid, section_id, photo, status, enrolled_at, created_at, updated_at
```

### Teachers
```
teachers: id, tenant_id, employee_id, first_name, last_name, email, contact_number, department, specialization, user_id, status, created_at, updated_at
```

### Academic Structure
```
academic_years: id, tenant_id, name, start_date, end_date, is_current, created_at
sections: id, tenant_id, academic_year_id, name, grade_level, adviser_id(teacher), capacity, created_at, updated_at
subjects: id, tenant_id, name, code, description, created_at, updated_at
subject_assignments: id, tenant_id, subject_id, section_id, teacher_id, schedule(jsonb), created_at
```

### RFID & Attendance
```
rfid_devices: id, tenant_id, device_id, device_secret, name, location, status, last_seen_at, created_at
rfid_events: id, tenant_id, device_id, card_uid, scanned_at, processed, created_at
attendances: id, tenant_id, student_id, rfid_device_id, date, time_in, time_out, status, remarks, created_at
```

---

## API Endpoints (Phase 1)

### Auth
```
POST   /api/auth/register          # Register school (creates tenant + admin)
POST   /api/auth/login             # Login
POST   /api/auth/refresh           # Refresh access token
POST   /api/auth/logout            # Logout
GET    /api/auth/me                # Current user profile
```

### Students
```
GET    /api/students               # List (paginated, filterable)
POST   /api/students               # Create
GET    /api/students/:id           # Detail
PATCH  /api/students/:id           # Update
DELETE /api/students/:id           # Soft delete
POST   /api/students/import        # Bulk CSV import
```

### Teachers
```
GET    /api/teachers               # List
POST   /api/teachers               # Create
GET    /api/teachers/:id           # Detail
PATCH  /api/teachers/:id           # Update
DELETE /api/teachers/:id           # Soft delete
```

### Sections
```
GET    /api/sections               # List
POST   /api/sections               # Create
GET    /api/sections/:id           # Detail + students
PATCH  /api/sections/:id           # Update
DELETE /api/sections/:id           # Delete
POST   /api/sections/:id/students  # Assign students
```

### Subjects
```
GET    /api/subjects               # List
POST   /api/subjects               # Create
PATCH  /api/subjects/:id           # Update
DELETE /api/subjects/:id           # Delete
POST   /api/subject-assignments    # Assign teacher to subject+section
```

### Attendance
```
GET    /api/attendance             # List (filterable by date, section, student)
GET    /api/attendance/dashboard   # Today's stats
POST   /api/attendance/manual      # Manual entry
GET    /api/attendance/report      # Summary report
```

### RFID
```
POST   /api/rfid/devices           # Register device
GET    /api/rfid/devices           # List devices
PATCH  /api/rfid/devices/:id       # Update/revoke device
POST   /api/rfid/events            # Receive scan event (from Agent)
```

### Tenants (Super Admin)
```
GET    /api/tenants                # List all schools
POST   /api/tenants                # Create school
GET    /api/tenants/:id            # School detail
PATCH  /api/tenants/:id            # Update school
```

### Users
```
GET    /api/users                  # List staff users
POST   /api/users                  # Create user
PATCH  /api/users/:id              # Update user
DELETE /api/users/:id              # Deactivate user
```

---

## Testing Architecture & Conventions

### Strict Test File Isolation
Every feature module (backend) and component/feature group (frontend) MUST have its own dedicated `test/` directory. Test files must **NEVER** be mixed directly alongside implementation code:

- **Backend (`apps/api/src/<module>/test/`)**:
  - `apps/api/src/<module>/test/<module>.service.spec.ts` (business logic, 100% tenant isolation with mock Prisma)
  - `apps/api/src/<module>/test/<module>.controller.spec.ts` (envelope format, status codes)
  - `apps/api/src/test/app.controller.spec.ts` (root-level tests)
- **Frontend (`apps/web/src/components/<group>/test/` or `apps/web/src/app/<route>/test/`)**:
  - `apps/web/src/components/dashboard/test/header.spec.tsx` (Vitest + React Testing Library)
  - `apps/web/src/components/ui/test/button.spec.tsx`
- **Monorepo Execution**: Run all tests via `npm run test` (Turborepo pipeline).

---

## RFID Architecture

```
STUDENT → taps card → RFID READER → USB → RFID AGENT (Python, Windows PC)
    → HTTPS → NestJS API → PostgreSQL → Attendance Record
    → BullMQ Queue → Notification Worker → Parent Push Notification

Offline flow:
    RFID → Agent → Internet down → Local SQLite → Internet restored → Auto-sync → API
```

### RFID Agent Structure (Python — Phase 2)
```
rfid-agent/
├── reader/          # USB/PCSCard hardware communication
├── api/             # HTTPS client to NestJS backend
├── storage/         # SQLite offline queue
├── sync/            # Auto-sync when online
├── auth/            # Device credentials
├── monitoring/      # Health checks
└── main.py
```

---

## Phased Roadmap

### Phase 1 — Foundation & Core (Current)
- [x] Architecture & planning
- [ ] Docker setup (PostgreSQL, Redis)
- [ ] Turborepo monorepo scaffold
- [ ] NestJS backend with auth + multi-tenancy
- [ ] Prisma schema + migrations
- [ ] Students, Teachers, Sections, Subjects CRUD
- [ ] RFID device registration + scan event API
- [ ] Attendance recording + dashboard
- [ ] Next.js frontend with TailwindCSS
- [ ] Login/Register pages
- [ ] Dashboard with data tables & forms

### Phase 2 — Communication & Grades
- [ ] Grades module
- [ ] Schedule management
- [ ] Announcements & notifications
- [ ] Parent accounts
- [ ] Mobile app (Flutter)

### Phase 3 — Operations
- [ ] Enrollment workflow
- [ ] Finance & payments
- [ ] Library management
- [ ] Reports & document generation

### Phase 4 — Advanced
- [ ] AI assistant & reports
- [ ] Predictive attendance
- [ ] Online enrollment portal
- [ ] Digital student ID
- [ ] QR/RFID hybrid
- [ ] Biometric integration

---

## Monetization Model
| Plan | Price | Features |
|------|-------|----------|
| Starter | ₱3,000/mo | Basic modules, up to 500 students |
| Standard | ₱7,000/mo | All modules, up to 2,000 students |
| Premium | ₱12,000+/mo | Unlimited, priority support, custom branding |
| RFID | Additional fee | Per-device pricing |
| Setup | One-time | Onboarding, training, data migration |
