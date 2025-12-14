import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { DentalRecord } from "./patient.types";


@Service()
export class DentalRecordRepository extends BaseRepository<DentalRecord> {
  protected tableName = 'dental_records';

  
  protected useTimestamps: boolean = false;
  
  constructor() {
    super();
    this.useSoftDeletes = false;
  }

  async findById(id: number): Promise<DentalRecord | null> {
    return this.newQuery()
      .where('id', '=', id)
      .first();
  }

  async getAverageVisits(): Promise<number> {
      // Calculate total visits / total unique patients
      // We do this in one query to avoid fetching all records
      const sql = `
        SELECT 
          COUNT(*) as total_visits, 
          COUNT(DISTINCT patient_id) as total_patients
        FROM dental_records
      `;
  
      const result = await executeRaw<any>(this, sql, []);
      const { total_visits, total_patients } = result[0];
  
      if (!total_patients || total_patients === 0) return 0;
      
      // Return rounded to 1 decimal place
      return Math.round((total_visits / total_patients) * 10) / 10;
    }
  async findByPatient(patientId: number, limit: number = 10): Promise<DentalRecord[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('visit_date', 'DESC')
      .limit(limit)
      .get();
  }

  async getLastVisit(patientId: number): Promise<DentalRecord | null> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('visit_date', 'DESC')
      .first();
  }

  async getPatientBalance(patientId: number): Promise<number> {
    const sql = `
      SELECT COALESCE(SUM(balance), 0) as total_balance
      FROM dental_records
      WHERE patient_id = ?
    `;

    const result = await this.newQuery().constructor.prototype.constructor.query(
      sql,
      [patientId]
    );

    return result[0]?.total_balance || 0;
  }

  async getVisitCount(patientId: number): Promise<number> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .count();
  }
}
