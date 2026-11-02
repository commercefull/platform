/**
 * PostgreSQL Full-Text Search Adapter
 *
 * Uses tsvector/tsquery for relevance-ranked search with highlighting.
 * This is the default search backend — no external services required.
 *
 * Features:
 * - GIN index on tsvector for fast full-text search
 * - Relevance ranking using ts_rank_cd
 * - Faceted search (categories, price ranges, attributes)
 * - Merchandising (boost/bury/pin)
 * - Per-category manual ordering
 * - Autocomplete with trigram similarity
 */

import { query } from '../db';
import { Table } from '../db/types';
import { logger } from '../logger';
import { computeFtsFacets } from './postgresFtsFacets';
import type {
  SearchAdapter,
  SearchQuery,
  SearchResult,
  SearchProductItem,
  SearchFacets,
  SearchAttributeFilter,
  AutocompleteSuggestion,
  MerchandisingContext,
  ManualOrderingContext,
} from './types';

const PRODUCT_TABLE = Table.Product;
const CATEGORY_MAP_TABLE = Table.ProductCategoryMap;
const ATTRIBUTE_VALUE_MAP_TABLE = Table.ProductAttributeValueMap;
const ATTRIBUTE_TABLE = Table.ProductAttribute;
const CATEGORY_TABLE = Table.ProductCategory;

// Product-level base price (integer cents) from the pricing-owned store
const BASE_PRICE_JOIN = `LEFT JOIN LATERAL (
        SELECT "priceCents" FROM "productBasePrice"
        WHERE "productId" = p."productId" AND "productVariantId" IS NULL
        ORDER BY "priceCents" ASC LIMIT 1
      ) bp ON true`;

const TSVECTOR_EXPR = `to_tsvector('english', coalesce(p."name", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."shortDescription", ''))`;

interface FtsQueryBuilder {
  joins: string[];
  conditions: string[];
  params: unknown[];
  paramIndex: number;
}

type AttributeOperator = NonNullable<SearchAttributeFilter['operator']>;

// Each handler returns the WHERE fragment and its bound values for one
// attribute-filter operator, or null when the filter has nothing to apply.
const ATTRIBUTE_OPERATOR_CONDITIONS: Record<
  AttributeOperator,
  (attrAlias: string, paramIndex: number, f: SearchAttributeFilter) => { sql: string; values: unknown[] } | null
> = {
  eq: (a, i, f) => (f.value ? { sql: `${a}."value" = $${i}`, values: [f.value] } : null),
  neq: (a, i, f) => (f.value ? { sql: `${a}."value" != $${i}`, values: [f.value] } : null),
  in: (a, i, f) => (f.values && f.values.length > 0 ? { sql: `${a}."value" = ANY($${i})`, values: [f.values] } : null),
  nin: (a, i, f) => (f.values && f.values.length > 0 ? { sql: `${a}."value" != ALL($${i})`, values: [f.values] } : null),
  gt: (a, i, f) => (f.minValue !== undefined ? { sql: `CAST(${a}."value" AS NUMERIC) > $${i}`, values: [f.minValue] } : null),
  gte: (a, i, f) => (f.minValue !== undefined ? { sql: `CAST(${a}."value" AS NUMERIC) >= $${i}`, values: [f.minValue] } : null),
  lt: (a, i, f) => (f.maxValue !== undefined ? { sql: `CAST(${a}."value" AS NUMERIC) < $${i}`, values: [f.maxValue] } : null),
  lte: (a, i, f) => (f.maxValue !== undefined ? { sql: `CAST(${a}."value" AS NUMERIC) <= $${i}`, values: [f.maxValue] } : null),
  between: (a, i, f) =>
    f.minValue !== undefined && f.maxValue !== undefined
      ? { sql: `CAST(${a}."value" AS NUMERIC) BETWEEN $${i} AND $${i + 1}`, values: [f.minValue, f.maxValue] }
      : null,
  like: (a, i, f) => (f.value ? { sql: `${a}."value" ILIKE $${i}`, values: [`%${f.value}%`] } : null),
};

