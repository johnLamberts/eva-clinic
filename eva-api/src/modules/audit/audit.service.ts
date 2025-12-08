import { Service } from 'decorator/service.decorator';
import { PaginationOptions } from '~/orm/base-repository.orm';
import { PaginationResult } from '~/orm/query-builder.orm';
import { AuditRepository } from './audit.repository';
import { AuditLog, AuditLogFilter, CreateAuditLogDto } from './audit.types';

@Service()
export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async log(data: CreateAuditLogDto): Promise<number | void> {
    try {
      // 🟢 SANITIZATION: Force entity_id to be a valid Number or Null
      // This fixes the "Incorrect integer value: 'users'" error.
      let safeEntityId: number | null = null;

      if (typeof data.entity_id === 'number') {
        safeEntityId = data.entity_id;
      } else if (typeof data.entity_id === 'string') {
        // Try to parse "123" -> 123. If "users" -> NaN
        const parsed = parseInt(data.entity_id, 10);
        safeEntityId = isNaN(parsed) ? null : parsed;
      }

      const auditData = {
        ...data,
        entity_id: safeEntityId, // Use the clean ID
        // Serialize objects to strings for TEXT/JSON columns
        old_values: data.old_values ? JSON.stringify(data.old_values) : null,
        new_values: data.new_values ? JSON.stringify(data.new_values) : null,
      };
      
      const result = await this.auditRepo.create(auditData as any);
      return result.id;
    } catch (error) {
      console.error('[AuditService] Failed to log activity:', error);
      // We return nothing to ensure the main request doesn't fail just because logging failed
    }
  }

  async getAuditLogs(
    filters: AuditLogFilter, 
    pagination: PaginationOptions
  ): Promise<PaginationResult<AuditLog>> {
    // 1. Get Optimized Result from DB
    const result = await this.auditRepo.search(filters, pagination);

    // 2. Deserialize JSON fields for the response
    const hydratedData = this.deserializeLogs(result.data);

    return { ...result, data: hydratedData };
  }

  async getEntityHistory(type: string, id: number): Promise<AuditLog[]> {
    const logs = await this.auditRepo.findByEntity(type, id);
    return this.deserializeLogs(logs);
  }

  async getUserActivity(userId: number, limit = 50): Promise<AuditLog[]> {
    const logs = await this.auditRepo.findByUser(userId, limit);
    return this.deserializeLogs(logs);
  }

  // --- PRIVATE HELPER (DRY) ---
  private deserializeLogs(logs: AuditLog[]): AuditLog[] {
    return logs.map(log => ({
      ...log,
      old_values: this.parseJson(log.old_values),
      new_values: this.parseJson(log.new_values),
    }));
  }

  private parseJson(value: any): any {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } 
      catch { return value; }
    }
    return value;
  }
}

export default AuditService;
