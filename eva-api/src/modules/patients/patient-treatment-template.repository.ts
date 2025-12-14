import { Service } from "decorator/service.decorator";
import BaseRepository from "~/orm/base-repository.orm";
import { TreatmentTemplate } from "./patient.types";


@Service()
export class TreatmentTemplateRepository extends BaseRepository<TreatmentTemplate> {
  protected tableName = 'treatment_templates';
protected useSoftDeletes = false;

  async findByCategory(category: string): Promise<TreatmentTemplate[]> {
    return this.newQuery()
      .where('category', '=', category)
      .orderBy('name', 'ASC')
      .get();
  }

  async search(searchTerm: string): Promise<TreatmentTemplate[]> {
    const likeTerm = `%${searchTerm}%`;
    const sql = `
      SELECT * FROM treatment_templates
      WHERE name LIKE ? OR description LIKE ?
      ORDER BY name
      LIMIT 20
    `;

    return await this.newQuery().constructor.prototype.constructor.query(
      sql,
      [likeTerm, likeTerm]
    );
  }
}
