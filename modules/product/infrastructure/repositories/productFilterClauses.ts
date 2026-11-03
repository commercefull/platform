/**
 * WHERE-clause builders for productRepo filters.
 */

import type { ProductFilterOptions } from './productTypes';

export function buildFilterClauses(
  options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>,
  tableName: string,
): {
  sql: string;
  params: unknown[];
} {
  const b = { sql: '', params: [] as unknown[], paramIndex: 1 };

  addScalarOrInClause(b, '"status"', options.status);
  addScalarOrInClause(b, '"visibility"', options.visibility);
  addScalarOrInClause(b, '"type"', options.type);
  addEqualsClause(b, '"isFeatured"', options.isFeatured);
  addEqualsClause(b, '"isVirtual"', options.isVirtual);
  addEqualsClause(b, '"hasVariants"', options.hasVariants);
  addPriceClauses(b, options, tableName);

  if (options.organizationId) {
    b.sql += ` AND "organizationId" = $${b.paramIndex++}`;
    b.params.push(options.organizationId);
  }

  if (options.searchTerm) {
    b.sql += ` AND ("name" ILIKE $${b.paramIndex} OR "description" ILIKE $${b.paramIndex} OR "sku" ILIKE $${b.paramIndex})`;
    b.params.push(`%${options.searchTerm}%`);
    b.paramIndex++;
  }

  return b;
}

function addScalarOrInClause(
  b: { sql: string; params: unknown[]; paramIndex: number },
  column: string,
  value: string | string[] | undefined,
): void {
  if (!value) return;
  if (Array.isArray(value)) {
    const placeholders = value.map(() => `$${b.paramIndex++}`).join(', ');
    b.sql += ` AND ${column} IN (${placeholders})`;
    b.params.push(...value);
  } else {
    b.sql += ` AND ${column} = $${b.paramIndex++}`;
    b.params.push(value);
  }
}

function addEqualsClause(b: { sql: string; params: unknown[]; paramIndex: number }, column: string, value: unknown): void {
  if (value === undefined) return;
  b.sql += ` AND ${column} = $${b.paramIndex++}`;
  b.params.push(value);
}

// Price bounds live in the pricing-owned productBasePrice table (integer cents).
function addPriceClauses(
  b: { sql: string; params: unknown[]; paramIndex: number },
  options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>,
  tableName: string,
): void {
  if (options.priceMinCents !== undefined) {
    b.sql += ` AND EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = "${tableName}"."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" >= $${b.paramIndex++})`;
    b.params.push(options.priceMinCents);
  }
  if (options.priceMaxCents !== undefined) {
    b.sql += ` AND EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = "${tableName}"."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" <= $${b.paramIndex++})`;
    b.params.push(options.priceMaxCents);
  }
}
