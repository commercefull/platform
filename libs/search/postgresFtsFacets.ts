/**
 * PostgreSQL Full-Text Search — Facet Computation
 *
 * Facet queries used by PostgresFtsAdapter: categories, price ranges
 * and filterable attribute values.
 */

import { query } from '../db';
import { Table } from '../db/types';
import type {
  SearchQuery,
  SearchFacets,
  SearchFacetValue,
  SearchPriceRangeFacet,
  SearchAttributeFacet,
} from './types';

const PRODUCT_TABLE = Table.Product;
const CATEGORY_MAP_TABLE = Table.ProductCategoryMap;
const ATTRIBUTE_VALUE_MAP_TABLE = Table.ProductAttributeValueMap;
const ATTRIBUTE_TABLE = Table.ProductAttribute;
const ATTRIBUTE_VALUE_TABLE = Table.ProductAttributeValue;
const CATEGORY_TABLE = Table.ProductCategory;

export async function computeFtsFacets(_searchQuery: SearchQuery): Promise<SearchFacets> {
  const [categories, priceRanges, attributes] = await Promise.all([
    getCategoryFacets(),
    getPriceRangeFacets(),
    getAttributeFacets(),
  ]);

  return { categories, priceRanges, attributes };
}

async function getCategoryFacets(): Promise<SearchFacetValue[]> {
  const results = await query<Array<{ id: string; name: string; count: string }>>(`
      SELECT
        pc."productCategoryId" as id,
        pc."name",
        COUNT(DISTINCT p."productId") as count
      FROM "${PRODUCT_TABLE}" p
      JOIN "${CATEGORY_MAP_TABLE}" pcm ON pcm."productId" = p."productId"
      JOIN "${CATEGORY_TABLE}" pc ON pc."productCategoryId" = pcm."productCategoryId"
      WHERE p."deletedAt" IS NULL AND p."status" = 'active'
      GROUP BY pc."productCategoryId", pc."name"
      ORDER BY count DESC
      LIMIT 20
    `);

  return (results || []).map(r => ({
    id: r.id,
    name: r.name,
    count: parseInt(r.count, 10),
  }));
}

async function getPriceRangeFacets(): Promise<SearchPriceRangeFacet[]> {
  const result = await query<Array<{ min_price: number; max_price: number }>>(`
      SELECT
        MIN(bp."priceCents") as min_price,
        MAX(bp."priceCents") as max_price
      FROM "${PRODUCT_TABLE}" p
      LEFT JOIN LATERAL (
        SELECT "priceCents" FROM "productBasePrice"
        WHERE "productId" = p."productId" AND "productVariantId" IS NULL
        ORDER BY "priceCents" ASC LIMIT 1
      ) bp ON true
      WHERE p."deletedAt" IS NULL AND p."status" = 'active'
    `);

  if (!result || result.length === 0) return [];

  const { min_price, max_price } = result[0];
  const range = max_price - min_price;
  if (range === 0) return [{ min: min_price, max: max_price, count: 0 }];
  const step = Math.ceil(range / 5);

  const ranges: SearchPriceRangeFacet[] = [];
  for (let i = 0; i < 5; i++) {
    const min = min_price + step * i;
    const max = i === 4 ? max_price : min_price + step * (i + 1);

    const countResult = await query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${PRODUCT_TABLE}" p
         LEFT JOIN LATERAL (
           SELECT "priceCents" FROM "productBasePrice"
           WHERE "productId" = p."productId" AND "productVariantId" IS NULL
           ORDER BY "priceCents" ASC LIMIT 1
         ) bp ON true
         WHERE p."deletedAt" IS NULL AND p."status" = 'active'
           AND bp."priceCents" >= $1 AND bp."priceCents" <= $2`,
      [min, max],
    );
    const count = parseInt(countResult?.[0]?.count || '0', 10);
    if (count > 0) ranges.push({ min, max, count });
  }

  return ranges;
}

async function getAttributeFacets(): Promise<SearchAttributeFacet[]> {
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
  >(`
      SELECT
        pa."productAttributeId" as "attributeId",
        pa."code" as "attributeCode",
        pa."name" as "attributeName",
        pa."type",
        pavm."value",
        COALESCE(pavl."displayValue", pavm."value") as "displayValue",
        COUNT(DISTINCT pavm."productId") as count
      FROM "${ATTRIBUTE_TABLE}" pa
      JOIN "${ATTRIBUTE_VALUE_MAP_TABLE}" pavm ON pavm."attributeId" = pa."productAttributeId"
      JOIN "${PRODUCT_TABLE}" p ON p."productId" = pavm."productId"
      LEFT JOIN "${ATTRIBUTE_VALUE_TABLE}" pavl ON pavl."attributeId" = pa."productAttributeId" AND pavl."value" = pavm."value"
      WHERE pa."isFilterable" = true
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      GROUP BY pa."productAttributeId", pa."code", pa."name", pa."type", pavm."value", pavl."displayValue"
      ORDER BY pa."position" ASC, count DESC
    `);

  if (!results) return [];

  const attributeMap = new Map<string, SearchAttributeFacet>();
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
