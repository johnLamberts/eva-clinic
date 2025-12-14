import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { QueryBuilder } from "~/orm/query-builder.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { DentistTimeOff } from "./appointment.types";

@Service()
export class DentistTimeOffRepository extends BaseRepository<DentistTimeOff> {
  protected tableName = 'dentist_time_off';
  
  // If this table doesn't have a 'deleted_at' column, uncomment this:
  // protected useSoftDeletes = false;

  async findInRange(dentistId: number, startDate: string, endDate: string): Promise<any[]> {
    return new QueryBuilder(this.tableName, this.connection)
      .where('dentist_id', '=', dentistId)
      .where('start_date', '<=', endDate)
      .where('end_date', '>=', startDate)
      .get();
  }
  
  async findByDentist(dentistId: number): Promise<DentistTimeOff[]> {
    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .orderBy('start_date', 'DESC')
      .get();
  }

  async findConflicting(
    dentistId: number,
    date: string
  ): Promise<DentistTimeOff | null> {
    const sql = `
      SELECT * FROM dentist_time_off
      WHERE dentist_id = ?
      AND ? BETWEEN start_date AND end_date
      LIMIT 1
    `;

    const result = await executeRaw<DentistTimeOff>(this, sql, [dentistId, date]);

    return result.length > 0 ? result[0] : null;
  }
}
