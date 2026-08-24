/**
 * AuditLog Entity
 *
 * Immutable, append-only record of a mutating action performed by an actor.
 * Each record is hash-chained to the previous record for tamper detection.
 */

import { createHash, randomUUID } from 'crypto';
import type { AuditAction, ActorType, ResourceType } from '../enums/AuditAction';

export interface AuditLogProps {
  auditLogId: string;
  createdAt: Date;

  // Actor
  actorId: string;
  actorType: ActorType;
  actorEmail?: string;
  actorName?: string;

  // Action
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  resourceName?: string;

  // Context
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
  organizationId?: string;
  storeId?: string;

  // Payload
  metadata?: Record<string, unknown>;

  // Hash chain
  previousHash: string;
  hash: string;
}

export interface AuditLogCreateInput {
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

export class AuditLog {
  private readonly props: AuditLogProps;

  private constructor(props: AuditLogProps) {
    this.props = Object.freeze(props);
  }

  static create(input: AuditLogCreateInput, previousHash: string = 'genesis'): AuditLog {
    const auditLogId = generateUUID();
    const createdAt = new Date();

    const hash = computeHash({
      auditLogId,
      createdAt: createdAt.toISOString(),
      actorId: input.actorId,
      actorType: input.actorType,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      previousHash,
      metadata: input.metadata,
    });

    return new AuditLog({
      auditLogId,
      createdAt,
      actorId: input.actorId,
      actorType: input.actorType,
      actorEmail: input.actorEmail,
      actorName: input.actorName,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      resourceName: input.resourceName,
      ipAddress: input.ipAddress,
      userAgent: input.userAgent,
      correlationId: input.correlationId,
      organizationId: input.organizationId,
      storeId: input.storeId,
      metadata: input.metadata,
      previousHash,
      hash,
    });
  }

  static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  get auditLogId(): string { return this.props.auditLogId; }
  get createdAt(): Date { return this.props.createdAt; }
  get actorId(): string { return this.props.actorId; }
  get actorType(): ActorType { return this.props.actorType; }
  get actorEmail(): string | undefined { return this.props.actorEmail; }
  get actorName(): string | undefined { return this.props.actorName; }
  get action(): AuditAction { return this.props.action; }
  get resourceType(): ResourceType { return this.props.resourceType; }
  get resourceId(): string | undefined { return this.props.resourceId; }
  get resourceName(): string | undefined { return this.props.resourceName; }
  get ipAddress(): string | undefined { return this.props.ipAddress; }
  get userAgent(): string | undefined { return this.props.userAgent; }
  get correlationId(): string | undefined { return this.props.correlationId; }
  get organizationId(): string | undefined { return this.props.organizationId; }
  get storeId(): string | undefined { return this.props.storeId; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get previousHash(): string { return this.props.previousHash; }
  get hash(): string { return this.props.hash; }

  /**
   * Verify that this record's hash is valid given its content and previousHash.
   */
  verifyHash(): boolean {
    const expectedHash = computeHash({
      auditLogId: this.props.auditLogId,
      createdAt: this.props.createdAt.toISOString(),
      actorId: this.props.actorId,
      actorType: this.props.actorType,
      action: this.props.action,
      resourceType: this.props.resourceType,
      resourceId: this.props.resourceId,
      previousHash: this.props.previousHash,
      metadata: this.props.metadata,
    });
    return expectedHash === this.props.hash;
  }

  toJSON(): AuditLogProps {
    return Object.freeze({ ...this.props });
  }
}

/**
 * Compute SHA-256 hash of the canonical representation of an audit record.
 */
function computeHash(data: {
  auditLogId: string;
  createdAt: string;
  actorId: string;
  actorType: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  previousHash: string;
  metadata?: Record<string, unknown>;
}): string {
  const canonical = JSON.stringify({
    auditLogId: data.auditLogId,
    createdAt: data.createdAt,
    actorId: data.actorId,
    actorType: data.actorType,
    action: data.action,
    resourceType: data.resourceType,
    resourceId: data.resourceId ?? null,
    previousHash: data.previousHash,
    metadata: data.metadata ?? null,
  }, Object.keys(data).sort());

  return createHash('sha256').update(canonical).digest('hex');
}

function generateUUID(): string {
  // Use crypto.randomUUID if available (Node 19+), otherwise fallback
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return randomUUID();
}
