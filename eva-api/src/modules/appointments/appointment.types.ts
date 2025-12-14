import { BaseEntity } from "~/orm/base-repository.orm";

export interface Appointment extends BaseEntity {
  id: number;
  appointment_number: string;
  patient_id: number;
  dentist_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  duration: number;
  appointment_type: AppointmentType;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  treatment_plan?: string;
  reminder_sent: boolean;
  reminder_sent_at?: string;
  confirmation_sent: boolean;
  confirmation_sent_at?: string;
  cancelled_at?: string;
  cancelled_by?: number;
  cancellation_reason?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
}

export enum AppointmentType {
  CHECKUP = 'checkup',
  CLEANING = 'cleaning',
  FILLING = 'filling',
  EXTRACTION = 'extraction',
  ROOT_CANAL = 'root_canal',
  CROWN = 'crown',
  EMERGENCY = 'emergency',
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  OTHER = 'other',
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CHECKED_IN = 'checked_in',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
  RESCHEDULED = 'rescheduled',
}

export interface DentistSchedule extends BaseEntity {
  id: number;
  dentist_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

export interface DentistTimeOff extends BaseEntity {
  id: number;
  dentist_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  is_all_day: boolean;
  created_at: string;
  created_by?: number;
}

export interface RecurringAppointment extends BaseEntity {
  id: number;
  patient_id: number;
  dentist_id: number;
  recurrence_pattern: RecurrencePattern;
  recurrence_interval: number;
  day_of_week?: string;
  day_of_month?: number;
  start_time: string;
  duration: number;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  appointment_type: string;
  reason?: string;
  is_active: boolean;
  created_at: string;
  created_by?: number;
}

export enum RecurrencePattern {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  BIWEEKLY = 'biweekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom',
}

export interface AppointmentWaitlist extends BaseEntity {
  id: number;
  patient_id: number;
  dentist_id?: number;
  preferred_date?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  appointment_type: string;
  reason?: string;
  priority: WaitlistPriority;
  status: WaitlistStatus;
  contacted_at?: string;
  scheduled_appointment_id?: number;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export enum WaitlistPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum WaitlistStatus {
  WAITING = 'waiting',
  CONTACTED = 'contacted',
  SCHEDULED = 'scheduled',
  EXPIRED = 'expired',
}

// DTOs
export interface CreateAppointmentDto {
  patient_id: number;
  dentist_id: number;
  appointment_date: string;
  start_time: string;
  duration: number;
  appointment_type: AppointmentType;
  reason?: string;
  notes?: string;
}

export interface UpdateAppointmentDto {
  dentist_id?: number;
  appointment_date?: string;
  start_time?: string;
  end_time?: string;
  duration?: number;
  appointment_type?: AppointmentType;
  status?: AppointmentStatus;
  reason?: string;
  notes?: string;
  treatment_plan?: string;
}

export interface CreateRecurringAppointmentDto {
  patient_id: number;
  dentist_id: number;
  recurrence_pattern: RecurrencePattern;
  recurrence_interval?: number;
  day_of_week?: string;
  day_of_month?: number;
  start_time: string;
  duration: number;
  start_date: string;
  end_date?: string;
  max_occurrences?: number;
  appointment_type: AppointmentType;
  reason?: string;
}

export interface CreateWaitlistEntryDto {
  patient_id: number;
  dentist_id?: number;
  preferred_date?: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  appointment_type: AppointmentType;
  reason?: string;
  priority?: WaitlistPriority;
}

export interface CreateDentistScheduleDto {
  dentist_id: number;
  day_of_week: DayOfWeek;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
}

export interface CreateTimeOffDto {
  dentist_id: number;
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  is_all_day?: boolean;
}

export interface AppointmentFilters {
  dentist_id?: number;
  patient_id?: number;
  status?: AppointmentStatus;
  appointment_type?: AppointmentType;
  date_from?: string;
  date_to?: string;
}

export interface TimeSlot {
  start_time: string;
  end_time: string;
  available: boolean;
  conflicting_appointment_id?: number;
}

export interface AvailabilityRequest {
  dentist_id: number;
  date: string;
  duration: number;
}

export interface AppointmentResponse extends Appointment {
  patient_name: string;
  patient_phone: string;
  dentist_name: string;
  can_cancel: boolean;
  can_reschedule: boolean;
}

export interface AppointmentStatistics {
  total: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  no_show: number;
  by_type: { [key: string]: number };
  by_dentist: { [key: string]: number };
  avg_duration: number;
  completion_rate: number;
}