/**
 * Multiply product scores by the configured merchandising boost factors.
 */
function applyScoreBoosts(products: SearchProductItem[], merch: MerchandisingContext): void {
  const featuredBoost = merch.featuredBoost ?? 1;
  const bestsellerBoost = merch.bestsellerBoost ?? 1;
  const newBoost = merch.newBoost ?? 1;

  for (const product of products) {
    if (product.score === undefined) continue;
    if (product.isFeatured) product.score *= featuredBoost;
    if (product.isBestseller) product.score *= bestsellerBoost;
    if (product.isNew) product.score *= newBoost;
  }
}

interface MerchandisingBuckets {
  pinned: SearchProductItem[];
  boosted: SearchProductItem[];
  normal: SearchProductItem[];
  buried: SearchProductItem[];
}

/**
 * Separate products into pinned / boosted / normal / buried buckets.
 * Flags each product with the applied merchandising treatment.
 */
function bucketizeMerchandised(
  products: SearchProductItem[],
  boostSet: Set<string>,
  burySet: Set<string>,
  pinnedMap: Map<string, number>,
): MerchandisingBuckets {
  const buckets: MerchandisingBuckets = { pinned: [], boosted: [], normal: [], buried: [] };

  for (const product of products) {
    if (pinnedMap.has(product.productId)) {
      product.merchandisingApplied = 'pinned';
      buckets.pinned.push(product);
    } else if (boostSet.has(product.productId)) {
      product.merchandisingApplied = 'boosted';
      buckets.boosted.push(product);
    } else if (burySet.has(product.productId)) {
      product.merchandisingApplied = 'buried';
      buckets.buried.push(product);
    } else {
      buckets.normal.push(product);
    }
  }

  return buckets;
}

export class PostgresFtsAdapter implements SearchAdapter {
  /**
   * Search products using PostgreSQL full-text search
   */
  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const page = searchQuery.page || 1;
    const limit = searchQuery.limit || 20;
    const offset = searchQuery.offset || (page - 1) * limit;

    const { sql, countSql, params, countParams } = this.buildQuery(searchQuery, limit, offset);

    const [products, countResult] = await Promise.all([
      query<SearchProductItem[]>(sql, params),
      query<Array<{ count: string }>>(countSql, countParams),
    ]);

    const total = countResult ? parseInt(countResult[0]?.count || '0', 10) : 0;
    const totalPages = Math.ceil(total / limit);

    let facets: SearchFacets | undefined;
    if (searchQuery.includeFacets || (searchQuery.query && !searchQuery.categoryId)) {
      facets = await computeFtsFacets(searchQuery);
    }

    let resultProducts = (products || []) as SearchProductItem[];

    // Apply merchandising rules
    if (searchQuery.merchandising) {
      resultProducts = this.applyMerchandising(resultProducts, searchQuery.merchandising);
    }

    // Apply manual ordering
    if (searchQuery.manualOrdering && searchQuery.sortBy === 'manual') {
      resultProducts = this.applyManualOrdering(resultProducts, searchQuery.manualOrdering);
    }

