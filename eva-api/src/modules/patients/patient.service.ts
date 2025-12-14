import { Service } from "decorator/service.decorator";

import { PaginationOptions } from "~/orm/base-repository.orm";
import { PaginationResult } from "~/orm/query-builder.orm";
import { Transaction } from "~/orm/transaction.orm";
import { AppError } from "~/utils/app-error.utils";
import AuditService from "../audit/audit.service";
import { RequestContext } from "../users/user.type";
import { DentalRecordRepository } from "./patient-dental-record.repository";
import { PatientDocumentRepository } from "./patient-document.repository";
import { MedicalHistoryRepository } from "./patient-medical-history.repository";
import { PatientNoteRepository } from "./patient-notes.repository";
import { PatientRepository } from "./patient.repository";
import {
  BloodType,
  CreateDentalRecordDto,
  CreateMedicalHistoryDto,
  CreatePatientDto,
  CreatePatientNoteDto,
  DentalRecord,
  MedicalHistory,
  Patient,
  PatientFilters,
  PatientNote,
  PatientResponse,
  PatientStatistics,
  PatientStatus,
  UpdatePatientDto,
} from "./patient.types";

@Service()
export class PatientService {

  constructor(
    private patientRepo: PatientRepository,
    private medicalHistoryRepo: MedicalHistoryRepository,
    private dentalRecordRepo: DentalRecordRepository,
    private documentRepo: PatientDocumentRepository,
    private noteRepo: PatientNoteRepository,
    private auditService: AuditService
  ) {
  }

  // ---------------------------------------------------------
  // 🟢 CREATE
  // ---------------------------------------------------------
  async createPatient(dto: CreatePatientDto, ctx: RequestContext): Promise<PatientResponse> {
    this.checkPermission(ctx, 'patients.create');

    return Transaction.transaction(async () => {
      // 1. Validations
      await this.validateUniqueFields(dto.phone, dto.email);
      if (new Date(dto.date_of_birth) > new Date()) {
        throw new AppError('Date of birth cannot be in the future', 400);
      }

      // 2. Prepare Data
      const patientNumber = await this.patientRepo.generatePatientNumber();
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 🟢 FIX: Construct the INSERT object using strict Enums
      const insertData = {
        ...dto,
        patient_number: patientNumber,
        // Fix 1: Use the Enum, not the string 'active'
        status: PatientStatus.ACTIVE, 
        // Fix 2: Provide default for optional blood_type
        blood_type: dto.blood_type || BloodType.UNKNOWN, 
        country: dto.country || 'Philippines',
        created_by: ctx.userId,
        created_at: now,
        updated_at: now,
        // Ensure optional fields are explicitly undefined if missing
        middle_name: dto.middle_name || undefined,
        email: dto.email || undefined,
        alternate_phone: dto.alternate_phone || undefined,
        notes: dto.notes || undefined
      };

      // 3. Insert into DB (Cast to any to bypass ID check for insertion)
      const patientId = await this.patientRepo.create(insertData as any);

      // 4. Construct Complete Object (With ID)
      const newPatient: Patient = {
        id: patientId.id,
        ...insertData,
      } as Patient;

      // 5. Audit
      await this.logAudit(ctx, 'create', 'patients', patientId.id, { 
        name: `${newPatient.first_name} ${newPatient.last_name}`, 
        patient_number: patientNumber 
      });

      // 6. Return Response
      // Since it's a new patient, we know they have 0 visits. 
      // We manually map to save DB calls and avoid race conditions.
      return {
        ...newPatient,
        age: this.calculateAge(newPatient.date_of_birth),
        full_name: `${newPatient.first_name} ${newPatient.middle_name ? newPatient.middle_name + ' ' : ''}${newPatient.last_name}`,
        upcoming_appointments_count: 0,
        last_visit_date: undefined,
        total_visits: 0,
      };
    });
  }

  // ---------------------------------------------------------
  // 🟡 UPDATE
  // ---------------------------------------------------------
  async updatePatient(id: number, dto: UpdatePatientDto, ctx: RequestContext): Promise<PatientResponse> {
    this.checkPermission(ctx, 'patients.update');

    const current = await this.getPatientOrThrow(id);

    // Validate uniqueness only if values changed
    await this.validateUniqueFields(
      dto.phone !== current.phone ? dto.phone : undefined,
      dto.email !== current.email ? dto.email : undefined
    );

    await this.patientRepo.update(id, dto, ctx.userId);
    
    const updated = await this.getPatientOrThrow(id);
    
    await this.logAudit(ctx, 'update', 'patients', id, dto, { 
      phone: current.phone, email: current.email 
    });

    return this.mapToPatientResponse(updated);
  }

  // ---------------------------------------------------------
  // 🔴 DELETE
  // ---------------------------------------------------------
  async deletePatient(id: number, ctx: RequestContext): Promise<void> {
    this.checkPermission(ctx, 'patients.delete');
    
    const patient = await this.getPatientOrThrow(id);
    await this.patientRepo.softDelete(id, ctx.userId);

    await this.logAudit(ctx, 'delete', 'patients', id, null, { 
      name: `${patient.first_name} ${patient.last_name}` 
    });
  }

  // ---------------------------------------------------------
  // 🔵 READ & LIST
  // ---------------------------------------------------------
  async getPatientById(id: number, ctx: RequestContext): Promise<PatientResponse> {
    this.checkPermission(ctx, 'patients.read');
    const patient = await this.getPatientOrThrow(id);
    return this.mapToPatientResponse(patient);
  }

  async searchPatients(term: string, ctx: RequestContext): Promise<PatientResponse[]> {
    this.checkPermission(ctx, 'patients.read');
    const patients = await this.patientRepo.searchPatients(term);
    return Promise.all(patients.map(p => this.mapToPatientResponse(p)));
  }

