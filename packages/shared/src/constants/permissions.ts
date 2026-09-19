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

  // RFID Devices
  DEVICES_READ: 'devices:read',
  DEVICES_CREATE: 'devices:create',
  DEVICES_UPDATE: 'devices:update',
  DEVICES_DELETE: 'devices:delete',

  // Settings
  SETTINGS_READ: 'settings:read',
  SETTINGS_UPDATE: 'settings:update',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
