/**
 * Key Rotation Policy Entity
 *
 * Tracks cryptographic key lifecycle for PCI-DSS compliance.
 * Enforces rotation schedules for payment webhook secrets, API keys,
 * JWT signing keys, and HMAC signing keys.
 */

import { ComplianceValidationError } from '../errors/ComplianceErrors';

export type KeyType =
  | 'paymentWebhookSecret'
  | 'paymentApiKey'
  | 'jwtSigningKey'
  | 'hmacSigningKey'
  | 'encryptionKey';

export type KeyRotationStatus = 'active' | 'rotating' | 'retired' | 'expired';

export interface KeyRotationPolicyProps {
  keyRotationPolicyId: string;
  organizationId: string;
  keyType: KeyType;
  keyIdentifier: string;
  rotationIntervalDays: number;
  lastRotatedAt: Date;
  nextRotationAt: Date;
  status: KeyRotationStatus;
  previousKeyId?: string;
  rotationCount: number;
  gracePeriodDays: number;
  notifyBeforeDays: number;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_ROTATION_INTERVALS: Record<KeyType, number> = {
  paymentWebhookSecret: 90,
  paymentApiKey: 90,
  jwtSigningKey: 30,
  hmacSigningKey: 90,
  encryptionKey: 365,
};

const MIN_ROTATION_INTERVAL = 7;
const MAX_ROTATION_INTERVAL = 730;

export class KeyRotationPolicy {
  private props: KeyRotationPolicyProps;

  private constructor(props: KeyRotationPolicyProps) {
    this.props = props;
  }

  static create(params: {
    keyRotationPolicyId: string;
    organizationId: string;
    keyType: KeyType;
    keyIdentifier: string;
    rotationIntervalDays?: number;
    gracePeriodDays?: number;
    notifyBeforeDays?: number;
  }): KeyRotationPolicy {
    const now = new Date();
    const interval = params.rotationIntervalDays ?? DEFAULT_ROTATION_INTERVALS[params.keyType];

    if (interval < MIN_ROTATION_INTERVAL) {
      throw new ComplianceValidationError(
        `Rotation interval must be at least ${MIN_ROTATION_INTERVAL} days`,
      );
    }
    if (interval > MAX_ROTATION_INTERVAL) {
      throw new ComplianceValidationError(
        `Rotation interval must not exceed ${MAX_ROTATION_INTERVAL} days`,
      );
    }

    const nextRotation = new Date(now);
    nextRotation.setDate(nextRotation.getDate() + interval);

    return new KeyRotationPolicy({
      keyRotationPolicyId: params.keyRotationPolicyId,
      organizationId: params.organizationId,
      keyType: params.keyType,
      keyIdentifier: params.keyIdentifier,
      rotationIntervalDays: interval,
      lastRotatedAt: now,
      nextRotationAt: nextRotation,
      status: 'active',
      rotationCount: 0,
      gracePeriodDays: params.gracePeriodDays ?? 7,
      notifyBeforeDays: params.notifyBeforeDays ?? 14,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: KeyRotationPolicyProps): KeyRotationPolicy {
    return new KeyRotationPolicy(props);
  }

  // Getters
  get keyRotationPolicyId(): string { return this.props.keyRotationPolicyId; }
  get organizationId(): string { return this.props.organizationId; }
  get keyType(): KeyType { return this.props.keyType; }
  get keyIdentifier(): string { return this.props.keyIdentifier; }
  get rotationIntervalDays(): number { return this.props.rotationIntervalDays; }
  get lastRotatedAt(): Date { return this.props.lastRotatedAt; }
  get nextRotationAt(): Date { return this.props.nextRotationAt; }
  get status(): KeyRotationStatus { return this.props.status; }
  get previousKeyId(): string | undefined { return this.props.previousKeyId; }
  get rotationCount(): number { return this.props.rotationCount; }
  get gracePeriodDays(): number { return this.props.gracePeriodDays; }
  get notifyBeforeDays(): number { return this.props.notifyBeforeDays; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  isDueForRotation(): boolean {
    return new Date() >= this.props.nextRotationAt && this.props.status === 'active';
  }

  isRotationApproaching(): boolean {
    const notifyAt = new Date(this.props.nextRotationAt);
    notifyAt.setDate(notifyAt.getDate() - this.props.notifyBeforeDays);
    return new Date() >= notifyAt && !this.isDueForRotation();
  }

  isOverdue(): boolean {
    const graceEnd = new Date(this.props.nextRotationAt);
    graceEnd.setDate(graceEnd.getDate() + this.props.gracePeriodDays);
    return new Date() > graceEnd && this.props.status === 'active';
  }

  daysUntilRotation(): number {
    const diff = this.props.nextRotationAt.getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  startRotation(previousKeyId: string): void {
    if (this.props.status !== 'active') {
      throw new ComplianceValidationError(
        `Cannot rotate key in status: ${this.props.status}`,
      );
    }
    this.props.status = 'rotating';
    this.props.previousKeyId = previousKeyId;
    this.props.updatedAt = new Date();
  }

  completeRotation(): void {
    if (this.props.status !== 'rotating') {
      throw new ComplianceValidationError(
        `Cannot complete rotation in status: ${this.props.status}`,
      );
    }
    const now = new Date();
    this.props.status = 'active';
    this.props.lastRotatedAt = now;
    this.props.rotationCount++;
    this.props.previousKeyId = undefined;

    const next = new Date(now);
    next.setDate(next.getDate() + this.props.rotationIntervalDays);
    this.props.nextRotationAt = next;
    this.props.updatedAt = now;
  }

  retire(): void {
    if (this.props.status === 'retired') return;
    this.props.status = 'retired';
    this.props.updatedAt = new Date();
  }

  updateInterval(days: number): void {
    if (days < MIN_ROTATION_INTERVAL || days > MAX_ROTATION_INTERVAL) {
      throw new ComplianceValidationError(
        `Rotation interval must be between ${MIN_ROTATION_INTERVAL} and ${MAX_ROTATION_INTERVAL} days`,
      );
    }
    this.props.rotationIntervalDays = days;
    const next = new Date(this.props.lastRotatedAt);
    next.setDate(next.getDate() + days);
    this.props.nextRotationAt = next;
    this.props.updatedAt = new Date();
  }

  toJSON(): Record<string, unknown> {
    return {
      ...this.props,
      isDueForRotation: this.isDueForRotation(),
      isRotationApproaching: this.isRotationApproaching(),
      isOverdue: this.isOverdue(),
      daysUntilRotation: this.daysUntilRotation(),
    };
  }
}

export { DEFAULT_ROTATION_INTERVALS };