  async listPatients(
    filters: PatientFilters, 
    pagination: PaginationOptions, 
    ctx: RequestContext
  ): Promise<PaginationResult<PatientResponse>> {
    this.checkPermission(ctx, 'patients.read');
    
    // Use optimized repo method instead of JS filtering
    const result = await this.patientRepo.findAllWithFilters(filters, pagination);

    const mappedData = await Promise.all(
      result.data.map(p => this.mapToPatientResponse(p))
    );

    return { ...result, data: mappedData };
  }

  // ---------------------------------------------------------
  // 📊 STATISTICS
  // ---------------------------------------------------------
  async getPatientStatistics(ctx: RequestContext): Promise<PatientStatistics> {
    this.checkPermission(ctx, 'patients.read');

    // transaction parallel queries for performance
    const [stats, ageGroups, avgVisits] = await Promise.all([
      this.patientRepo.getGeneralStats(),
      this.patientRepo.getPatientStatsByAge(),
      this.dentalRecordRepo.getAverageVisits()
    ]);

    return {
      total: stats.total,
      active: stats.active,
      inactive: stats.inactive,
      archived: stats.archived,
      new_this_month: stats.new_this_month,
      by_gender: stats.by_gender,
      by_age_group: ageGroups.reduce((acc, curr) => ({ ...acc, [curr.age_group]: curr.count }), {}),
      avg_visits_per_patient: avgVisits
    };
  }

  // ---------------------------------------------------------
  // 🦷 SUB-MODULES (Generic Implementation)
  // ---------------------------------------------------------
  
  // DRY Helper for creating related entities
  private async createSubEntity<T>(
    repo: any, 
    permission: string, 
    dto: any & { patient_id: number }, 
    ctx: RequestContext,
    entityType: string,
    extraData: any = {}
  ): Promise<T> {
    this.checkPermission(ctx, permission);
    await this.getPatientOrThrow(dto.patient_id); // Ensure patient exists

    const id = await repo.create({
      ...dto,
      ...extraData,
      created_by: ctx.userId
    });

    await this.logAudit(ctx, 'create', entityType, id, { patient_id: dto.patient_id });
    return repo.findById(id);
  }

  async createDentalRecord(dto: CreateDentalRecordDto, ctx: RequestContext): Promise<DentalRecord> {
    const balance = (dto.cost || 0) - (dto.paid || 0);
    return this.createSubEntity(
      this.dentalRecordRepo, 
      'patients.update', 
      dto, 
      ctx, 
      'dental_records', 
      { balance }
    );
  }

  async createMedicalHistory(dto: CreateMedicalHistoryDto, ctx: RequestContext): Promise<MedicalHistory> {
    return this.createSubEntity(
      this.medicalHistoryRepo, 
      'patients.update', 
      dto, 
      ctx, 
      'medical_histories'
    );
  }

  async createNote(dto: CreatePatientNoteDto, ctx: RequestContext): Promise<PatientNote> {
    return this.createSubEntity(
      this.noteRepo, 
      'patients.update', 
      dto, 
      ctx, 
      'patient_notes'
    );
  }

  // --- Sub-Module Getters ---

  async getDentalRecords(patientId: number, ctx: RequestContext) {
    this.checkPermission(ctx, 'patients.read');
    return this.dentalRecordRepo.findByPatient(patientId);
  }

  async getMedicalHistory(patientId: number, ctx: RequestContext) {
    this.checkPermission(ctx, 'patients.view_medical_history');
    return this.medicalHistoryRepo.findByPatient(patientId);
  }

  async getNotes(patientId: number, ctx: RequestContext) {
    this.checkPermission(ctx, 'patients.read');
    return this.noteRepo.findByPatient(patientId);
  }

  // =========================================================
  // 🛠️ PRIVATE HELPERS
  // =========================================================

  private checkPermission(ctx: RequestContext, permission: string) {
    if (!ctx.permissions.includes(permission)) {
      throw new AppError(`Permission denied: ${permission}`, 403);
    }
  }

  private async getPatientOrThrow(id: number): Promise<Patient> {
    const patient = await this.patientRepo.findById(id);
    if (!patient) throw new AppError('Patient not found', 404);
    return patient;
  }

  private async validateUniqueFields(phone?: string, email?: string) {
    if (phone) {
      const exists = await this.patientRepo.findByPhone(phone);
      if (exists) throw new AppError('Phone number already registered', 409);
    }
    if (email) {
      const exists = await this.patientRepo.findByEmail(email);
      if (exists) throw new AppError('Email already registered', 409);
    }
  }

  private async logAudit(ctx: RequestContext, action: string, type: string, id: number, newV?: any, oldV?: any) {
    // Fire & Forget audit log
    this.auditService.log({
      user_id: ctx.userId,
      action,
      entity_type: type,
      entity_id: id,
      new_values: newV,
      old_values: oldV,
      ip_address: ctx.ip,
      user_agent: ctx.userAgent
    });
  }

  private async mapToPatientResponse(patient: Patient): Promise<PatientResponse> {
    // Parallel fetch for associated data
    const [lastVisit, totalVisits] = await Promise.all([
      this.dentalRecordRepo.getLastVisit(patient.id),
      this.dentalRecordRepo.getVisitCount(patient.id)
    ]);

    return {
      ...patient,
      age: this.calculateAge(patient.date_of_birth),
      full_name: `${patient.first_name} ${patient.middle_name ? patient.middle_name + ' ' : ''}${patient.last_name}`,
      upcoming_appointments_count: 0, // Placeholder
      last_visit_date: lastVisit?.visit_date,
      total_visits: totalVisits,
    };
  }

  private calculateAge(dob: string): number {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.abs(new Date(diff).getUTCFullYear() - 1970);
  }
}
