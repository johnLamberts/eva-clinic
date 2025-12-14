import { BaseEntity } from "~/orm/base-repository.orm";

export interface Patient extends BaseEntity {
  id: number;
  patient_number: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  blood_type: BloodType;
  
  // Contact
  email?: string;
  phone: string;
  alternate_phone?: string;
  
  // Address
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Emergency
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  // Medical
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  
  // Insurance
  insurance_provider?: string;
  insurance_policy_number?: string;
  
  status: PatientStatus;
  notes?: string;
  
  created_at: string;
  updated_at: string;
  deleted_at?: string;
  created_by?: number;
  updated_by?: number;
  deleted_by?: number;
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum BloodType {
  A_POSITIVE = 'A+',
  A_NEGATIVE = 'A-',
  B_POSITIVE = 'B+',
  B_NEGATIVE = 'B-',
  AB_POSITIVE = 'AB+',
  AB_NEGATIVE = 'AB-',
  O_POSITIVE = 'O+',
  O_NEGATIVE = 'O-',
  UNKNOWN = 'unknown',
}

export enum PatientStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export interface MedicalHistory extends BaseEntity {
  id: number;
  patient_id: number;
  category: MedicalHistoryCategory;
  title: string;
  description?: string;
  diagnosed_date?: string;
  status: MedicalHistoryStatus;
  severity?: MedicalSeverity;
  notes?: string;
  created_at: string;
  created_by?: number;
}

export enum MedicalHistoryCategory {
  ALLERGY = 'allergy',
  CONDITION = 'condition',
  MEDICATION = 'medication',
  SURGERY = 'surgery',
  FAMILY_HISTORY = 'family_history',
  OTHER = 'other',
}

export enum MedicalHistoryStatus {
  ACTIVE = 'active',
  RESOLVED = 'resolved',
  MANAGED = 'managed',
}

export enum MedicalSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface DentalRecord extends BaseEntity {
  id: number;
  patient_id: number;
  visit_date: string;
  tooth_number?: string;
  diagnosis: string;
  treatment_provided?: string;
  treatment_plan?: string;
  prescription?: string;
  
  // Vitals
  blood_pressure?: string;
  pulse?: string;
  temperature?: string;
  
  // Cost
  cost?: number;
  paid?: number;
  balance?: number;
  
  dentist_id?: number;
  hygienist_id?: number;
  notes?: string;
  next_visit_date?: string;
  
  created_at: string;
  created_by?: number;
}

export interface PatientDocument extends BaseEntity {
  id: number;
  patient_id: number;
  document_type: DocumentType;
  title: string;
  description?: string;
  file_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  uploaded_at: string;
  uploaded_by?: number;
}

export enum DocumentType {
  XRAY = 'xray',
  PHOTO = 'photo',
  CONSENT_FORM = 'consent_form',
  INSURANCE = 'insurance',
  PRESCRIPTION = 'prescription',
  LAB_RESULT = 'lab_result',
  OTHER = 'other',
}

export interface PatientNote extends BaseEntity {
  id: number;
  patient_id: number;
  note_type: NoteType;
  title?: string;
  content: string;
  is_alert: boolean;
  created_at: string;
  created_by?: number;
}

export enum NoteType {
  GENERAL = 'general',
  TREATMENT = 'treatment',
  BILLING = 'billing',
  INSURANCE = 'insurance',
  FOLLOW_UP = 'follow_up',
  ALERT = 'alert',
}

export interface TreatmentTemplate extends BaseEntity {
  id: number;
  name: string;
  description?: string;
  default_cost?: number;
  estimated_duration?: number;
  category?: string;
  requires_multiple_visits: boolean;
  created_at: string;
  created_by?: number;
}

// DTOs
export interface CreatePatientDto {
  first_name: string;
  last_name: string;
  middle_name?: string;
  date_of_birth: string;
  gender: Gender;
  blood_type?: BloodType;
  email?: string;
  phone: string;
  alternate_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  notes?: string;
}

export interface UpdatePatientDto {
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone?: string;
  alternate_phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  allergies?: string;
  medical_conditions?: string;
  current_medications?: string;
  insurance_provider?: string;
  insurance_policy_number?: string;
  status?: PatientStatus;
  notes?: string;
}

export interface CreateDentalRecordDto {
  patient_id: number;
  visit_date: string;
  tooth_number?: string;
  diagnosis: string;
  treatment_provided?: string;
  treatment_plan?: string;
  prescription?: string;
  blood_pressure?: string;
  pulse?: string;
  temperature?: string;
  cost?: number;
  paid?: number;
  dentist_id?: number;
  hygienist_id?: number;
  notes?: string;
  next_visit_date?: string;
}

export interface CreateMedicalHistoryDto {
  patient_id: number;
  category: MedicalHistoryCategory;
  title: string;
  description?: string;
  diagnosed_date?: string;
  status?: MedicalHistoryStatus;
  severity?: MedicalSeverity;
  notes?: string;
}

export interface CreatePatientNoteDto {
  patient_id: number;
  note_type: NoteType;
  title?: string;
  content: string;
  is_alert?: boolean;
}

export interface PatientFilters {
  status?: PatientStatus;
  gender?: Gender;
  search?: string;
  minAge?: number;
  maxAge?: number;
  hasUpcomingAppointments?: boolean;
}

export interface PatientResponse extends Patient {
  age: number;
  full_name: string;
  upcoming_appointments_count: number;
  last_visit_date?: string;
  total_visits: number;
}

export interface PatientStatistics {
  total: number;
  active: number;
  inactive: number;
  archived: number;
  new_this_month: number;
  by_gender: { [key: string]: number };
  by_age_group: { [key: string]: number };
  avg_visits_per_patient: number;
}
