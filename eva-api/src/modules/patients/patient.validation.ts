import { z } from 'zod';

// ---------------------------------------------------------
// 🛠️ SHARED VALIDATION PATTERNS (DRY)
// ---------------------------------------------------------
const common = {
  id: z.string().regex(/^\d+$/, 'ID must be a numeric string'),
  idParam: z.object({ id: z.string().regex(/^\d+$/) }),
  
  // Standard format: YYYY-MM-DD
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  
  // E.164 format or simple international
phone: z.string().regex(/^(\+?\d{1,15}|\d{7,15})$/, 'Invalid phone number format'),
  
  // Nullable/Optional text fields
  optionalString: z.string().trim().optional().or(z.literal('')),
  
  pagination: {
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
  }
};

const addressSchema = {
  address_line1: z.string().max(255).optional(),
  address_line2: common.optionalString,
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postal_code: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
};

const emergencyContactSchema = {
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: common.phone.optional().or(z.literal('')),
  emergency_contact_relationship: z.string().max(100).optional(),
};

// ---------------------------------------------------------
// 🟢 PATIENT SCHEMAS
// ---------------------------------------------------------

export const createPatientSchema = z.object({
  body: z.object({
    // Personal Info
    first_name: z.string().min(2).max(100).trim(),
    last_name: z.string().min(2).max(100).trim(),
    middle_name: common.optionalString,
    date_of_birth: common.date,
    gender: z.enum(['male', 'female', 'other']),
    blood_type: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']).optional(),
    
    // Contact Info
    email: z.string().email().optional().or(z.literal('')),
    phone: common.phone,
    alternate_phone: common.phone.optional().or(z.literal('')),
    
    // Location & Emergency
    ...addressSchema,
    ...emergencyContactSchema,

    // Medical Details
    allergies: z.string().optional(),
    medical_conditions: z.string().optional(),
    current_medications: z.string().optional(),
    insurance_provider: z.string().max(200).optional(),
    insurance_policy_number: z.string().max(100).optional(),
    notes: z.string().optional(),
  }),
});

export const updatePatientSchema = z.object({
  params: common.idParam,
  body: createPatientSchema.shape.body.partial().extend({
    status: z.enum(['active', 'inactive', 'archived']).optional(),
  }),
});

export const listPatientsSchema = z.object({
  query: z.object({
    page: common.pagination.page,
    limit: common.pagination.limit,
    status: z.enum(['active', 'inactive', 'archived']).optional(),
    gender: z.enum(['male', 'female', 'other']).optional(),
    search: z.string().trim().optional(),
    
    // Transform 'min_age' (URL) -> 'minAge' (Service Interface)
    min_age: z.string().regex(/^\d+$/).transform(Number).optional(),
    max_age: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
});

export const getPatientSchema = z.object({
  params: common.idParam,
});

// ---------------------------------------------------------
// 🦷 DENTAL & MEDICAL SCHEMAS
// ---------------------------------------------------------

export const createDentalRecordSchema = z.object({
  body: z.object({
    patient_id: z.number().int().positive(),
    visit_date: common.date,
    tooth_number: z.string().max(10).optional(),
    diagnosis: z.string().min(1),
    treatment_provided: z.string().optional(),
    treatment_plan: z.string().optional(),
    prescription: z.string().optional(),
    
    // Vitals
    blood_pressure: z.string().max(20).optional(),
    pulse: z.string().max(20).optional(),
    temperature: z.string().max(20).optional(),
    
    // Financials
    cost: z.number().min(0).optional().default(0),
    paid: z.number().min(0).optional().default(0),
    
    dentist_id: z.number().int().positive().optional(),
    hygienist_id: z.number().int().positive().optional(),
    notes: z.string().optional(),
    next_visit_date: common.date.optional(),
  }),
});

export const createMedicalHistorySchema = z.object({
  body: z.object({
    patient_id: z.number().int().positive(),
    category: z.enum(['allergy', 'condition', 'medication', 'surgery', 'family_history', 'other']),
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    diagnosed_date: common.date.optional(),
    status: z.enum(['active', 'resolved', 'managed']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    notes: z.string().optional(),
  }),
});

export const createPatientNoteSchema = z.object({
  body: z.object({
    patient_id: z.number().int().positive(),
    note_type: z.enum(['general', 'treatment', 'billing', 'insurance', 'follow_up', 'alert']),
    title: z.string().max(255).optional(),
    content: z.string().min(1),
    is_alert: z.boolean().optional(),
  }),
});

// ---------------------------------------------------------
// 📦 EXPORT TYPES
// ---------------------------------------------------------
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
export type ListPatientsInput = z.infer<typeof listPatientsSchema>;
export type CreateDentalRecordInput = z.infer<typeof createDentalRecordSchema>;
export type CreateMedicalHistoryInput = z.infer<typeof createMedicalHistorySchema>;
export type CreatePatientNoteInput = z.infer<typeof createPatientNoteSchema>;
