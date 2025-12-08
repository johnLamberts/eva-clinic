import { Service } from 'decorator/service.decorator';
import BaseRepository, { PaginationOptions } from '~/orm/base-repository.orm';
import QueryBuilder from '~/orm/query-builder.orm';
import { AuditLog, AuditLogFilter } from './audit.types';

@Service()
export class AuditRepository extends BaseRepository<AuditLog> {
  protected tableName = 'audit_logs';

  protected useTimestamps = false;
  protected useSoftDeletes = false;
  /**
   * Optimized Search with Database Pagination
   */
  async search(
    filters: AuditLogFilter, 
    pagination: PaginationOptions
  ) {
    const query = this.buildFilterQuery(filters);
    
    // Use the ORM's built-in paginate which handles Count + Limit/Offset
    return query
      .orderBy('created_at', 'DESC')
      .paginate(pagination.page, pagination.limit);
  }

  async findByEntity(type: string, id: number): Promise<AuditLog[]> {
    return this.newQuery()
      .where('entity_type', '=', type)
      .where('entity_id', '=', id)
      .orderBy('created_at', 'DESC')
      .get();
  }

  async findByUser(userId: number, limit = 50): Promise<AuditLog[]> {
    return this.newQuery()
      .where('user_id', '=', userId)
      .orderBy('created_at', 'DESC')
      .limit(limit)
      .get();
  }

  // --- PRIVATE HELPER (DRY) ---
  private buildFilterQuery(filters: AuditLogFilter): QueryBuilder<AuditLog> {
    const query = this.newQuery();

    if (filters.userId) query.where('user_id', '=', filters.userId);
    if (filters.action) query.where('action', '=', filters.action);
    if (filters.entityType) query.where('entity_type', '=', filters.entityType);
    if (filters.entityId) query.where('entity_id', '=', filters.entityId);
    if (filters.startDate) query.where('created_at', '>=', filters.startDate);
    if (filters.endDate) query.where('created_at', '<=', filters.endDate);

    return query;
  }
}
