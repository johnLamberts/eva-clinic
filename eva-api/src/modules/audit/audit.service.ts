import { Service } from 'decorator/service.decorator';
import { PaginationOptions } from '~/orm/base-repository.orm';
import { PaginationResult } from '~/orm/query-builder.orm';
import { AuditRepository } from './audit.repository';
import { AuditLog, AuditLogFilter, CreateAuditLogDto } from './audit.types';

@Service()
export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async log(data: CreateAuditLogDto): Promise<number> {
    const auditData = {
      ...data,
      // Simple serialization
      old_values: data.old_values ? JSON.stringify(data.old_values) : null,
      new_values: data.new_values ? JSON.stringify(data.new_values) : null,
    };
    
    // cast as any to bypass strict type check on JSON strings vs objects
    return this.auditRepo.create(auditData as any).then(res => res.id!);
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
