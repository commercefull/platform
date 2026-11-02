/**
 * WHERE-clause builders for product filters.
 */

import type { ProductFilters } from '../../domain/repositories/ProductRepository';

export function buildWhereClause(filters?: ProductFilters): { whereClause: string; params: unknown[] } {
  const b = { conditions: ['"deletedAt" IS NULL'], params: [] as unknown[], paramIndex: 1 };

  addScalarOrInFilter(b, 'status', filters?.status);
  addScalarOrInFilter(b, 'visibility', filters?.visibility);

  if (filters?.categoryId) {
    // Product↔category lives in the productToCategory mapping table
    b.conditions.push(
      `EXISTS (SELECT 1 FROM "productToCategory" ptc WHERE ptc."productId" = product."productId" AND ptc."productCategoryId" = $${b.paramIndex++})`,
    );
    b.params.push(filters.categoryId);
  }

  addScalarOrInFilter(b, '"organizationId"', filters?.organizationId);
  addScalarOrInFilter(b, '"storeId"', filters?.storeId);
  addIdListFilter(b, '"productId"', filters?.productIds);
  addIdListFilter(b, '"productId"', filters?.excludeProductIds, true);
  addScalarOrInFilter(b, '"brandId"', filters?.brandId);
  addIdListFilter(b, '"brandId"', filters?.brandIds);
  addSpecialFilters(b, filters);

  return {
    whereClause: b.conditions.length > 0 ? `WHERE ${b.conditions.join(' AND ')}` : '',
    params: b.params,
  };
}

// isFeatured flag, price bounds (via productBasePrice EXISTS), and the
// text-search UNION.
function addSpecialFilters(b: { conditions: string[]; params: unknown[]; paramIndex: number }, filters?: ProductFilters): void {
  if (filters?.isFeatured !== undefined) {
    b.conditions.push(`"isFeatured" = $${b.paramIndex++}`);
    b.params.push(filters.isFeatured);
  }
  // Price bounds live in the pricing-owned productBasePrice table (integer cents)
  if (filters?.priceMinCents !== undefined) {
    b.conditions.push(
      `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" >= $${b.paramIndex++})`,
    );
    b.params.push(filters.priceMinCents);
  }
  if (filters?.priceMaxCents !== undefined) {
    b.conditions.push(
      `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" <= $${b.paramIndex++})`,
    );
    b.params.push(filters.priceMaxCents);
  }
  if (filters?.search) {
    // UNION inside the IN keeps each arm on its own trigram index — a plain
    // OR across product columns and the productVariant join can't BitmapOr.
    b.conditions.push(
      `"productId" IN (SELECT "productId" FROM product WHERE name ILIKE $${b.paramIndex} OR description ILIKE $${b.paramIndex} OR sku ILIKE $${b.paramIndex} UNION SELECT "productId" FROM "productVariant" WHERE sku ILIKE $${b.paramIndex} OR barcode ILIKE $${b.paramIndex})`,
    );
    b.params.push(`%${filters.search}%`);
    b.paramIndex++;
  }
}

// Scalar value or IN-list — both produce one condition per filter.
function addScalarOrInFilter(
  b: { conditions: string[]; params: unknown[]; paramIndex: number },
  column: string,
  value: string | string[] | undefined,
): void {
  if (!value || (Array.isArray(value) && value.length === 0)) return;
  if (Array.isArray(value)) {
    b.conditions.push(`${column} IN (${value.map(() => `$${b.paramIndex++}`).join(', ')})`);
    b.params.push(...value);
  } else {
    b.conditions.push(`${column} = $${b.paramIndex++}`);
    b.params.push(value);
  }
}

function addIdListFilter(
  b: { conditions: string[]; params: unknown[]; paramIndex: number },
  column: string,
  ids: string[] | undefined,
  negate = false,
): void {
  if (!ids || ids.length === 0) return;
  const placeholders = ids.map(() => `$${b.paramIndex++}`).join(', ');
  b.conditions.push(`${column} ${negate ? 'NOT IN' : 'IN'} (${placeholders})`);
  b.params.push(...ids);
}

