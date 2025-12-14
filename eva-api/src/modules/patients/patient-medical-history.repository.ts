import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { MedicalHistory } from "./patient.types";


@Service()
export class MedicalHistoryRepository extends BaseRepository<MedicalHistory> {
  protected tableName = 'medical_history';
protected useSoftDeletes = false;
  
  async findById(id: number): Promise<MedicalHistory | null> {
    return this.newQuery()
      .where('id', '=', id)
      .first();
  }

  async findByPatient(patientId: number): Promise<MedicalHistory[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('diagnosed_date', 'DESC')
      .get();
  }

  

  async findActiveByPatient(patientId: number): Promise<MedicalHistory[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .where('status', '=', 'active')
      .orderBy('severity', 'DESC')
      .get();
  }
}
