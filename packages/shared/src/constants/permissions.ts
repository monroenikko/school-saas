import { Role } from '../enums/roles';

export const PERMISSIONS = {
  // Students
  STUDENTS_READ: 'students:read',
  STUDENTS_CREATE: 'students:create',
  STUDENTS_UPDATE: 'students:update',
  STUDENTS_DELETE: 'students:delete',

  // Teachers
  TEACHERS_READ: 'teachers:read',
  TEACHERS_CREATE: 'teachers:create',
  TEACHERS_UPDATE: 'teachers:update',
  TEACHERS_DELETE: 'teachers:delete',

  // Attendance
  ATTENDANCE_READ: 'attendance:read',
  ATTENDANCE_CREATE: 'attendance:create',
  ATTENDANCE_UPDATE: 'attendance:update',

  // Sections
  SECTIONS_READ: 'sections:read',
  SECTIONS_CREATE: 'sections:create',
  SECTIONS_UPDATE: 'sections:update',
  SECTIONS_DELETE: 'sections:delete',

  // Subjects & Classes
  SUBJECTS_READ: 'subjects:read',
  SUBJECTS_CREATE: 'subjects:create',
  SUBJECTS_UPDATE: 'subjects:update',
  SUBJECTS_DELETE: 'subjects:delete',

  // Grades
  GRADES_READ: 'grades:read',
  GRADES_CREATE: 'grades:create',
  GRADES_UPDATE: 'grades:update',

  // RFID Devices
  DEVICES_READ: 'devices:read',
  DEVICES_CREATE: 'devices:create',
  DEVICES_UPDATE: 'devices:update',
  DEVICES_DELETE: 'devices:delete',

  // Settings & Users
  USERS_READ: 'users:read',
  USERS_MANAGE: 'users:manage',
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',

  // Transactions
  TRANSACTIONS_READ: 'transactions:read',
  TRANSACTIONS_MANAGE: 'transactions:manage',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const DEFAULT_ROLE_PERMISSIONS: Record<Role, string[]> = {
  [Role.SUPER_ADMIN]: ['*'],
  [Role.SCHOOL_ADMIN]: [
    'students:read', 'students:create', 'students:update', 'students:delete',
    'teachers:read', 'teachers:create', 'teachers:update', 'teachers:delete',
    'attendance:read', 'attendance:create', 'attendance:update',
    'sections:read', 'sections:create', 'sections:update', 'sections:delete',
    'subjects:read', 'subjects:create', 'subjects:update', 'subjects:delete',
    'grades:read', 'grades:create', 'grades:update',
    'devices:read', 'devices:create', 'devices:update', 'devices:delete',
    'users:read', 'users:manage', 'settings:read', 'settings:update',
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
