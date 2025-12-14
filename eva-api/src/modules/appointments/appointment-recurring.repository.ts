import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { RecurringAppointment } from "./appointment.types";

@Service()
export class RecurringAppointmentRepository extends BaseRepository<RecurringAppointment> {
  protected tableName = 'recurring_appointments';

  protected useTimestamps: boolean = false;
  
  async findActiveByPatient(patientId: number): Promise<RecurringAppointment[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .where('is_active', '=', true)
      .get();
  }

  async findActiveByDentist(dentistId: number): Promise<RecurringAppointment[]> {
    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .where('is_active', '=', true)
      .get();
  }
}
