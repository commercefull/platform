/**
 * Facet queries for product search — extracted from ProductSearchService.
 */

import { query } from '../../../../libs/db';
import type { FacetValue, PriceRangeFacet, AttributeFacet } from '../../application/ports/ProductSearchPort';

export interface FacetTables {
  productTable: string;
  categoryTable: string;
  categoryMapTable: string;
  brandTable: string;
  attributeTable: string;
  attributeValueTable: string;
  attributeValueMapTable: string;
}

export async function getCategoryFacets(t: FacetTables): Promise<FacetValue[]> {
  const sql = `
    SELECT 
      pc."productCategoryId" as id,
      pc."name",
      COUNT(DISTINCT p."productId") as count
    FROM "${t.productTable}" p
    JOIN "${t.categoryMapTable}" pcm ON pcm."productId" = p."productId"
    JOIN "${t.categoryTable}" pc ON pc."productCategoryId" = pcm."productCategoryId"
    WHERE p."deletedAt" IS NULL AND p."status" = 'active'
    GROUP BY pc."productCategoryId", pc."name"
    ORDER BY count DESC
    LIMIT 20
  `;

  const results = await query<Array<{ id: string; name: string; count: string }>>(sql);
  return (results || []).map(r => ({
    id: r.id,
    name: r.name,
    count: parseInt(r.count, 10),
  }));
}

export async function getBrandFacets(t: FacetTables): Promise<FacetValue[]> {
  const sql = `
    SELECT 
      b."brandId" as id,
      b."name",
      COUNT(DISTINCT p."productId") as count
    FROM "${t.productTable}" p
    JOIN "${t.brandTable}" b ON b."brandId" = p."brandId"
    WHERE p."deletedAt" IS NULL AND p."status" = 'active'
      AND b."deletedAt" IS NULL
    GROUP BY b."brandId", b."name"
    ORDER BY count DESC
    LIMIT 20
  `;

  const results = await query<Array<{ id: string; name: string; count: string }>>(sql);
  return (results || []).map(r => ({
    id: r.id,
    name: r.name,
    count: parseInt(r.count, 10),
  }));
}

/**
 * Price-range facets over the pricing-owned productBasePrice table.
 * Buckets are integer cents on the effective price (sale price when present).
 */
export async function getPriceRangeFacets(t: FacetTables): Promise<PriceRangeFacet[]> {
  const sql = `
    SELECT
      MIN(COALESCE(bp."salePriceCents", bp."priceCents")) as min_price,
      MAX(COALESCE(bp."salePriceCents", bp."priceCents")) as max_price
    FROM "${t.productTable}" p
    JOIN "productBasePrice" bp ON bp."productId" = p."productId" AND bp."productVariantId" IS NULL
    WHERE p."deletedAt" IS NULL AND p."status" = 'active'
  `;

  const result = await query<Array<{ min_price: string | null; max_price: string | null }>>(sql);

  if (!result || result.length === 0 || result[0].min_price == null || result[0].max_price == null) {
    return [];
  }

  const minPriceCents = Number(result[0].min_price);
  const maxPriceCents = Number(result[0].max_price);
  const range = maxPriceCents - minPriceCents;
  const step = Math.ceil(range / 5);

  // Count all five buckets in a single scan instead of one COUNT(*) per
  // bucket — each previous bucket query re-scanned the full join.
  const buckets: Array<{ min: number; max: number }> = [];
  for (let i = 0; i < 5; i++) {
    buckets.push({
      min: minPriceCents + step * i,
      max: i === 4 ? maxPriceCents : minPriceCents + step * (i + 1),
    });
  }

  const bucketCountsSql = `
    SELECT ${buckets
      .map(
        (_, i) =>
          `COUNT(*) FILTER (WHERE COALESCE(bp."salePriceCents", bp."priceCents") >= $${i * 2 + 1} AND COALESCE(bp."salePriceCents", bp."priceCents") <= $${i * 2 + 2}) AS "b${i}"`,
      )
      .join(',\n        ')}
    FROM "${t.productTable}" p
    JOIN "productBasePrice" bp ON bp."productId" = p."productId" AND bp."productVariantId" IS NULL
    WHERE p."deletedAt" IS NULL AND p."status" = 'active'
  `;

  const bucketRows = await query<Array<Record<string, string>>>(
    bucketCountsSql,
    buckets.flatMap(b => [b.min, b.max]),
  );
  const bucketRow = bucketRows?.[0] || {};

  const ranges: PriceRangeFacet[] = [];
  for (let i = 0; i < buckets.length; i++) {
    const count = parseInt(bucketRow[`b${i}`] || '0', 10);
    if (count > 0) {
      ranges.push({ ...buckets[i], count });
    }
  }

  return ranges;
}

export async function getAttributeFacets(t: FacetTables): Promise<AttributeFacet[]> {
  // Get filterable attributes with their values
  const sql = `
    SELECT 
      pa."productAttributeId" as "attributeId",
      pa."code" as "attributeCode",
      pa."name" as "attributeName",
      pa."type",
      pavm."value",
      COALESCE(pavl."displayValue", pavm."value") as "displayValue",
      COUNT(DISTINCT pavm."productId") as count
    FROM "${t.attributeTable}" pa
    JOIN "${t.attributeValueMapTable}" pavm ON pavm."attributeId" = pa."productAttributeId"
    JOIN "${t.productTable}" p ON p."productId" = pavm."productId"
    LEFT JOIN "${t.attributeValueTable}" pavl ON pavl."attributeId" = pa."productAttributeId" AND pavl."value" = pavm."value"
    WHERE pa."isFilterable" = true
      AND p."deletedAt" IS NULL
      AND p."status" = 'active'
    GROUP BY pa."productAttributeId", pa."code", pa."name", pa."type", pavm."value", pavl."displayValue"
    ORDER BY pa."position" ASC, count DESC
  `;

  const results = await query<
    Array<{
      attributeId: string;
      attributeCode: string;
      attributeName: string;
      type: string;
      value: string;
      displayValue: string;
      count: string;
    }>
  >(sql);

  if (!results) return [];

  // Group by attribute
  const attributeMap = new Map<string, AttributeFacet>();

  for (const row of results) {
    if (!attributeMap.has(row.attributeId)) {
      attributeMap.set(row.attributeId, {
        attributeId: row.attributeId,
        attributeCode: row.attributeCode,
        attributeName: row.attributeName,
        type: row.type,
        values: [],
      });
    }

    attributeMap.get(row.attributeId)!.values.push({
      value: row.value,
      displayValue: row.displayValue,
      count: parseInt(row.count, 10),
    });
  }

  return Array.from(attributeMap.values());
}

