import { query, queryOne } from './index';
import { PaginationOptions, PaginatedResult } from '../types/shared';

/**
 * Execute a paginated SELECT query with COUNT.
 *
 * Each repo's `buildWhereClause` produces `{ whereClause, params }`.
 * This helper handles the repetitive count + select + pagination boilerplate.
 */
export async function findPaginated<T>(
  table: string,
  whereClause: string,
  params: unknown[],
  pagination?: PaginationOptions,
): Promise<PaginatedResult<T>> {
  const limit = pagination?.limit || 20;
  const offset = pagination?.offset || 0;
  const orderBy = pagination?.orderBy || 'createdAt';
  const orderDir = (pagination?.orderDirection || 'desc').toUpperCase();

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`,
    params,
  );
  const total = parseInt(countResult?.count || '0', 10);

  const rows = await query<T[]>(
    `SELECT * FROM "${table}" ${whereClause} ORDER BY "${orderBy}" ${orderDir} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset],
  );

  const data = rows || [];
  return { data, total, limit, offset, hasMore: offset + data.length < total, length: data.length };
}

/**
 * Execute a COUNT query using a pre-built WHERE clause.
 */
export async function countRows(table: string, whereClause: string, params: unknown[]): Promise<number> {
  const result = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM "${table}" ${whereClause}`,
    params,
  );
  return parseInt(result?.count || '0', 10);
}
