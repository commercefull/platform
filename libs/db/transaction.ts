import { getActivePool } from './pool';
import { incrementQueryCounter } from './queryCounter';

/**
 * A transaction-scoped query client that mirrors the signature of the
 * module-level `query` / `queryOne` helpers but routes all statements
 * through a single pooled connection inside an explicit transaction.
 */
export interface TxClient {
  query<T>(text: string, params?: Array<unknown>): Promise<T | null>;
  queryOne<T>(text: string, params: Array<unknown>): Promise<T | null>;
}

/**
 * Execute `fn` inside a database transaction.
 *
 * - Acquires a dedicated client from the pool.
 * - Issues `BEGIN`, runs `fn`, and calls `COMMIT` on success.
 * - On any thrown error, calls `ROLLBACK` and re-throws.
 * - Always releases the client back to the pool.
 *
 * The callback receives a `TxClient` whose `query` / `queryOne` methods
 * are transaction-scoped — every statement runs on the same connection.
 *
 * @example
 * ```ts
 * import { withTransaction } from 'libs/db';
 *
 * await withTransaction(async (tx) => {
 *   await tx.query('INSERT INTO "order" ...', [...]);
 *   await tx.query('INSERT INTO "orderItem" ...', [...]);
 * });
 * ```
 */
export async function withTransaction<T>(
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  const pool = getActivePool();
  const client = await pool.connect();

  try {
    incrementQueryCounter('BEGIN');
    await client.query('BEGIN');

    const tx: TxClient = {
      async query<U>(text: string, params?: Array<unknown>): Promise<U | null> {
        incrementQueryCounter(text);
        const res = await client.query(text, params);
        if (res.rows.length > 0) {
          return res.rows as unknown as U;
        }
        return null;
      },

      async queryOne<U>(text: string, params: Array<unknown>): Promise<U | null> {
        incrementQueryCounter(text);
        const res = await client.query(text, params);
        if (res.rows.length === 1) {
          return res.rows[0] as unknown as U;
        }
        if (res.rows.length > 1) {
          return res.rows[0] as unknown as U;
        }
        return null;
      },
    };

    const result = await fn(tx);
    incrementQueryCounter('COMMIT');
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      incrementQueryCounter('ROLLBACK');
      await client.query('ROLLBACK');
    } catch {
      // Best-effort rollback; the original error is more important
    }
    throw err;
  } finally {
    client.release();
  }
}
