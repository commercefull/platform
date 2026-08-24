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
import type {
  SearchAdapter,
  SearchQuery,
  SearchResult,
  SearchProductItem,
  SearchFacets,
  SearchFacetValue,
  SearchPriceRangeFacet,
  SearchAttributeFacet,
  AutocompleteSuggestion,
  MerchandisingContext,
  ManualOrderingContext,
} from './types';

const PRODUCT_TABLE = Table.Product;
const CATEGORY_MAP_TABLE = Table.ProductCategoryMap;
const ATTRIBUTE_VALUE_MAP_TABLE = Table.ProductAttributeValueMap;
const ATTRIBUTE_TABLE = Table.ProductAttribute;
const ATTRIBUTE_VALUE_TABLE = Table.ProductAttributeValue;
const CATEGORY_TABLE = Table.ProductCategory;

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
      facets = await this.computeFacets(searchQuery);
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
      SELECT DISTINCT
        p."name" as text,
        'product' as type,
        p."productId"
      FROM "${PRODUCT_TABLE}" p
      WHERE p."deletedAt" IS NULL
        AND p."status" = 'active'
        AND p."name" ILIKE $1
      ORDER BY similarity(p."name", $2) DESC
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
    const result = await query<Array<{ count: string }>>(
      `SELECT COUNT(*) as count FROM "${PRODUCT_TABLE}" WHERE "deletedAt" IS NULL`,
    );
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
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    const joins: string[] = [];

    // Full-text search using tsvector
    if (searchQuery.query) {
      joins.push(`LEFT JOIN "productVariant" pv_search ON pv_search."productId" = p."productId"`);
      conditions.push(`(
        to_tsvector('english', coalesce(p."name", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."shortDescription", '') || ' ' || coalesce(p."sku", ''))
        @@ plainto_tsquery('english', $${paramIndex})
        OR p."name" ILIKE $${paramIndex + 1}
        OR p."sku" ILIKE $${paramIndex + 1}
        OR pv_search."sku" ILIKE $${paramIndex + 1}
        OR pv_search."barcode" ILIKE $${paramIndex + 1}
      )`);
      params.push(searchQuery.query, `%${searchQuery.query}%`);
      paramIndex += 2;
    }

    // Category filter
    if (searchQuery.categoryId) {
      joins.push(`JOIN "${CATEGORY_MAP_TABLE}" pcm ON pcm."productId" = p."productId"`);
      conditions.push(`pcm."productCategoryId" = $${paramIndex}`);
      params.push(searchQuery.categoryId);
      paramIndex++;
    } else if (searchQuery.categoryIds && searchQuery.categoryIds.length > 0) {
      joins.push(`JOIN "${CATEGORY_MAP_TABLE}" pcm ON pcm."productId" = p."productId"`);
      conditions.push(`pcm."productCategoryId" = ANY($${paramIndex})`);
      params.push(searchQuery.categoryIds);
      paramIndex++;
    }

    // Product type
    if (searchQuery.productTypeId) {
      conditions.push(`p."type" = $${paramIndex}`);
      params.push(searchQuery.productTypeId);
      paramIndex++;
    }

    // Price range
    if (searchQuery.minPrice !== undefined) {
      conditions.push(`p."price" >= $${paramIndex}`);
      params.push(searchQuery.minPrice);
      paramIndex++;
    }
    if (searchQuery.maxPrice !== undefined) {
      conditions.push(`p."price" <= $${paramIndex}`);
      params.push(searchQuery.maxPrice);
      paramIndex++;
    }

    // Status
    if (searchQuery.status) {
      conditions.push(`p."status" = $${paramIndex}`);
      params.push(searchQuery.status);
      paramIndex++;
    }
    if (searchQuery.visibility) {
      conditions.push(`p."visibility" = $${paramIndex}`);
      params.push(searchQuery.visibility);
      paramIndex++;
    }

    // Boolean filters
    if (searchQuery.isFeatured !== undefined) {
      conditions.push(`p."isFeatured" = $${paramIndex}`);
      params.push(searchQuery.isFeatured);
      paramIndex++;
    }
    if (searchQuery.isNew !== undefined) {
      conditions.push(`p."isNew" = $${paramIndex}`);
      params.push(searchQuery.isNew);
      paramIndex++;
    }
    if (searchQuery.isBestseller !== undefined) {
      conditions.push(`p."isBestseller" = $${paramIndex}`);
      params.push(searchQuery.isBestseller);
      paramIndex++;
    }
    if (searchQuery.hasVariants !== undefined) {
      conditions.push(`p."hasVariants" = $${paramIndex}`);
      params.push(searchQuery.hasVariants);
      paramIndex++;
    }

    // Attribute filters
    if (searchQuery.attributes && searchQuery.attributes.length > 0) {
      for (const attrFilter of searchQuery.attributes) {
        const attrAlias = `pav_${paramIndex}`;
        let attrJoin = `JOIN "${ATTRIBUTE_VALUE_MAP_TABLE}" ${attrAlias} ON ${attrAlias}."productId" = p."productId"`;

        if (attrFilter.attributeId) {
          attrJoin += ` AND ${attrAlias}."attributeId" = $${paramIndex}`;
          params.push(attrFilter.attributeId);
          paramIndex++;
        } else if (attrFilter.attributeCode) {
          const attrTableAlias = `pa_${paramIndex}`;
          joins.push(`JOIN "${ATTRIBUTE_TABLE}" ${attrTableAlias} ON ${attrTableAlias}."code" = $${paramIndex}`);
          params.push(attrFilter.attributeCode);
          paramIndex++;
          attrJoin += ` AND ${attrAlias}."attributeId" = ${attrTableAlias}."productAttributeId"`;
        }

        joins.push(attrJoin);

        const operator = attrFilter.operator || 'eq';
        switch (operator) {
          case 'eq':
            if (attrFilter.value) {
              conditions.push(`${attrAlias}."value" = $${paramIndex}`);
              params.push(attrFilter.value);
              paramIndex++;
            }
            break;
          case 'neq':
            if (attrFilter.value) {
              conditions.push(`${attrAlias}."value" != $${paramIndex}`);
              params.push(attrFilter.value);
              paramIndex++;
            }
            break;
          case 'in':
            if (attrFilter.values && attrFilter.values.length > 0) {
              conditions.push(`${attrAlias}."value" = ANY($${paramIndex})`);
              params.push(attrFilter.values);
              paramIndex++;
            }
            break;
          case 'nin':
            if (attrFilter.values && attrFilter.values.length > 0) {
              conditions.push(`${attrAlias}."value" != ALL($${paramIndex})`);
              params.push(attrFilter.values);
              paramIndex++;
            }
            break;
          case 'gt':
            if (attrFilter.minValue !== undefined) {
              conditions.push(`CAST(${attrAlias}."value" AS NUMERIC) > $${paramIndex}`);
              params.push(attrFilter.minValue);
              paramIndex++;
            }
            break;
          case 'gte':
            if (attrFilter.minValue !== undefined) {
              conditions.push(`CAST(${attrAlias}."value" AS NUMERIC) >= $${paramIndex}`);
              params.push(attrFilter.minValue);
              paramIndex++;
            }
            break;
          case 'lt':
            if (attrFilter.maxValue !== undefined) {
              conditions.push(`CAST(${attrAlias}."value" AS NUMERIC) < $${paramIndex}`);
              params.push(attrFilter.maxValue);
              paramIndex++;
            }
            break;
          case 'lte':
            if (attrFilter.maxValue !== undefined) {
              conditions.push(`CAST(${attrAlias}."value" AS NUMERIC) <= $${paramIndex}`);
              params.push(attrFilter.maxValue);
              paramIndex++;
            }
            break;
          case 'between':
            if (attrFilter.minValue !== undefined && attrFilter.maxValue !== undefined) {
              conditions.push(`CAST(${attrAlias}."value" AS NUMERIC) BETWEEN $${paramIndex} AND $${paramIndex + 1}`);
              params.push(attrFilter.minValue, attrFilter.maxValue);
              paramIndex += 2;
            }
            break;
          case 'like':
            if (attrFilter.value) {
              conditions.push(`${attrAlias}."value" ILIKE $${paramIndex}`);
              params.push(`%${attrFilter.value}%`);
              paramIndex++;
            }
            break;
        }
      }
    }

    // Always exclude deleted
    conditions.push(`p."deletedAt" IS NULL`);

    const whereClause = `WHERE ${conditions.join(' AND ')}`;
    const joinClause = joins.join(' ');

    // Build ORDER BY with relevance scoring
    let orderBy = 'p."createdAt" DESC';
    const sortOrder = searchQuery.sortOrder || 'desc';

    switch (searchQuery.sortBy) {
      case 'name':
        orderBy = `p."name" ${sortOrder.toUpperCase()}`;
        break;
      case 'price':
        orderBy = `p."price" ${sortOrder.toUpperCase()}`;
        break;
      case 'createdAt':
        orderBy = `p."createdAt" ${sortOrder.toUpperCase()}`;
        break;
      case 'popularity':
        orderBy = `p."reviewCount" ${sortOrder.toUpperCase()}, p."averageRating" ${sortOrder.toUpperCase()}`;
        break;
      case 'rating':
        orderBy = `p."averageRating" ${sortOrder.toUpperCase()} NULLS LAST`;
        break;
      case 'relevance':
        if (searchQuery.query) {
          // Use ts_rank_cd for relevance scoring
          const tsvectorExpr = `to_tsvector('english', coalesce(p."name", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."shortDescription", ''))`;
          const tsqueryParam = paramIndex;
          orderBy = `ts_rank_cd(${tsvectorExpr}, plainto_tsquery('english', $${tsqueryParam})) DESC, p."isFeatured" DESC, p."createdAt" DESC`;
          params.push(searchQuery.query);
          paramIndex++;
        } else {
          orderBy = `p."isFeatured" DESC, p."createdAt" DESC`;
        }
        break;
      case 'manual':
        // Manual ordering is applied post-query in applyManualOrdering()
        orderBy = `p."createdAt" DESC`;
        break;
    }

    // Build SELECT with score for relevance
    let scoreExpr = '';
    if (searchQuery.query && searchQuery.sortBy === 'relevance') {
      const tsvectorExpr = `to_tsvector('english', coalesce(p."name", '') || ' ' || coalesce(p."description", '') || ' ' || coalesce(p."shortDescription", ''))`;
      scoreExpr = `, ts_rank_cd(${tsvectorExpr}, plainto_tsquery('english', $${paramIndex})) as score`;
      params.push(searchQuery.query);
      paramIndex++;
    }

    const sql = `
      SELECT DISTINCT
        p."productId",
        p."name",
        p."slug",
        p."sku",
        p."price",
        p."status",
        p."visibility",
        p."isFeatured",
        p."isNew",
        p."isBestseller",
        p."averageRating",
        p."reviewCount",
        p."shortDescription"
        ${scoreExpr}
      FROM "${PRODUCT_TABLE}" p
      ${joinClause}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    // Count query (no limit/offset, no score)
    const countParams = params.slice(0, paramIndex - 1);
    const countSql = `
      SELECT COUNT(DISTINCT p."productId") as count
      FROM "${PRODUCT_TABLE}" p
      ${joinClause}
      ${whereClause}
    `;

    return { sql, countSql, params, countParams };
  }

  // ===========================================================================
  // Private: Facets
  // ===========================================================================

  private async computeFacets(searchQuery: SearchQuery): Promise<SearchFacets> {
    const [categories, priceRanges, attributes] = await Promise.all([
      this.getCategoryFacets(searchQuery),
      this.getPriceRangeFacets(searchQuery),
      this.getAttributeFacets(searchQuery),
    ]);

    return { categories, priceRanges, attributes };
  }

  private async getCategoryFacets(_searchQuery: SearchQuery): Promise<SearchFacetValue[]> {
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

  private async getPriceRangeFacets(_searchQuery: SearchQuery): Promise<SearchPriceRangeFacet[]> {
    const result = await query<Array<{ min_price: number; max_price: number }>>(`
      SELECT
        MIN(p."price") as min_price,
        MAX(p."price") as max_price
      FROM "${PRODUCT_TABLE}" p
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
         WHERE p."deletedAt" IS NULL AND p."status" = 'active'
           AND p."price" >= $1 AND p."price" <= $2`,
        [min, max],
      );
      const count = parseInt(countResult?.[0]?.count || '0', 10);
      if (count > 0) ranges.push({ min, max, count });
    }

    return ranges;
  }

  private async getAttributeFacets(_searchQuery: SearchQuery): Promise<SearchAttributeFacet[]> {
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
        pav."value",
        COALESCE(pavl."displayValue", pav."value") as "displayValue",
        COUNT(DISTINCT pavm."productId") as count
      FROM "${ATTRIBUTE_TABLE}" pa
      JOIN "${ATTRIBUTE_VALUE_MAP_TABLE}" pavm ON pavm."attributeId" = pa."productAttributeId"
      JOIN "${PRODUCT_TABLE}" p ON p."productId" = pavm."productId"
      LEFT JOIN "${ATTRIBUTE_VALUE_TABLE}" pavl ON pavl."attributeId" = pa."productAttributeId" AND pavl."value" = pavm."value"
      WHERE pa."isFilterable" = true
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      GROUP BY pa."productAttributeId", pa."code", pa."name", pa."type", pav."value", pavl."displayValue"
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

  // ===========================================================================
  // Private: Merchandising
  // ===========================================================================

  private applyMerchandising(
    products: SearchProductItem[],
    merch: MerchandisingContext,
  ): SearchProductItem[] {
    const boostSet = new Set(merch.boostProductIds || []);
    const burySet = new Set(merch.buryProductIds || []);
    const pinnedMap = new Map<string, number>(
      (merch.pinnedProducts || []).map(p => [p.productId, p.position]),
    );

    const featuredBoost = merch.featuredBoost ?? 1;
    const bestsellerBoost = merch.bestsellerBoost ?? 1;
    const newBoost = merch.newBoost ?? 1;

    // Apply boost factors to score
    for (const product of products) {
      if (product.score !== undefined) {
        if (product.isFeatured) product.score *= featuredBoost;
        if (product.isBestseller) product.score *= bestsellerBoost;
        if (product.isNew) product.score *= newBoost;
      }
    }

    // Separate pinned, boosted, normal, buried
    const pinned: SearchProductItem[] = [];
    const boosted: SearchProductItem[] = [];
    const normal: SearchProductItem[] = [];
    const buried: SearchProductItem[] = [];

    for (const product of products) {
      if (pinnedMap.has(product.productId)) {
        product.merchandisingApplied = 'pinned';
        pinned.push(product);
      } else if (boostSet.has(product.productId)) {
        product.merchandisingApplied = 'boosted';
        boosted.push(product);
      } else if (burySet.has(product.productId)) {
        product.merchandisingApplied = 'buried';
        buried.push(product);
      } else {
        normal.push(product);
      }
    }

    // Sort pinned by their position
    pinned.sort((a, b) => (pinnedMap.get(a.productId) ?? 0) - (pinnedMap.get(b.productId) ?? 0));

    // Sort boosted/normal by score (if available) then by createdAt
    const sortByScore = (a: SearchProductItem, b: SearchProductItem) =>
      (b.score ?? 0) - (a.score ?? 0);

    boosted.sort(sortByScore);
    normal.sort(sortByScore);

    return [...pinned, ...boosted, ...normal, ...buried];
  }

  // ===========================================================================
  // Private: Manual Ordering
  // ===========================================================================

  private applyManualOrdering(
    products: SearchProductItem[],
    manual: ManualOrderingContext,
  ): SearchProductItem[] {
    const orderMap = new Map<string, number>(
      manual.productIds.map((id, index) => [id, index]),
    );

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
