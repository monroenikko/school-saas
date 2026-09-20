export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  TRANSFERRED = 'TRANSFERRED',
  GRADUATED = 'GRADUATED',
  DROPPED = 'DROPPED',
}

export enum TeacherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  ABSENT = 'ABSENT',
  EXCUSED = 'EXCUSED',
}

export enum ScanType {
  TIME_IN = 'TIME_IN',
  TIME_OUT = 'TIME_OUT',
}

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OFFLINE = 'OFFLINE',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export enum ParentRelationship {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  GUARDIAN = 'GUARDIAN',
  OTHER = 'OTHER',
}

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export enum EnrollmentStatus {
  ENROLLED = 'ENROLLED',
  DROPPED = 'DROPPED',
  COMPLETED = 'COMPLETED',
}

export enum GradingPeriod {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4',
  PRELIM = 'PRELIM',
  MIDTERM = 'MIDTERM',
  SEMI_FINALS = 'SEMI_FINALS',
  FINALS = 'FINALS',
}

export enum TransactionType {
  TUITION = 'TUITION',
  RFID_BADGE = 'RFID_BADGE',
  MISCELLANEOUS = 'MISCELLANEOUS',
  BOOKS = 'BOOKS',
  UNIFORM = 'UNIFORM',
  EXAM_FEE = 'EXAM_FEE',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  GCASH = 'GCASH',
  MAYA = 'MAYA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

export enum NotificationType {
  ATTENDANCE_TAP = 'ATTENDANCE_TAP',
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  PAYMENT = 'PAYMENT',
  SYSTEM = 'SYSTEM',
}

export enum NotificationStatus {
  QUEUED = 'QUEUED',
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
}

export enum NotificationChannel {
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
  EMAIL = 'EMAIL',
}
