import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { PatientDocument } from "./patient.types";

@Service()
export class PatientDocumentRepository extends BaseRepository<PatientDocument> {
  protected tableName = 'patient_documents';
protected useSoftDeletes = false; // 🟢 FIX
  async findByPatient(patientId: number): Promise<PatientDocument[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .orderBy('uploaded_at', 'DESC')
      .get();
  }

  async findByType(patientId: number, documentType: string): Promise<PatientDocument[]> {
    return this.newQuery()
      .where('patient_id', '=', patientId)
      .where('document_type', '=', documentType)
      .orderBy('uploaded_at', 'DESC')
      .get();
  }
}
