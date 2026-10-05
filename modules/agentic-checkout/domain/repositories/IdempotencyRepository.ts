import type { IdempotencyRecord } from '../entities/IdempotencyRecord';

export interface IdempotencyRepository {
  /**
   * Insert a new in-flight record. Implementations must fail (return null)
   * rather than overwrite when (integrationId, key) already exists — the
   * caller maps null to the conflict/in-flight semantics.
   */
  createIfAbsent(record: IdempotencyRecord): Promise<IdempotencyRecord | null>;
  findByKey(integrationId: string, key: string): Promise<IdempotencyRecord | null>;
  update(record: IdempotencyRecord): Promise<IdempotencyRecord>;
  deleteExpired(now: Date): Promise<number>;
}
