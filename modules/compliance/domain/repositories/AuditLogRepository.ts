import { AuditLog, AuditCategory, AuditSeverity, AuditOutcome } from '../entities/AuditLog';
import { PaginatedResult, PaginationOptions } from '../../../../libs/types/shared';

export interface AuditLogFilters {
  organizationId?: string;
  actorId?: string;
  category?: AuditCategory;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditOutcome;
  severity?: AuditSeverity;
  startDate?: Date;
  endDate?: Date;
}

export interface AuditLogRepository {
  findById(auditLogId: string): Promise<AuditLog | null>;
  findByOrganization(organizationId: string, filters?: AuditLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findByActor(actorId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findByResource(resourceType: string, resourceId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findCritical(pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  save(log: AuditLog): Promise<AuditLog>;
  findAll(filters?: AuditLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
}