    return {
      products: resultProducts,
      total,
      page,
      limit,
      totalPages,
      facets,
    };
  }

  /**
   * Autocomplete using trigram similarity (pg_trgm)
   */
  async autocomplete(partialQuery: string, limit: number = 10): Promise<AutocompleteSuggestion[]> {
    if (!partialQuery || partialQuery.length < 2) return [];

    const suggestions = await query<AutocompleteSuggestion[]>(
      `
      SELECT text, type, "productId" FROM (
        SELECT DISTINCT
          p."name" as text,
          'product' as type,
          p."productId",
          similarity(p."name", $2) AS score
        FROM "${PRODUCT_TABLE}" p
        WHERE p."deletedAt" IS NULL
          AND p."status" = 'active'
          AND p."name" ILIKE $1
      ) s
      ORDER BY score DESC
      LIMIT $3
      `,
      [`%${partialQuery}%`, partialQuery, limit],
    );

    // Also suggest categories
    const categorySuggestions = await query<AutocompleteSuggestion[]>(
      `
      SELECT DISTINCT
        c."name" as text,
        'category' as type,
        c."productCategoryId" as "categoryId"
      FROM "${CATEGORY_TABLE}" c
      WHERE c."name" ILIKE $1
      ORDER BY c."name"
      LIMIT $2
      `,
      [`%${partialQuery}%`, Math.min(limit, 3)],
    );

    return [...(suggestions || []), ...(categorySuggestions || [])].slice(0, limit);
  }

  /**
   * Index a single product (no-op for Postgres FTS — tsvector is generated at query time)
   */
  async indexProduct(_productId: string): Promise<void> {
    // No-op: Postgres FTS generates tsvector at query time via to_tsvector()
  }

  /**
   * Index all products (no-op for Postgres FTS)
   */
  async indexAll(): Promise<number> {
    const result = await query<Array<{ count: string }>>(`SELECT COUNT(*) as count FROM "${PRODUCT_TABLE}" WHERE "deletedAt" IS NULL`);
    const count = parseInt(result?.[0]?.count || '0', 10);
    logger.info('PostgresFtsAdapter: indexAll (no-op, tsvector generated at query time)', { productCount: count });
    return count;
  }

  /**
   * Remove a product from the index (no-op for Postgres FTS)
   */
  async removeProduct(_productId: string): Promise<void> {
    // No-op: Postgres FTS generates tsvector at query time
  }

  /**
   * Health check
   */
  async health(): Promise<{ healthy: boolean; details?: Record<string, unknown> }> {
    try {
      await query('SELECT 1');
      return { healthy: true, details: { backend: 'postgres-fts' } };
    } catch {
      return { healthy: false, details: { backend: 'postgres-fts', error: 'Database connection failed' } };
    }
  }

  // ===========================================================================
  // Private: Query Builder
  // ===========================================================================

  private buildQuery(
    searchQuery: SearchQuery,
    limit: number,
    offset: number,
  ): { sql: string; countSql: string; params: unknown[]; countParams: unknown[] } {
    const b: FtsQueryBuilder = {
      joins: [BASE_PRICE_JOIN],
      conditions: [],
      params: [],
      paramIndex: 1,
    };

    this.addTextSearchCondition(b, searchQuery);
    this.addCategoryFilter(b, searchQuery);
    this.addScalarFilters(b, searchQuery);
    this.addAttributeFilters(b, searchQuery);

    // Always exclude deleted
    b.conditions.push(`p."deletedAt" IS NULL`);

    const whereClause = `WHERE ${b.conditions.join(' AND ')}`;
    const joinClause = b.joins.join(' ');

    const orderBy = this.buildOrderBy(b, searchQuery);
    const scoreExpr = this.buildScoreExpr(b, searchQuery);

    const sql = `
      SELECT DISTINCT
        p."productId",
        p."name",
        p."slug",
        p."sku",
        bp."priceCents",
        p."status",
        p."visibility",
        p."isFeatured",
        p."isNew",
        p."isBestseller",
        p."averageRating",
        p."reviewCount",
        p."shortDescription",
        p."createdAt"
        ${scoreExpr}
      FROM "${PRODUCT_TABLE}" p
      ${joinClause}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${b.paramIndex} OFFSET $${b.paramIndex + 1}
    `;

    b.params.push(limit, offset);

    // Count query (no limit/offset, no score)
    const countParams = b.params.slice(0, b.paramIndex - 1);
    const countSql = `
      SELECT COUNT(DISTINCT p."productId") as count
      FROM "${PRODUCT_TABLE}" p
      ${joinClause}
      ${whereClause}
    `;

    return { sql, countSql, params: b.params, countParams };
  }

  // Full-text search using tsvector + ILIKE fallback on SKU/barcode
  private addTextSearchCondition(b: FtsQueryBuilder, searchQuery: SearchQuery): void {
    if (!searchQuery.query) return;

    b.joins.push(`LEFT JOIN "productVariant" pv_search ON pv_search."productId" = p."productId"`);
    b.conditions.push(`(
        to_tsvector('english', coalesce(p."name", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."shortDescription", '') || ' ' || coalesce(p."sku", ''))
        @@ plainto_tsquery('english', $${b.paramIndex})
        OR p."name" ILIKE $${b.paramIndex + 1}
        OR p."sku" ILIKE $${b.paramIndex + 1}
        OR pv_search."sku" ILIKE $${b.paramIndex + 1}
        OR pv_search."barcode" ILIKE $${b.paramIndex + 1}
      )`);
    b.params.push(searchQuery.query, `%${searchQuery.query}%`);
    b.paramIndex += 2;
  }

  // Category filter — single id or list
  private addCategoryFilter(b: FtsQueryBuilder, searchQuery: SearchQuery): void {
    if (searchQuery.categoryId) {
      b.joins.push(`JOIN "${CATEGORY_MAP_TABLE}" pcm ON pcm."productId" = p."productId"`);
      b.conditions.push(`pcm."productCategoryId" = $${b.paramIndex}`);
      b.params.push(searchQuery.categoryId);
      b.paramIndex++;
    } else if (searchQuery.categoryIds && searchQuery.categoryIds.length > 0) {
      b.joins.push(`JOIN "${CATEGORY_MAP_TABLE}" pcm ON pcm."productId" = p."productId"`);
      b.conditions.push(`pcm."productCategoryId" = ANY($${b.paramIndex})`);
      b.params.push(searchQuery.categoryIds);
      b.paramIndex++;
    }
  }

  // Product type, price range, status/visibility and boolean flags
  private addScalarFilters(b: FtsQueryBuilder, searchQuery: SearchQuery): void {
    const clauses: [unknown, string][] = [
      [searchQuery.productTypeId, `p."type" =`],
      [searchQuery.minPriceCents, `bp."priceCents" >=`],
      [searchQuery.maxPriceCents, `bp."priceCents" <=`],
      [searchQuery.status, `p."status" =`],
      [searchQuery.visibility, `p."visibility" =`],
      [searchQuery.isFeatured, `p."isFeatured" =`],
      [searchQuery.isNew, `p."isNew" =`],
      [searchQuery.isBestseller, `p."isBestseller" =`],
      [searchQuery.hasVariants, `p."hasVariants" =`],
    ];

    for (const [value, clause] of clauses) {
      if (value === undefined) continue;
      b.conditions.push(`${clause} $${b.paramIndex}`);
      b.params.push(value);
      b.paramIndex++;
    }
  }

  // Dynamic attribute filters — one join per filter
  private addAttributeFilters(b: FtsQueryBuilder, searchQuery: SearchQuery): void {
    if (!searchQuery.attributes || searchQuery.attributes.length === 0) return;

    for (const attrFilter of searchQuery.attributes) {
      const attrAlias = `pav_${b.paramIndex}`;
      let attrJoin = `JOIN "${ATTRIBUTE_VALUE_MAP_TABLE}" ${attrAlias} ON ${attrAlias}."productId" = p."productId"`;

      if (attrFilter.attributeId) {
        attrJoin += ` AND ${attrAlias}."attributeId" = $${b.paramIndex}`;
        b.params.push(attrFilter.attributeId);
        b.paramIndex++;
      } else if (attrFilter.attributeCode) {
        const attrTableAlias = `pa_${b.paramIndex}`;
        b.joins.push(`JOIN "${ATTRIBUTE_TABLE}" ${attrTableAlias} ON ${attrTableAlias}."code" = $${b.paramIndex}`);
        b.params.push(attrFilter.attributeCode);
        b.paramIndex++;
        attrJoin += ` AND ${attrAlias}."attributeId" = ${attrTableAlias}."productAttributeId"`;
      }

      b.joins.push(attrJoin);
      this.addAttributeValueCondition(b, attrAlias, attrFilter);
    }
  }

  private addAttributeValueCondition(b: FtsQueryBuilder, attrAlias: string, attrFilter: SearchAttributeFilter): void {
    const operator = attrFilter.operator || 'eq';
    const result = ATTRIBUTE_OPERATOR_CONDITIONS[operator](attrAlias, b.paramIndex, attrFilter);
    if (!result) return;

    b.conditions.push(result.sql);
    b.params.push(...result.values);
    b.paramIndex += result.values.length;
  }

  // ORDER BY — relevance pushes an extra tsquery param onto the builder
  private buildOrderBy(b: FtsQueryBuilder, searchQuery: SearchQuery): string {
    const sortOrder = (searchQuery.sortOrder || 'desc').toUpperCase();

    switch (searchQuery.sortBy) {
      case 'name':
        return `p."name" ${sortOrder}`;
      case 'price':
        return `bp."priceCents" ${sortOrder}`;
      case 'createdAt':
        return `p."createdAt" ${sortOrder}`;
      case 'popularity':
        return `p."reviewCount" ${sortOrder}, p."averageRating" ${sortOrder}`;
      case 'rating':
        return `p."averageRating" ${sortOrder} NULLS LAST`;
      case 'relevance':
        if (searchQuery.query) {
          // Use ts_rank_cd for relevance scoring
          const tsqueryParam = b.paramIndex;
          b.params.push(searchQuery.query);
          b.paramIndex++;
          return `ts_rank_cd(${TSVECTOR_EXPR}, plainto_tsquery('english', $${tsqueryParam})) DESC, p."isFeatured" DESC, p."createdAt" DESC`;
        }
        return `p."isFeatured" DESC, p."createdAt" DESC`;
      case 'manual':
      default:
        // Manual ordering is applied post-query in applyManualOrdering()
        return `p."createdAt" DESC`;
    }
  }

  // SELECT score expression for relevance sort — pushes another tsquery param
  private buildScoreExpr(b: FtsQueryBuilder, searchQuery: SearchQuery): string {
    if (!searchQuery.query || searchQuery.sortBy !== 'relevance') return '';

    const expr = `, ts_rank_cd(${TSVECTOR_EXPR}, plainto_tsquery('english', $${b.paramIndex})) as score`;
    b.params.push(searchQuery.query);
    b.paramIndex++;
    return expr;
  }

  // ===========================================================================
  // Private: Merchandising
  // ===========================================================================

  private applyMerchandising(products: SearchProductItem[], merch: MerchandisingContext): SearchProductItem[] {
    applyScoreBoosts(products, merch);

    const pinnedMap = new Map<string, number>((merch.pinnedProducts || []).map(p => [p.productId, p.position]));
    const buckets = bucketizeMerchandised(products, new Set(merch.boostProductIds || []), new Set(merch.buryProductIds || []), pinnedMap);

    // Sort pinned by their position
    buckets.pinned.sort((a, b) => (pinnedMap.get(a.productId) ?? 0) - (pinnedMap.get(b.productId) ?? 0));

    // Sort boosted/normal by score (if available) then by createdAt
    const sortByScore = (a: SearchProductItem, b: SearchProductItem) => (b.score ?? 0) - (a.score ?? 0);
    buckets.boosted.sort(sortByScore);
    buckets.normal.sort(sortByScore);

    return [...buckets.pinned, ...buckets.boosted, ...buckets.normal, ...buckets.buried];
  }

  // ===========================================================================
  // Private: Manual Ordering
  // ===========================================================================

  private applyManualOrdering(products: SearchProductItem[], manual: ManualOrderingContext): SearchProductItem[] {
    const orderMap = new Map<string, number>(manual.productIds.map((id, index) => [id, index]));

    const ordered: SearchProductItem[] = [];
    const unordered: SearchProductItem[] = [];

    for (const product of products) {
      if (orderMap.has(product.productId)) {
        product.merchandisingApplied = 'manual';
        ordered.push(product);
      } else {
        unordered.push(product);
      }
    }

    // Sort ordered products by their manual position
    ordered.sort((a, b) => (orderMap.get(a.productId) ?? 0) - (orderMap.get(b.productId) ?? 0));

    return [...ordered, ...unordered];
  }
}
