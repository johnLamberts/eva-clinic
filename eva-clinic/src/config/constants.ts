export const APP_NAME = 'Dental Clinic MIS';
export const APP_VERSION = '1.0.0';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    RESET_PASSWORD: '/auth/reset-password',
  },
  USERS: {
    BASE: '/users',
    BY_ID: (id: string) => `/users/${id}`,
    PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password'
  },
  PATIENTS: {
    BASE: '/patients',
    BY_ID: (id: string) => `/patiets/${id}`,
    MEDICAL_HISTORY: (id: string) => `/patients/${id}/medical-history`,
    DENTAL_RECORDS: (id: string) => `/patients/${id}/dental-records`,
  },
   APPOINTMENTS: {
    BASE: '/appointments',
    BY_ID: (id: string) => `/appointments/${id}`,
    SCHEDULE: '/appointments/schedule',
    AVAILABLE_SLOTS: '/appointments/available-slots',
    CANCEL: (id: string) => `/appointments/${id}/cancel`,
    RESCHEDULE: (id: string) => `/appointments/${id}/reschedule`,
  },
  ROLES: {
    BASE: '/roles',
    BY_ID: (id: string) => `/roles/${id}`,
    PERMISSIONS: '/roles/permissions',
  },
} as const

export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date Formats
export const DATE_FORMAT = 'MMM dd, yyyy';
export const DATE_TIME_FORMAT = 'MMM dd, yyyy hh:mm a';
export const TIME_FORMAT = 'hh:mm a';

// TOAST Duration
export const TOAST_DURATION = 3000;

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'],
  },
  USERS: {
    ALL: ['users'],
    BY_ID: (id: string) => ['users', id],
    PROFILE: ['users', 'profile'],
  },
  PATIENTS: {
    ALL: ['patients'],
    BY_ID: (id: string) => ['patients', id],
    MEDICAL_HISTORY: (id: string) => ['patients', id, 'medical-history'],
    DENTAL_RECORDS: (id: string) => ['patients', id, 'dental-records'],
  },
  APPOINTMENTS: {
    ALL: ['appointments'],
    BY_ID: (id: string) => ['appointments', id],
    SCHEDULE: ['appointments', 'schedule'],
    AVAILABLE_SLOTS: ['appointments', 'available-slots'],
  },
  ROLES: {
    ALL: ['roles'],
    BY_ID: (id: string) => ['roles', id],
    PERMISSIONS: ['roles', 'permissions'],
  },
} as const;

// Permissions
export const PERMISSIONS = {
  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Patients
  PATIENTS_VIEW: 'patients.view',
  PATIENTS_CREATE: 'patients.create',
  PATIENTS_EDIT: 'patients.edit',
  PATIENTS_DELETE: 'patients.delete',
  
  // Appointments
  APPOINTMENTS_VIEW: 'appointments.view',
  APPOINTMENTS_CREATE: 'appointments.create',
  APPOINTMENTS_EDIT: 'appointments.edit',
  APPOINTMENTS_DELETE: 'appointments.delete',
  APPOINTMENTS_CANCEL: 'appointments.cancel',
  
  // Roles
  ROLES_VIEW: 'roles.view',
  ROLES_CREATE: 'roles.create',
  ROLES_EDIT: 'roles.edit',
  ROLES_DELETE: 'roles.delete',
  
  // System
  SYSTEM_SETTINGS: 'system.settings',
  AUDIT_LOGS_VIEW: 'audit.logs.view',
} as const;

// Roles
export const ROLES = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DENTIST: 'Dentist',
  RECEPTIONIST: 'Receptionist',
  NURSE: 'Nurse',
} as const;

// Appointment statuses
export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  CONFIRMED: 'confirmed',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
} as const;

// Patient status
export const PATIENT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  ARCHIVED: 'archived',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  VALIDATION: 'Please check your input and try again.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  CREATED: 'Created successfully',
  UPDATED: 'Updated successfully',
  DELETED: 'Deleted successfully',
  SAVED: 'Saved successfully',
} as const;
