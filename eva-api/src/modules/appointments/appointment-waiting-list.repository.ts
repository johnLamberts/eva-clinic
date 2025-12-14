import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import QueryBuilder from "~/orm/query-builder.orm";
import { AppointmentWaitlist } from "./appointment.types";

@Service()
export class AppointmentWaitlistRepository extends BaseRepository<AppointmentWaitlist> {
  protected tableName = 'appointment_waitlist';

  protected useSoftDeletes: boolean = false;

  async findById(id: number): Promise<AppointmentWaitlist | null> {
    return new QueryBuilder<AppointmentWaitlist>(this.tableName, this.connection)
      .where('id', '=', id)
      // .whereNull('deleted_at') <--- We intentionally REMOVED this line
      .first();
  }
  
  async findWaiting(): Promise<AppointmentWaitlist[]> {
    return this.newQuery()
      .where('status', '=', 'waiting')
      .orderBy('priority', 'DESC') // High priority first
      .orderBy('created_at', 'ASC') // First come, first served
      .get();
  }

  async findByPatient(patientId: number): Promise<AppointmentWaitlist[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('created_at', 'DESC')
      .get();
  }
}
