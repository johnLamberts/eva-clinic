import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { QueryBuilder } from "~/orm/query-builder.orm";
import executeRaw from "~/utils/execute-raw.utils";
import { Appointment } from "./appointment.types";

@Service()
export class AppointmentRepository extends BaseRepository<Appointment> {
  protected tableName = 'appointments';

  async findByAppointmentNumber(appointmentNumber: string): Promise<Appointment | null> {
    return this.newQuery()
      .where('appointment_number', '=', appointmentNumber)
      .whereNull('deleted_at')
      .first();
  }

  async findByPatient(patientId: number, limit: number = 10): Promise<Appointment[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .whereNull('deleted_at')
      .orderBy('appointment_date', 'DESC')
      .limit(limit)
      .get();
  }

  async findByDentist(dentistId: number, date: string): Promise<Appointment[]> {
    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .where('appointment_date', '=', date)
      .whereNull('deleted_at')
      .orderBy('start_time', 'ASC')
      .get();
  }

  async findInRange(dentistId: number, startDate: string, endDate: string): Promise<Appointment[]> {
    return new QueryBuilder<Appointment>(this.tableName, this.connection)
      .where('dentist_id', '=', dentistId)
      .where('appointment_date', '>=', startDate)
      .where('appointment_date', '<=', endDate)
      .whereNotIn('status', ['cancelled', 'no_show']) // Ignore cancelled
      .get();
  }

  async findConflicting(
    dentistId: number,
    date: string,
    startTime: string,
    endTime: string,
    excludeAppointmentId?: number
  ): Promise<Appointment[]> {
    // 🟢 FIX: Use executeRaw instead of broken prototype chain
    const sql = `
      SELECT * FROM appointments
      WHERE dentist_id = ?
      AND appointment_date = ?
      AND deleted_at IS NULL
      ${excludeAppointmentId ? 'AND id != ?' : ''}
      AND status NOT IN ('cancelled', 'no_show')
      AND (
        (start_time < ? AND end_time > ?)
        OR (start_time >= ? AND start_time < ?)
        OR (end_time > ? AND end_time <= ?)
      )
    `;

    const params = excludeAppointmentId
      ? [dentistId, date, excludeAppointmentId, endTime, startTime, startTime, endTime, startTime, endTime]
      : [dentistId, date, endTime, startTime, startTime, endTime, startTime, endTime];

    return await executeRaw<Appointment>(this, sql, params);
  }

  async findUpcoming(dentistId: number, limit: number = 10): Promise<Appointment[]> {
    const today = new Date().toISOString().split('T')[0];

    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .where('appointment_date', '>=', today)
      .whereNull('deleted_at')
      .orderBy('appointment_date', 'ASC')
      .orderBy('start_time', 'ASC')
      .limit(limit)
      .get();
  }

  async generateAppointmentNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const prefix = `A${year}${month}`;

    const sql = `
      SELECT appointment_number
      FROM appointments
      WHERE appointment_number LIKE ?
      ORDER BY appointment_number DESC
      LIMIT 1
    `;

    // 🟢 FIX: Use executeRaw
    const result = await executeRaw<any>(this, sql, [`${prefix}%`]);

    if (!result || result.length === 0) {
      return `${prefix}0001`;
    }

    const lastNumber = result[0].appointment_number;
    const numericPart = parseInt(lastNumber.slice(prefix.length)) + 1;
    return `${prefix}${numericPart.toString().padStart(4, '0')}`;
  }

  async countByStatus(status: string): Promise<number> {
    return this.newQuery()
      .where('status', '=', status)
      .whereNull('deleted_at')
      .count();
  }
}
