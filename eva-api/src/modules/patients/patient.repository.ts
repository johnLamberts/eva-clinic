import BaseRepository, { PaginationOptions } from "~/orm/base-repository.orm";
import { PaginationResult } from "~/orm/query-builder.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { Patient, PatientFilters } from "./patient.types";

export class PatientRepository extends BaseRepository<Patient> {
  protected tableName: string = 'patients';
protected useSoftDeletes = false;

  async findAllWithFilters(
    filters: PatientFilters,
    pagination: PaginationOptions
  ): Promise<PaginationResult<Patient>> {
    const query = this.newQuery().select('*').whereNull('deleted_at');

    if (filters.gender) query.where('gender', '=', filters.gender);
    if (filters.status) query.where('status', '=', filters.status);
  
    if (filters.search) {
      const term = `%${filters.search}%`;
      query.whereRaw(
        '(first_name LIKE ? OR last_name LIKE ? OR patient_number LIKE ? OR phone LIKE ?)', 
        [term, term, term, term]
      );
    }

    // Age filtering
    const today = new Date();

    if (filters.minAge !== undefined) {
      const maxDob = new Date(today.getFullYear() - filters.minAge, today.getMonth(), today.getDate());
      query.where('date_of_birth', '<=', maxDob.toISOString().split('T')[0]);
    }
    
    if (filters.maxAge !== undefined) {
      const minDob = new Date(today.getFullYear() - filters.maxAge - 1, today.getMonth(), today.getDate());
      query.where('date_of_birth', '>', minDob.toISOString().split('T')[0]);
    }

    const total = await query.count();

    const offset = (pagination.page - 1) * pagination.limit;
    const data = await query
      .orderBy('created_at', 'DESC')
      .limit(pagination.limit)
      .offset(offset)
      .get();

    return {
      data,
      meta: {
        total,
        per_page: pagination.limit,
        current_page: pagination.page,
        last_page: Math.ceil(total / pagination.limit),
      }
    };
  }

  async getGeneralStats() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
    const dateStr = startOfMonth.toISOString().slice(0, 19).replace('T', ' ');

    const sqlStats = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) as archived,
        SUM(CASE WHEN created_at >= ? THEN 1 ELSE 0 END) as new_this_month
      FROM patients
      WHERE deleted_at IS NULL
    `;

    const sqlGender = `
      SELECT gender, COUNT(*) as count 
      FROM patients 
      WHERE deleted_at IS NULL 
      GROUP BY gender
    `;

    // 🟢 FIX: Use executeRaw
    const [statsResult, genderResult] = await Promise.all([
      executeRaw<any>(this, sqlStats, [dateStr]),
      executeRaw<any>(this, sqlGender, [])
    ]);

    const by_gender: Record<string, number> = {};
    (genderResult as any[]).forEach(row => {
      by_gender[row.gender] = row.count;
    });

    const stats = statsResult[0];

    return {
      total: stats.total || 0,
      active: stats.active || 0,
      inactive: stats.inactive || 0,
      archived: stats.archived || 0,
      new_this_month: stats.new_this_month || 0,
      by_gender
    };
  }

  
  async getLastVisit(patientId: number): Promise<Patient | null> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('visit_date', 'DESC') // Assuming visit_date column exists
      .first();
  }


  async findByPatientNumber(patientNumber: string): Promise<Patient | null> {
    return this.newQuery()
      .where('patient_number', '=', patientNumber)
      .whereNull('deleted_at')
      .first();
  } 

  async findByPhone(phone: string): Promise<Patient | null> {
    return this.newQuery()
      .where('phone', '=', phone)
      .whereNull('deleted_at')
      .first();
  }

  async findByEmail(email: string): Promise<Patient | null> {
    return this.newQuery()
      .where('email', '=', email)
      .whereNull('deleted_at')
      .first();
  }

  async searchPatients(searchTerm: string): Promise<Patient[]> {
    const sql = `
      SELECT * FROM patients
      WHERE deleted_at IS NULL
      AND (
        MATCH(first_name, last_name, email, phone, patient_number) 
        AGAINST(? IN NATURAL LANGUAGE MODE)
        OR first_name LIKE ?
        OR last_name LIKE ?
        OR patient_number LIKE ?
        OR phone LIKE ?
      )
      ORDER BY 
        CASE 
          WHEN patient_number = ? THEN 1
          WHEN phone = ? THEN 2
          WHEN email = ? THEN 3
          ELSE 4
        END,
        last_name, first_name
      LIMIT 50
    `;

    const likeTerm = `%${searchTerm}%`;
    return executeRaw<Patient>(this, sql, [likeTerm, likeTerm, likeTerm, likeTerm]);
  }

  async generatePatientNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `P${year}`;
    
    const sql = `
      SELECT patient_number 
      FROM patients 
      WHERE patient_number LIKE ?
      ORDER BY id DESC 
      LIMIT 1
    `;
    
    const result = await executeRaw<any>(this, sql, [`${prefix}%`]);

    if (result.length === 0) {
      return `${prefix}0001`;
    }

    const lastNumber = result[0].patient_number;
    const numericPart = parseInt(lastNumber.slice(prefix.length)) + 1;
    return `${prefix}${numericPart.toString().padStart(4, '0')}`;
  }

  async getPatientStatsByAge(): Promise<{ age_group: string; count: number }[]> {
    const sql = `
      SELECT 
        CASE
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Under 18'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 30 THEN '18-30'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 50 THEN '31-50'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 51 AND 65 THEN '51-65'
          ELSE 'Over 65'
        END as age_group,
        COUNT(*) as count
      FROM patients
      WHERE deleted_at IS NULL
      GROUP BY age_group
      ORDER BY 
        CASE age_group
          WHEN 'Under 18' THEN 1
          WHEN '18-30' THEN 2
          WHEN '31-50' THEN 3
          WHEN '51-65' THEN 4
          ELSE 5
        END
    `;

    return executeRaw<{ age_group: string; count: number }>(this, sql, []);
  }
}
