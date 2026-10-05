/**
 * IdempotencyRecord
 *
 * Persisted record for ACP `Idempotency-Key` semantics:
 * - in_flight  → concurrent retry returns 409
 * - completed + same request hash → replay stored response
 * - completed + different hash   → 422 conflict
 */

import { generateUUID } from '../../../../libs/uuid';

export type IdempotencyState = 'in_flight' | 'completed';

export interface IdempotencyRecordProps {
  idempotencyRecordId: string;
  integrationId: string;
  key: string;
  requestHash: string;
  method: string;
  path: string;
  state: IdempotencyState;
  responseStatus: number | null;
  responseBody: Record<string, unknown> | null;
  createdAt: Date;
  expiresAt: Date;
}

export class IdempotencyRecord {
  private constructor(private props: IdempotencyRecordProps) {}

  static createInFlight(params: {
    integrationId: string;
    key: string;
    requestHash: string;
    method: string;
    path: string;
    ttlHours?: number;
  }): IdempotencyRecord {
    const now = new Date();
    const ttl = params.ttlHours ?? 24;
    return new IdempotencyRecord({
      idempotencyRecordId: generateUUID(),
      integrationId: params.integrationId,
      key: params.key,
      requestHash: params.requestHash,
      method: params.method,
      path: params.path,
      state: 'in_flight',
      responseStatus: null,
      responseBody: null,
      createdAt: now,
      expiresAt: new Date(now.getTime() + ttl * 3_600_000),
    });
  }

  static reconstitute(props: IdempotencyRecordProps): IdempotencyRecord {
    return new IdempotencyRecord(props);
  }

  get idempotencyRecordId(): string {
    return this.props.idempotencyRecordId;
  }
  get integrationId(): string {
    return this.props.integrationId;
  }
  get key(): string {
    return this.props.key;
  }
  get requestHash(): string {
    return this.props.requestHash;
  }
  get method(): string {
    return this.props.method;
  }
  get path(): string {
    return this.props.path;
  }
  get state(): IdempotencyState {
    return this.props.state;
  }
  get responseStatus(): number | null {
    return this.props.responseStatus;
  }
  get responseBody(): Record<string, unknown> | null {
    return this.props.responseBody;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  matchesRequest(hash: string): boolean {
    return this.props.requestHash === hash;
  }

  complete(status: number, body: Record<string, unknown>): void {
    this.props.state = 'completed';
    this.props.responseStatus = status;
    this.props.responseBody = body;
  }
}
