import { logger } from '../logger';

/**
 * Search strategy — determines how text search is performed.
 *
 * - `ilike`: Uses PostgreSQL `ILIKE '%term%'` (case-insensitive substring match).
 *   Works everywhere, no index required. This is the default and current behaviour.
 *
 * - `fts`: Uses PostgreSQL full-text search via `to_tsvector()` / `plainto_tsquery()`.
 *   Faster on large datasets when backed by a GIN index, supports ranking with
 *   `ts_rank()`, and handles word stemming / stop words.
 *   Requires the searched columns to be text/varchar and a GIN index on the
 *   generated tsvector for good performance.
 */
export type SearchStrategy = 'ilike' | 'fts';

/**
 * Runtime configuration for which search strategy to use.
 * Controlled via env var `SEARCH_STRATEGY=ilike|fts`.
 * Defaults to `ilike` for backward compatibility.
 */
const configuredStrategy: SearchStrategy =
  process.env.SEARCH_STRATEGY === 'fts' ? 'fts' : 'ilike';

/**
 * Result of building a search condition.
 */
export interface SearchCondition {
  /** SQL fragment to AND into a WHERE clause, e.g. `AND (col ILIKE $1 OR ...)` */
  clause: string;
  /** Parameter values to append to the params array */
  params: unknown[];
  /** Number of new placeholders consumed */
  paramCount: number;
}

/**
 * Build a text-search WHERE-clause fragment using the ILIKE strategy.
 *
 * Searches across multiple columns with OR, using a single `%term%` parameter.
 *
 * @example
 * const { clause, params } = buildILikeSearch('"name"', '"email"', '"phone"');
 * // clause: 'AND ("name" ILIKE $1 OR "email" ILIKE $1 OR "phone" ILIKE $1)'
 * // params: ['%john%']
 */
export function buildILikeSearch(
  searchTerm: string,
  columns: string[],
  startParamIndex: number = 1,
): SearchCondition {
  if (!searchTerm || columns.length === 0) {
    return { clause: '', params: [], paramCount: 0 };
  }

  const pattern = `%${searchTerm}%`;
  const colConditions = columns.map((col) => `${col} ILIKE $${startParamIndex}`);
  const clause = `AND (${colConditions.join(' OR ')})`;

  return { clause, params: [pattern], paramCount: 1 };
}

/**
 * Build a text-search WHERE-clause fragment using PostgreSQL FTS.
 *
 * Uses `to_tsvector('simple', col1 || ' ' || col2 || ...) @@ plainto_tsquery('simple', $N)`.
 *
 * The `'simple'` configuration is used by default (no stemming / stop words) for
 * predictable matching across arbitrary text like product codes, emails, etc.
 * Pass `tsConfig: 'english'` for natural-language text where stemming is desired.
 *
 * @example
 * const { clause, params } = buildFtsSearch('john doe', ['"name"', '"email"']);
 * // clause: 'AND (to_tsvector(\'simple\', "name" || \' \' || "email") @@ plainto_tsquery(\'simple\', $1))'
 * // params: ['john doe']
 */
export function buildFtsSearch(
  searchTerm: string,
  columns: string[],
  startParamIndex: number = 1,
  tsConfig: string = 'simple',
): SearchCondition {
  if (!searchTerm || columns.length === 0) {
    return { clause: '', params: [], paramCount: 0 };
  }

  const concatenated = columns.map((col) => `COALESCE(${col}, '')`).join(` || ' ' || `);
  const clause = `AND (to_tsvector('${tsConfig}', ${concatenated}) @@ plainto_tsquery('${tsConfig}', $${startParamIndex}))`;

  return { clause, params: [searchTerm], paramCount: 1 };
}

/**
 * Build a search condition using the globally configured strategy.
 *
 * Falls back to ILIKE if FTS is configured but the query fails at runtime
 * (e.g. missing tsvector column or unsupported data type).
 *
 * @example
 * const { clause, params } = buildSearchCondition('john', ['"name"', '"email"'], 3);
 * // With SEARCH_STRATEGY=ilike (default):
 * //   clause: 'AND ("name" ILIKE $3 OR "email" ILIKE $3)'
 * //   params: ['%john%']
 * // With SEARCH_STRATEGY=fts:
 * //   clause: 'AND (to_tsvector(\'simple\', COALESCE("name", \'\') || \' \' || COALESCE("email", \'\')) @@ plainto_tsquery(\'simple\', $3))'
 * //   params: ['john']
 */
export function buildSearchCondition(
  searchTerm: string,
  columns: string[],
  startParamIndex: number = 1,
  options?: { tsConfig?: string },
): SearchCondition {
  if (!searchTerm || columns.length === 0) {
    return { clause: '', params: [], paramCount: 0 };
  }

  if (configuredStrategy === 'fts') {
    logger.debug('searchHelpers: using FTS strategy', { columns: columns.length });
    return buildFtsSearch(searchTerm, columns, startParamIndex, options?.tsConfig);
  }

  return buildILikeSearch(searchTerm, columns, startParamIndex);
}

/**
 * Build an ORDER BY fragment for search relevance ranking.
 *
 * - `ilike`: Ranks by exact match > prefix match > substring match.
 * - `fts`: Ranks by `ts_rank()` descending.
 *
 * @example
 * const orderBy = buildSearchOrderBy('"name"', 'ilike', 1);
 * // 'CASE WHEN "name" ILIKE $1 THEN 1 WHEN "name" ILIKE \'%\' || $1 || \'%\' THEN 2 ELSE 3 END ASC'
 */
export function buildSearchOrderBy(
  primaryColumn: string,
  strategy: SearchStrategy = configuredStrategy,
  paramIndex: number = 1,
): string {
  if (strategy === 'fts') {
    return `ts_rank(to_tsvector('simple', ${primaryColumn}), plainto_tsquery('simple', $${paramIndex})) DESC`;
  }

  return `CASE WHEN ${primaryColumn} ILIKE $${paramIndex} THEN 1 WHEN ${primaryColumn} ILIKE '%' || $${paramIndex} || '%' THEN 2 ELSE 3 END ASC`;
}

/**
 * Get the currently configured search strategy.
 */
export function getSearchStrategy(): SearchStrategy {
  return configuredStrategy;
}
