import { query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import type { Product as DbProduct } from '../../../../libs/db/types';
import { logger } from '../../../../libs/logger';
import { createCache } from '../../../../libs/cache';
import {
  AttributeFilter,
  ProductSearchFilters,
  ProductSearchResult,
  ProductSearchRow,
  SearchFacets,
  FacetValue,
  PriceRangeFacet,
  AttributeFacet,
  ProductSearchServicePort,
} from '../../application/ports/ProductSearchPort';

export type { ProductSearchRow } from '../../application/ports/ProductSearchPort';

interface FilterArmBuilder {
  joins: string[];
  conditions: string[];
  params: unknown[];
  paramIndex: number;
}

type AttributeOperator = NonNullable<AttributeFilter['operator']>;

// Each handler returns the WHERE fragment and its bound values for one
// attribute-filter operator, or null when the filter has nothing to apply.
const ATTRIBUTE_OPERATOR_CONDITIONS: Record<
  AttributeOperator,
  (attrAlias: string, paramIndex: number, f: AttributeFilter) => { sql: string; values: unknown[] } | null
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

const PRICE_COLUMNS_SQL = `
  bp."priceCents" AS "priceCents",
  bp."salePriceCents" AS "salePriceCents",
  COALESCE(bp."salePriceCents", bp."priceCents") AS "effectivePriceCents",
  bp."currencyCode" AS "currencyCode"
`;

const PRICE_JOIN_SQL = `
  LEFT JOIN LATERAL (
    SELECT "priceCents", "salePriceCents", "currencyCode"
    FROM "productBasePrice" bp_inner
    WHERE bp_inner."productId" = p."productId"
      AND bp_inner."productVariantId" IS NULL
    ORDER BY bp_inner."currencyCode" ASC
    LIMIT 1
  ) bp ON true
`;

function mapSearchRow(row: Record<string, unknown>): ProductSearchRow {
  const cents = (v: unknown): number | null => (v == null ? null : Number(v));
  const priceCents = cents(row.priceCents);
  const salePriceCents = cents(row.salePriceCents);
  return {
    ...(row as DbProduct),
    priceCents,
    salePriceCents,
    effectivePriceCents: salePriceCents ?? priceCents,
    currencyCode: (row.currencyCode as string | null) ?? null,
  };
}

// Facets aggregate over the whole active catalog (the facet queries ignore
// request filters), so one short-TTL entry serves every shopper. Product
// mutations settle within the TTL — facet counts are display-only.
const facetsCache = createCache<SearchFacets>({ namespace: 'productFacets', ttlMs: 60_000 });

class ProductSearchService implements ProductSearchServicePort {
  private readonly productTable = Table.Product;
  private readonly categoryMapTable = Table.ProductCategoryMap;
  private readonly attributeValueMapTable = Table.ProductAttributeValueMap;
  private readonly attributeTable = Table.ProductAttribute;
  private readonly attributeValueTable = Table.ProductAttributeValue;

  /**
   * Search products with filters and faceted search
   */
  async search(filters: ProductSearchFilters): Promise<ProductSearchResult> {
    try {
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = filters.offset || (page - 1) * limit;

      // Build the query
      const { sql, countSql, params } = this.buildSearchQuery(filters, limit, offset);

      // Execute queries in parallel
      const [rows, countResult] = await Promise.all([
        query<DbProduct[]>(sql, params),
        query<Array<{ count: string }>>(countSql, params.slice(0, -2)), // Remove limit/offset params
      ]);

      const products: ProductSearchRow[] = (rows || []).map(mapSearchRow);

      const total = countResult ? parseInt(countResult[0]?.count || '0', 10) : 0;
      const totalPages = Math.ceil(total / limit);

      // Get facets if requested
      let facets: SearchFacets | undefined;
      if (filters.query || Object.keys(filters).length > 3) {
        // Only compute facets for actual searches
        facets = await this.computeFacets(filters);
      }

      return {
        products,
        total,
        page,
        limit,
        totalPages,
        facets,
      };
    } catch (error) {
      logger.error('Product search failed', { error: (error as Error).message });
      throw error;
    }
  }

  /**
   * Build the search SQL query
   *
   * When a text query is present the search is split into a UNION of two
   * arms — product-column matches and variant-column matches — because a
   * single OR across the product/productVariant join boundary cannot use
   * trigram index scans (Postgres cannot BitmapOr across a join). Each arm
   * is index-assistable on its own.
   */
  private buildSearchQuery(
    filters: ProductSearchFilters,
    limit: number,
    offset: number,
  ): { sql: string; countSql: string; params: unknown[] } {
    if (filters.query) {
      return this.buildUnionSearchQuery(filters, limit, offset);
    }
    const arm = this.buildFilterArm(filters, 'none', 1);
    return this.assembleSearchQuery({ arm, filters, limit, offset, alias: 'p' });
  }

  /**
   * Build the joins/conditions/params for one arm of the search query.
   * `searchMode` selects which text-search predicate this arm carries:
   * 'product' (product columns), 'variant' (variant sku/barcode via EXISTS),
   * or 'none' (no text search).
   */
  private buildFilterArm(
    filters: ProductSearchFilters,
    searchMode: 'product' | 'variant' | 'none',
    startParamIndex: number,
  ): { joins: string[]; conditions: string[]; params: unknown[]; nextParamIndex: number } {
    const b: FilterArmBuilder = { joins: [], conditions: [], params: [], paramIndex: startParamIndex };

    this.addTextSearchCondition(b, filters, searchMode);
    this.addCategoryFilter(b, filters);
    this.addScalarFilters(b, filters);
    this.addAttributeFilters(b, filters);

    // Always exclude deleted products
    b.conditions.push(`p."deletedAt" IS NULL`);

    return { joins: b.joins, conditions: b.conditions, params: b.params, nextParamIndex: b.paramIndex };
  }

  // Text search — product columns only; variant columns are handled by a
  // separate UNION arm so each side can use its own trigram indexes.
  private addTextSearchCondition(b: FilterArmBuilder, filters: ProductSearchFilters, searchMode: 'product' | 'variant' | 'none'): void {
    if (!filters.query) return;

    const searchTerm = `%${filters.query}%`;
    if (searchMode === 'product') {
      b.conditions.push(`(
        p."name" ILIKE $${b.paramIndex} OR
        p."description" ILIKE $${b.paramIndex} OR
        p."shortDescription" ILIKE $${b.paramIndex} OR
        p."sku" ILIKE $${b.paramIndex} OR
        p."slug" ILIKE $${b.paramIndex}
      )`);
      b.params.push(searchTerm);
      b.paramIndex++;
    } else if (searchMode === 'variant') {
      b.conditions.push(`EXISTS (
        SELECT 1 FROM "productVariant" pv_search
        WHERE pv_search."productId" = p."productId"
          AND (pv_search."sku" ILIKE $${b.paramIndex} OR pv_search."barcode" ILIKE $${b.paramIndex})
      )`);
      b.params.push(searchTerm);
      b.paramIndex++;
    }
  }

  private addCategoryFilter(b: FilterArmBuilder, filters: ProductSearchFilters): void {
    if (filters.categoryId) {
      b.joins.push(`JOIN "${this.categoryMapTable}" pcm ON pcm."productId" = p."productId"`);
      b.conditions.push(`pcm."productCategoryId" = $${b.paramIndex}`);
      b.params.push(filters.categoryId);
      b.paramIndex++;
    } else if (filters.categoryIds && filters.categoryIds.length > 0) {
      b.joins.push(`JOIN "${this.categoryMapTable}" pcm ON pcm."productId" = p."productId"`);
      b.conditions.push(`pcm."productCategoryId" = ANY($${b.paramIndex})`);
      b.params.push(filters.categoryIds);
      b.paramIndex++;
    }
  }

  private addScalarFilters(b: FilterArmBuilder, filters: ProductSearchFilters): void {
    if (filters.productTypeId) {
      b.conditions.push(`p."type" = $${b.paramIndex}`);
      b.params.push(filters.productTypeId);
      b.paramIndex++;
    }

    // Price filters — effective catalog price (integer cents) from the
    // pricing-owned productBasePrice table.
    if (filters.minPriceCents !== undefined) {
      b.conditions.push(`COALESCE(bp."salePriceCents", bp."priceCents") >= $${b.paramIndex}`);
      b.params.push(filters.minPriceCents);
      b.paramIndex++;
    }
    if (filters.maxPriceCents !== undefined) {
      b.conditions.push(`COALESCE(bp."salePriceCents", bp."priceCents") <= $${b.paramIndex}`);
      b.params.push(filters.maxPriceCents);
      b.paramIndex++;
    }

    if (filters.status) {
      b.conditions.push(`p."status" = $${b.paramIndex}`);
      b.params.push(filters.status);
      b.paramIndex++;
    }
    if (filters.visibility) {
      b.conditions.push(`p."visibility" = $${b.paramIndex}`);
      b.params.push(filters.visibility);
      b.paramIndex++;
    }

    if (filters.isFeatured !== undefined) {
      b.conditions.push(`p."isFeatured" = $${b.paramIndex}`);
      b.params.push(filters.isFeatured);
      b.paramIndex++;
    }
    if (filters.isNew !== undefined) {
      b.conditions.push(`p."isNew" = $${b.paramIndex}`);
      b.params.push(filters.isNew);
      b.paramIndex++;
    }
    if (filters.isBestseller !== undefined) {
      b.conditions.push(`p."isBestseller" = $${b.paramIndex}`);
      b.params.push(filters.isBestseller);
      b.paramIndex++;
    }
    if (filters.hasVariants !== undefined) {
      b.conditions.push(`p."hasVariants" = $${b.paramIndex}`);
      b.params.push(filters.hasVariants);
      b.paramIndex++;
    }
  }

  // Dynamic attribute filters
  private addAttributeFilters(b: FilterArmBuilder, filters: ProductSearchFilters): void {
    if (!filters.attributes || filters.attributes.length === 0) return;

    for (const attrFilter of filters.attributes) {
      const attrAlias = `pav_${b.paramIndex}`;

      // Join to attribute value map
      let attrJoin = `JOIN "${this.attributeValueMapTable}" ${attrAlias} ON ${attrAlias}."productId" = p."productId"`;

      // Filter by attribute ID or code
      if (attrFilter.attributeId) {
        attrJoin += ` AND ${attrAlias}."attributeId" = $${b.paramIndex}`;
        b.params.push(attrFilter.attributeId);
        b.paramIndex++;
      } else if (attrFilter.attributeCode) {
        // Need to join to attribute table to filter by code
        const attrTableAlias = `pa_${b.paramIndex}`;
        b.joins.push(`JOIN "${this.attributeTable}" ${attrTableAlias} ON ${attrTableAlias}."code" = $${b.paramIndex}`);
        b.params.push(attrFilter.attributeCode);
        b.paramIndex++;
        attrJoin += ` AND ${attrAlias}."attributeId" = ${attrTableAlias}."productAttributeId"`;
      }

      b.joins.push(attrJoin);

      this.addAttributeValueCondition(b, attrAlias, attrFilter);
    }
  }

  private addAttributeValueCondition(b: FilterArmBuilder, attrAlias: string, attrFilter: AttributeFilter): void {
    // Apply value filter based on operator
    const operator = attrFilter.operator || 'eq';
    const result = ATTRIBUTE_OPERATOR_CONDITIONS[operator](attrAlias, b.paramIndex, attrFilter);
    if (!result) return;

    b.conditions.push(result.sql);
    b.params.push(...result.values);
    b.paramIndex += result.values.length;
  }

  /**
   * Wrap one or two filter arms in the final SELECT / COUNT queries.
   * `alias` is the relation name ORDER BY columns reference ('p' for a
   * single arm, 't' for the UNION subquery).
   */
  private assembleSearchQuery(options: {
    arm: { joins: string[]; conditions: string[]; params: unknown[]; nextParamIndex: number };
    filters: ProductSearchFilters;
    limit: number;
    offset: number;
    alias: 'p' | 't';
    secondArm?: { joins: string[]; conditions: string[]; params: unknown[]; nextParamIndex: number };
  }): { sql: string; countSql: string; params: unknown[] } {
    const { arm, filters, limit, offset, alias, secondArm } = options;
    // Build ORDER BY clause
    let orderBy = `${alias}."createdAt" DESC`;
    const sortOrder = filters.sortOrder || 'desc';

    switch (filters.sortBy) {
      case 'name':
        orderBy = `${alias}."name" ${sortOrder.toUpperCase()}`;
        break;
      case 'price':
        // Output column from the productBasePrice LATERAL join — unqualified so
        // it resolves in both the single-arm query and the UNION wrapper.
        orderBy = `"effectivePriceCents" ${sortOrder.toUpperCase()} NULLS LAST`;
        break;
      case 'createdAt':
        orderBy = `${alias}."createdAt" ${sortOrder.toUpperCase()}`;
        break;
      case 'popularity':
        orderBy = `${alias}."reviewCount" ${sortOrder.toUpperCase()}, ${alias}."averageRating" ${sortOrder.toUpperCase()}`;
        break;
      case 'rating':
        orderBy = `${alias}."averageRating" ${sortOrder.toUpperCase()} NULLS LAST`;
        break;
      case 'relevance':
        if (filters.query) {
          // Relevance scoring based on text match; the search term is $1
          orderBy = `
            CASE
              WHEN ${alias}."name" ILIKE $1 THEN 1
              WHEN ${alias}."name" ILIKE '%' || $1 || '%' THEN 2
              WHEN ${alias}."sku" = $1 THEN 3
              ELSE 4
            END ASC, ${alias}."isFeatured" DESC, ${alias}."createdAt" DESC
          `;
        }
        break;
    }

    const armSql = (a: typeof arm, cols: string, withPrice: boolean) => `
      SELECT DISTINCT ${cols}
      FROM "${this.productTable}" p
      ${withPrice ? PRICE_JOIN_SQL : ''}
      ${a.joins.join(' ')}
      WHERE ${a.conditions.join(' AND ')}
    `;

    if (!secondArm) {
      const sql = `
        ${armSql(arm, `p.*, ${PRICE_COLUMNS_SQL}`, true)}
        ORDER BY ${orderBy}
        LIMIT $${arm.nextParamIndex} OFFSET $${arm.nextParamIndex + 1}
      `;

      const countSql = `
        SELECT COUNT(DISTINCT p."productId") as count
        FROM "${this.productTable}" p
        ${PRICE_JOIN_SQL}
        ${arm.joins.join(' ')}
        WHERE ${arm.conditions.join(' AND ')}
      `;

      return { sql, countSql, params: [...arm.params, limit, offset] };
    }

    const sql = `
      SELECT * FROM (
        ${armSql(arm, `p.*, ${PRICE_COLUMNS_SQL}`, true)}
        UNION
        ${armSql(secondArm, `p.*, ${PRICE_COLUMNS_SQL}`, true)}
      ) t
      ORDER BY ${orderBy}
      LIMIT $${secondArm.nextParamIndex} OFFSET $${secondArm.nextParamIndex + 1}
    `;

    const countSql = `
      SELECT COUNT(*) as count FROM (
        ${armSql(arm, 'p."productId"', true)}
        UNION
        ${armSql(secondArm, 'p."productId"', true)}
      ) t
    `;

    return { sql, countSql, params: [...arm.params, ...secondArm.params, limit, offset] };
  }

  /**
   * Text search across product columns and variant SKU/barcode.
   * UNION keeps each arm index-assistable; a plain OR across the join
   * boundary forces a full scan of both tables.
   */
  private buildUnionSearchQuery(
    filters: ProductSearchFilters,
    limit: number,
    offset: number,
  ): { sql: string; countSql: string; params: unknown[] } {
    const productArm = this.buildFilterArm(filters, 'product', 1);
    const variantArm = this.buildFilterArm(filters, 'variant', productArm.nextParamIndex);
    return this.assembleSearchQuery({ arm: productArm, filters, limit, offset, alias: 't', secondArm: variantArm });
  }

  /**
   * Compute facets for the current search
   */
  private async computeFacets(filters: ProductSearchFilters): Promise<SearchFacets> {
    return facetsCache.getOrSet('all', () => this.computeFacetsUncached(filters));
  }

  private async computeFacetsUncached(filters: ProductSearchFilters): Promise<SearchFacets> {
    const [categoryFacets, brandFacets, priceRangeFacets, attributeFacets] = await Promise.all([
      this.getCategoryFacets(filters),
      this.getBrandFacets(filters),
      this.getPriceRangeFacets(filters),
      this.getAttributeFacets(filters),
    ]);

    return {
      categories: categoryFacets,
      brands: brandFacets,
      priceRanges: priceRangeFacets,
      attributes: attributeFacets,
    };
  }

  private async getCategoryFacets(_filters: ProductSearchFilters): Promise<FacetValue[]> {
    const sql = `
      SELECT 
        pc."productCategoryId" as id,
        pc."name",
        COUNT(DISTINCT p."productId") as count
      FROM "${this.productTable}" p
      JOIN "${this.categoryMapTable}" pcm ON pcm."productId" = p."productId"
      JOIN "${Table.ProductCategory}" pc ON pc."productCategoryId" = pcm."productCategoryId"
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

  private async getBrandFacets(_filters: ProductSearchFilters): Promise<FacetValue[]> {
    const sql = `
      SELECT 
        b."brandId" as id,
        b."name",
        COUNT(DISTINCT p."productId") as count
      FROM "${this.productTable}" p
      JOIN "${Table.ProductBrand}" b ON b."brandId" = p."brandId"
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
  private async getPriceRangeFacets(_filters: ProductSearchFilters): Promise<PriceRangeFacet[]> {
    const sql = `
      SELECT
        MIN(COALESCE(bp."salePriceCents", bp."priceCents")) as min_price,
        MAX(COALESCE(bp."salePriceCents", bp."priceCents")) as max_price
      FROM "${this.productTable}" p
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
      FROM "${this.productTable}" p
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

  private async getAttributeFacets(_filters: ProductSearchFilters): Promise<AttributeFacet[]> {
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
      FROM "${this.attributeTable}" pa
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."attributeId" = pa."productAttributeId"
      JOIN "${this.productTable}" p ON p."productId" = pavm."productId"
      LEFT JOIN "${this.attributeValueTable}" pavl ON pavl."attributeId" = pa."productAttributeId" AND pavl."value" = pavm."value"
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

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(partialQuery: string, limit: number = 10): Promise<string[]> {
    const searchTerm = `${partialQuery}%`;

    const sql = `
      SELECT DISTINCT p."name"
      FROM "${this.productTable}" p
      WHERE p."name" ILIKE $1
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      ORDER BY p."name"
      LIMIT $2
    `;

    const results = await query<Array<{ name: string }>>(sql, [searchTerm, limit]);
    return (results || []).map(r => r.name);
  }

  /**
   * Get products by attribute value
   */
  async findByAttribute(attributeCode: string, value: string): Promise<ProductSearchRow[]> {
    const sql = `
      SELECT DISTINCT p.*, ${PRICE_COLUMNS_SQL}
      FROM "${this.productTable}" p
      ${PRICE_JOIN_SQL}
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."productId" = p."productId"
      JOIN "${this.attributeTable}" pa ON pa."productAttributeId" = pavm."attributeId"
      WHERE pa."code" = $1
        AND pavm."value" = $2
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      ORDER BY p."name"
    `;

    return ((await query<Record<string, unknown>[]>(sql, [attributeCode, value])) || []).map(mapSearchRow);
  }

  /**
   * Get similar products based on attributes
   */
  async findSimilar(productId: string, limit: number = 10): Promise<ProductSearchRow[]> {
    // Get the product's attributes
    const attrSql = `
      SELECT "attributeId", "value"
      FROM "${this.attributeValueMapTable}"
      WHERE "productId" = $1
    `;

    const productAttrs = await query<Array<{ attributeId: string; value: string }>>(attrSql, [productId]);

    if (!productAttrs || productAttrs.length === 0) {
      return [];
    }

    // Find products with similar attributes
    const sql = `
      SELECT p.*, ${PRICE_COLUMNS_SQL}, COUNT(pavm."attributeId") as match_count
      FROM "${this.productTable}" p
      ${PRICE_JOIN_SQL}
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."productId" = p."productId"
      WHERE p."productId" != $1
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
        AND (pavm."attributeId", pavm."value") IN (${productAttrs.map((_, i) => `($${i * 2 + 2}, $${i * 2 + 3})`).join(', ')})
      GROUP BY p."productId", bp."priceCents", bp."salePriceCents", bp."currencyCode"
      ORDER BY match_count DESC, p."averageRating" DESC NULLS LAST
      LIMIT $${productAttrs.length * 2 + 2}
    `;

    const params = [productId];
    for (const attr of productAttrs) {
      params.push(attr.attributeId, attr.value);
    }
    params.push(String(limit));

    return ((await query<Record<string, unknown>[]>(sql, params)) || []).map(mapSearchRow);
  }
}

export default new ProductSearchService();
