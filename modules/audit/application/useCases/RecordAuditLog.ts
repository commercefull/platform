/**
 * RecordAuditLog Use Case
 *
 * Appends an immutable, hash-chained audit log entry.
 * This is the single entry point for all audit logging in the platform.
 */

import { AuditLog } from '../../domain/entities/AuditLog';
import type { AuditAction, ActorType, ResourceType } from '../../domain/enums/AuditAction';
import type { AuditRepository } from '../../domain/repositories/AuditRepository';
import { AuditLogWriteError } from '../../domain/errors/AuditErrors';
import { logger } from '../../../../libs/logger';

export interface RecordAuditLogCommand {
  actorId: string;
  actorType: ActorType;
  actorEmail?: string;
  actorName?: string;
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  organizationId?: string;
  storeId?: string;
  metadata?: Record<string, unknown>;
}

export class RecordAuditLogUseCase {
  constructor(private readonly auditRepository: AuditRepository) {}

  async execute(command: RecordAuditLogCommand): Promise<AuditLog> {
    try {
      const previousHash = await this.auditRepository.getLatestHash();
      const entry = AuditLog.create(command, previousHash);
      return await this.auditRepository.append(entry);
    } catch (err: unknown) {
      // Audit logging must not break the request — log and swallow
      logger.error('Failed to record audit log', {
        action: command.action,
        actorId: command.actorId,
        error: (err as Error).message,
      });
      throw new AuditLogWriteError((err as Error).message);
    }
  }
}
