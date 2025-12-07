import { BaseEntity } from "~/orm/base-repository.orm";

export interface AuditLog extends BaseEntity {
  id: number;
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface CreateAuditLogDto {
  user_id?: number;
  action: string;
  entity_type: string;
  entity_id?: number | null;
  old_values?: any;
  new_values?: any;
  ip_address: string;
  user_agent: string;
  [key: string]: any;
}

export interface AuditLogFilter {
  userId?: number;
  action?: string;
  entityType?: string;
  entityId?: number;
  startDate?: string;
  endDate?: string;
}
