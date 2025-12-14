import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { QueryBuilder } from "~/orm/query-builder.orm";
import { DentistSchedule } from "./appointment.types";

@Service()
export class DentistScheduleRepository extends BaseRepository<DentistSchedule> {
  protected tableName = 'dentist_schedules';

  async findByDentist(dentistId: number): Promise<DentistSchedule[]> {
    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .where('is_active', '=', true) 
      .orderBy('day_of_week', 'ASC')
      .get();
  }

  async findByDentistAndDay(dentistId: number, dayOfWeek: string): Promise<DentistSchedule | null> {
    return this.newQuery()
      .where('dentist_id', '=', dentistId)
      .where('day_of_week', '=', dayOfWeek)
      .where('is_active', '=', true)
      .first();
  }

  async findAllByDentist(dentistId: number): Promise<any[]> {
    return new QueryBuilder(this.tableName, this.connection)
      .where('dentist_id', '=', dentistId)
      .where('is_active', '=', true)
      .get();
  }
}
