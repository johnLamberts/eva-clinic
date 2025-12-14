import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { PatientNote } from "./patient.types";


@Service()
export class PatientNoteRepository extends BaseRepository<PatientNote> {
  protected tableName = 'patient_notes';
  protected useSoftDeletes = false;

  async findById(id: number): Promise<PatientNote | null> {
      return this.newQuery()
        .where('id', '=', id)
        .first();
    }

  async findByPatient(patientId: number): Promise<PatientNote[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('created_at', 'DESC')
      .get();
  }

  async findAlerts(patientId: number): Promise<PatientNote[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .where('is_alert', '=', true)
      .orderBy('created_at', 'DESC')
      .get();
  }
}
