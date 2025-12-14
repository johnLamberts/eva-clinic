import { z } from 'zod';

const common = {
  id: z.number().int().positive(),
  idParam: z.object({ id: z.string().regex(/^\d+$/) }),
  
  // YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  
  // HH:MM:SS
  time: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, 'Time must be HH:MM:SS'),
  
  duration: z.number().int().min(15).max(480),
  
  pagination: {
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  },

  // Enums shared across multiple endpoints
  appointmentTypes: z.enum([
    'checkup', 'cleaning', 'filling', 'extraction', 'root_canal', 
    'crown', 'emergency', 'consultation', 'follow_up', 'other'
  ]),

  appointmentStatus: z.enum([
    'scheduled', 'confirmed', 'checked_in', 'in_progress', 
    'completed', 'cancelled', 'no_show', 'rescheduled'
  ]),
};

// ---------------------------------------------------------
// 🟢 APPOINTMENT SCHEMAS
// ---------------------------------------------------------

export const createAppointmentSchema = z.object({
  body: z.object({
    patient_id: common.id,
    dentist_id: common.id,
    appointment_date: common.date,
    start_time: common.time,
    duration: common.duration,
    appointment_type: common.appointmentTypes,
    reason: z.string().max(500).optional(),
    notes: z.string().optional(),
  }),
});

export const updateAppointmentSchema = z.object({
  params: common.idParam,
  body: z.object({
    dentist_id: common.id.optional(),
    appointment_date: common.date.optional(),
    start_time: common.time.optional(),
    duration: common.duration.optional(),
    appointment_type: common.appointmentTypes.optional(),
    status: common.appointmentStatus.optional(),
    reason: z.string().max(500).optional(),
    notes: z.string().optional(),
    treatment_plan: z.string().optional(),
  }),
});

export const cancelAppointmentSchema = z.object({
  params: common.idParam,
  body: z.object({
    reason: z.string().min(1).max(500),
  }),
});

export const getAppointmentSchema = z.object({
  params: common.idParam,
});


export const availabilitySlotsSchema = z.object({
  body: z.object({
    dentist_id: common.id,
    date: common.date,
    duration: common.duration,
  }),
});

export const createRecurringAppointmentSchema = z.object({
  body: z.object({
    patient_id: common.id,
    dentist_id: common.id,
    recurrence_pattern: z.enum(['daily', 'weekly', 'biweekly', 'monthly', 'custom']),
    recurrence_interval: z.number().int().min(1).optional(),
    
    // Pattern details
    day_of_week: z.string().optional(),
    day_of_month: z.number().int().min(1).max(31).optional(),
    
    // Timing
    start_time: common.time,
    duration: common.duration,
    start_date: common.date,
    end_date: common.date.optional(),
    max_occurrences: z.number().int().min(1).max(100).optional(),
    
    appointment_type: common.appointmentTypes,
    reason: z.string().max(500).optional(),
  }),
});

export const createWaitlistEntrySchema = z.object({
  body: z.object({
    patient_id: common.id,
    dentist_id: common.id.optional(),
    
    // Flexible preferences
    preferred_date: common.date.optional(),
    preferred_time_start: common.time.optional(),
    preferred_time_end: common.time.optional(),
    
    appointment_type: common.appointmentTypes,
    reason: z.string().max(500).optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  }),
});


export const listAppointmentsSchema = z.object({
  query: z.object({
    page: common.pagination.page,
    limit: common.pagination.limit,
    
    // IDs (Transformed from string query params to numbers)
    dentist_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    patient_id: z.string().regex(/^\d+$/).transform(Number).optional(),
    
    status: common.appointmentStatus.optional(),
    appointment_type: common.appointmentTypes.optional(),
    
    date_from: common.date.optional(),
    date_to: common.date.optional(),
  }),
});

export const monthAvailabilitySchema = z.object({
  query: z.object({
    dentist_id: z.string().regex(/^\d+$/).transform(Number),
    year: z.string().regex(/^\d{4}$/).transform(Number),
    month: z.string().regex(/^(0?[1-9]|1[0-2])$/).transform(Number), // 1-12
  }),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>;
export type CancelAppointmentInput = z.infer<typeof cancelAppointmentSchema>;
export type AvailabilitySlotsInput = z.infer<typeof availabilitySlotsSchema>;
export type CreateRecurringAppointmentInput = z.infer<typeof createRecurringAppointmentSchema>;
export type CreateWaitlistEntryInput = z.infer<typeof createWaitlistEntrySchema>;
export type ListAppointmentsInput = z.infer<typeof listAppointmentsSchema>;
export type MonthAvailabilityInput = z.infer<typeof monthAvailabilitySchema>;
