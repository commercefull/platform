/**
 * Audit Log Entity
 *
 * SOC2-aligned immutable audit trail for security-relevant actions.
 * Each entry records who, what, when, where, and the result.
 */

export type AuditCategory =
  | 'authentication'
  | 'authorization'
  | 'dataAccess'
  | 'dataModification'
  | 'configuration'
  | 'payment'
  | 'compliance'
  | 'security';

export type AuditSeverity = 'info' | 'warning' | 'critical';

export type AuditOutcome = 'success' | 'failure' | 'denied';

export interface AuditLogProps {
  auditLogId: string;
  organizationId?: string;
  storeId?: string;
  actorId: string;
  actorType: string;
  actorEmail?: string;
  actorName?: string;
  category?: AuditCategory;
  action: string;
  resourceType: string;
  resourceId?: string;
  resourceName?: string;
  outcome: AuditOutcome;
  severity: AuditSeverity;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  previousState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  previousHash?: string;
  hash?: string;
  createdAt: Date;
}

export class AuditLog {
  private props: AuditLogProps;

  private constructor(props: AuditLogProps) {
    this.props = props;
  }

  static create(params: {
    auditLogId: string;
    organizationId?: string;
    storeId?: string;
    actorId: string;
    actorType: string;
    actorEmail?: string;
    actorName?: string;
    category?: AuditCategory;
    action: string;
    resourceType: string;
    resourceId?: string;
    resourceName?: string;
    outcome?: AuditOutcome;
    severity?: AuditSeverity;
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
  }): AuditLog {
    const now = new Date();
    return new AuditLog({
      auditLogId: params.auditLogId,
      organizationId: params.organizationId,
      storeId: params.storeId,
      actorId: params.actorId,
      actorType: params.actorType,
      actorEmail: params.actorEmail,
      actorName: params.actorName,
      category: params.category,
      action: params.action,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      resourceName: params.resourceName,
      outcome: params.outcome ?? 'success',
      severity: params.severity ?? this.inferSeverity(params.category, params.outcome),
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      requestId: params.requestId,
      correlationId: params.correlationId,
      metadata: params.metadata,
      previousState: params.previousState,
      newState: params.newState,
      previousHash: 'genesis',
      createdAt: now,
    });
  }

  static reconstitute(props: AuditLogProps): AuditLog {
    return new AuditLog(props);
  }

  private static inferSeverity(category?: AuditCategory, outcome?: AuditOutcome): AuditSeverity {
    if (category === 'payment' && (outcome === 'failure' || outcome === 'denied')) return 'critical';
    if (outcome === 'failure' || outcome === 'denied') return 'warning';
    if (category === 'security' || category === 'compliance') return 'warning';
    return 'info';
  }

  // Getters
  get auditLogId(): string { return this.props.auditLogId; }
  get organizationId(): string | undefined { return this.props.organizationId; }
  get storeId(): string | undefined { return this.props.storeId; }
  get actorId(): string { return this.props.actorId; }
  get actorType(): string { return this.props.actorType; }
  get actorEmail(): string | undefined { return this.props.actorEmail; }
  get actorName(): string | undefined { return this.props.actorName; }
  get category(): AuditCategory | undefined { return this.props.category; }
  get action(): string { return this.props.action; }
  get resourceType(): string { return this.props.resourceType; }
  get resourceId(): string | undefined { return this.props.resourceId; }
  get resourceName(): string | undefined { return this.props.resourceName; }
  get outcome(): AuditOutcome { return this.props.outcome; }
  get severity(): AuditSeverity { return this.props.severity; }
  get ipAddress(): string | undefined { return this.props.ipAddress; }
  get userAgent(): string | undefined { return this.props.userAgent; }
  get requestId(): string | undefined { return this.props.requestId; }
  get correlationId(): string | undefined { return this.props.correlationId; }
  get metadata(): Record<string, unknown> | undefined { return this.props.metadata; }
  get previousState(): Record<string, unknown> | undefined { return this.props.previousState; }
  get newState(): Record<string, unknown> | undefined { return this.props.newState; }
  get previousHash(): string | undefined { return this.props.previousHash; }
  get hash(): string | undefined { return this.props.hash; }
  get createdAt(): Date { return this.props.createdAt; }

  isFailure(): boolean {
    return this.props.outcome === 'failure' || this.props.outcome === 'denied';
  }

  isCritical(): boolean {
    return this.props.severity === 'critical';
  }

  toJSON(): Record<string, unknown> {
    return { ...this.props };
  }
}
