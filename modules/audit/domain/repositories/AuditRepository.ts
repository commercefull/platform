/**
 * Audit Repository Port
 *
 * Interface for persisting and querying immutable audit log records.
 * Implementations must guarantee append-only semantics — no update or
 * delete operations are exposed.
 */

import { AuditLog } from '../entities/AuditLog';
import type { AuditAction, ActorType, ResourceType } from '../enums/AuditAction';
import type { PaginatedResult, PaginationOptions } from '../../../../libs/types/shared';

export interface AuditLogFilters {
  actorId?: string;
  actorType?: ActorType;
  action?: AuditAction;
  resourceType?: ResourceType;
  resourceId?: string;
  organizationId?: string;
  storeId?: string;
  correlationId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface AuditRepository {
  // Append-only write — returns the persisted record
  append(entry: AuditLog): Promise<AuditLog>;

  // Read-only queries
  findById(auditLogId: string): Promise<AuditLog | null>;
  findAll(filters?: AuditLogFilters, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findByActor(actorId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findByResource(resourceType: ResourceType, resourceId: string, pagination?: PaginationOptions): Promise<PaginatedResult<AuditLog>>;
  findByCorrelationId(correlationId: string): Promise<AuditLog[]>;

  // Chain verification
  getLatestHash(): Promise<string>;
  verifyChain(fromId?: string, toId?: string): Promise<{ valid: boolean; brokenAt?: string }>;

  // Statistics
  countByAction(): Promise<Record<string, number>>;
  countByActor(): Promise<Record<string, number>>;
}
