import { query } from "../../../../libs/db";
import { Table } from "../../../../libs/db/types";
import { Product } from "../../repos/productRepo";

/**
 * Search filters for product queries
 */
export interface ProductSearchFilters {
  // Text search
  query?: string;
  
  // Basic filters
  categoryId?: string;
  categoryIds?: string[];
  brandId?: string;
  brandIds?: string[];
  productTypeId?: string;
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Status filters
  status?: string;
  visibility?: string;
  
  // Boolean filters
  isFeatured?: boolean;
  isNew?: boolean;
  isBestseller?: boolean;
  hasVariants?: boolean;
  inStock?: boolean;
  
  // Dynamic attribute filters
  attributes?: AttributeFilter[];
  
  // Sorting
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity' | 'rating' | 'relevance';
  sortOrder?: 'asc' | 'desc';
  
  // Pagination
  page?: number;
  limit?: number;
  offset?: number;
}

export interface AttributeFilter {
  attributeId?: string;
  attributeCode?: string;
  value?: string;
  values?: string[];
  minValue?: number;
  maxValue?: number;
  operator?: 'eq' | 'neq' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'like';
}

export interface ProductSearchResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets?: SearchFacets;
}

export interface SearchFacets {
  categories: FacetValue[];
  brands: FacetValue[];
  priceRanges: PriceRangeFacet[];
  attributes: AttributeFacet[];
}

export interface FacetValue {
  id: string;
  name: string;
  count: number;
}

export interface PriceRangeFacet {
  min: number;
  max: number;
  count: number;
}

export interface AttributeFacet {
  attributeId: string;
  attributeCode: string;
  attributeName: string;
  type: string;
  values: Array<{
    value: string;
    displayValue: string;
    count: number;
  }>;
}

export class ProductSearchService {
  private readonly productTable = Table.Product;
  private readonly categoryMapTable = Table.ProductCategoryMap;
  private readonly attributeValueMapTable = Table.ProductAttributeValueMap;
  private readonly attributeTable = Table.ProductAttribute;
  private readonly attributeValueTable = Table.ProductAttributeValue;

  /**
   * Search products with filters and faceted search
   */
  async search(filters: ProductSearchFilters): Promise<ProductSearchResult> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = filters.offset || (page - 1) * limit;

    // Build the query
    const { sql, countSql, params } = this.buildSearchQuery(filters, limit, offset);

    // Execute queries in parallel
    const [products, countResult] = await Promise.all([
      query<Product[]>(sql, params),
      query<Array<{ count: string }>>(countSql, params.slice(0, -2)) // Remove limit/offset params
    ]);

    const total = countResult ? parseInt(countResult[0]?.count || '0', 10) : 0;
    const totalPages = Math.ceil(total / limit);

    // Get facets if requested
    let facets: SearchFacets | undefined;
    if (filters.query || Object.keys(filters).length > 3) { // Only compute facets for actual searches
      facets = await this.computeFacets(filters);
    }

    return {
      products: products || [],
      total,
      page,
      limit,
      totalPages,
      facets
    };
  }

  /**
   * Build the search SQL query
   */
  private buildSearchQuery(
    filters: ProductSearchFilters,
    limit: number,
    offset: number
  ): { sql: string; countSql: string; params: any[] } {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Base query with joins for attribute filtering
    let fromClause = `"${this.productTable}" p`;
    const joins: string[] = [];

    // Text search across multiple fields
    if (filters.query) {
      const searchTerm = `%${filters.query}%`;
      conditions.push(`(
        p."name" ILIKE $${paramIndex} OR
        p."description" ILIKE $${paramIndex} OR
        p."shortDescription" ILIKE $${paramIndex} OR
        p."sku" ILIKE $${paramIndex} OR
        p."slug" ILIKE $${paramIndex}
      )`);
      params.push(searchTerm);
      paramIndex++;
    }

    // Category filter
    if (filters.categoryId) {
      joins.push(`JOIN "${this.categoryMapTable}" pcm ON pcm."productId" = p."productId"`);
      conditions.push(`pcm."productCategoryId" = $${paramIndex}`);
      params.push(filters.categoryId);
      paramIndex++;
    } else if (filters.categoryIds && filters.categoryIds.length > 0) {
      joins.push(`JOIN "${this.categoryMapTable}" pcm ON pcm."productId" = p."productId"`);
      conditions.push(`pcm."productCategoryId" = ANY($${paramIndex})`);
      params.push(filters.categoryIds);
      paramIndex++;
    }

    // Brand filter
    if (filters.brandId) {
      conditions.push(`p."brandId" = $${paramIndex}`);
      params.push(filters.brandId);
      paramIndex++;
    } else if (filters.brandIds && filters.brandIds.length > 0) {
      conditions.push(`p."brandId" = ANY($${paramIndex})`);
      params.push(filters.brandIds);
      paramIndex++;
    }

    // Product type filter
    if (filters.productTypeId) {
      conditions.push(`p."type" = $${paramIndex}`);
      params.push(filters.productTypeId);
      paramIndex++;
    }

    // Price filters
    if (filters.minPrice !== undefined) {
      conditions.push(`p."price" >= $${paramIndex}`);
      params.push(filters.minPrice);
      paramIndex++;
    }
    if (filters.maxPrice !== undefined) {
      conditions.push(`p."price" <= $${paramIndex}`);
      params.push(filters.maxPrice);
      paramIndex++;
    }

    // Status filters
    if (filters.status) {
      conditions.push(`p."status" = $${paramIndex}`);
      params.push(filters.status);
      paramIndex++;
    }
    if (filters.visibility) {
      conditions.push(`p."visibility" = $${paramIndex}`);
      params.push(filters.visibility);
      paramIndex++;
    }

    // Boolean filters
    if (filters.isFeatured !== undefined) {
      conditions.push(`p."isFeatured" = $${paramIndex}`);
      params.push(filters.isFeatured);
      paramIndex++;
    }
    if (filters.isNew !== undefined) {
      conditions.push(`p."isNew" = $${paramIndex}`);
      params.push(filters.isNew);
      paramIndex++;
    }
    if (filters.isBestseller !== undefined) {
      conditions.push(`p."isBestseller" = $${paramIndex}`);
      params.push(filters.isBestseller);
      paramIndex++;
    }
    if (filters.hasVariants !== undefined) {
      conditions.push(`p."hasVariants" = $${paramIndex}`);
      params.push(filters.hasVariants);
      paramIndex++;
    }

    // Dynamic attribute filters
    if (filters.attributes && filters.attributes.length > 0) {
      for (const attrFilter of filters.attributes) {
        const attrAlias = `pav_${paramIndex}`;
        
        // Join to attribute value map
        let attrJoin = `JOIN "${this.attributeValueMapTable}" ${attrAlias} ON ${attrAlias}."productId" = p."productId"`;
        
        // Filter by attribute ID or code
        if (attrFilter.attributeId) {
          attrJoin += ` AND ${attrAlias}."attributeId" = $${paramIndex}`;
          params.push(attrFilter.attributeId);
          paramIndex++;
        } else if (attrFilter.attributeCode) {
          // Need to join to attribute table to filter by code
          const attrTableAlias = `pa_${paramIndex}`;
          joins.push(`JOIN "${this.attributeTable}" ${attrTableAlias} ON ${attrTableAlias}."code" = $${paramIndex}`);
          params.push(attrFilter.attributeCode);
          paramIndex++;
          attrJoin += ` AND ${attrAlias}."attributeId" = ${attrTableAlias}."productAttributeId"`;
        }
        
        joins.push(attrJoin);

        // Apply value filter based on operator
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

    // Always exclude deleted products
    conditions.push(`p."deletedAt" IS NULL`);

    // Build WHERE clause
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Build ORDER BY clause
    let orderBy = 'p."createdAt" DESC';
    const sortOrder = filters.sortOrder || 'desc';
    
    switch (filters.sortBy) {
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
        if (filters.query) {
          // Relevance scoring based on text match
          orderBy = `
            CASE 
              WHEN p."name" ILIKE $1 THEN 1
              WHEN p."name" ILIKE '%' || $1 || '%' THEN 2
              WHEN p."sku" = $1 THEN 3
              ELSE 4
            END ASC, p."isFeatured" DESC, p."createdAt" DESC
          `.replace(/\$1/g, `$${params.indexOf(params[0]) + 1}`);
        }
        break;
    }

    // Build final queries
    const joinClause = joins.length > 0 ? joins.join(' ') : '';
    
    const sql = `
      SELECT DISTINCT p.*
      FROM ${fromClause}
      ${joinClause}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    params.push(limit, offset);

    const countSql = `
      SELECT COUNT(DISTINCT p."productId") as count
      FROM ${fromClause}
      ${joinClause}
      ${whereClause}
    `;

    return { sql, countSql, params };
  }

  /**
   * Compute facets for the current search
   */
  private async computeFacets(filters: ProductSearchFilters): Promise<SearchFacets> {
    // Get category facets
    const categoryFacets = await this.getCategoryFacets(filters);
    
    // Get brand facets
    const brandFacets = await this.getBrandFacets(filters);
    
    // Get price range facets
    const priceRangeFacets = await this.getPriceRangeFacets(filters);
    
    // Get attribute facets
    const attributeFacets = await this.getAttributeFacets(filters);

    return {
      categories: categoryFacets,
      brands: brandFacets,
      priceRanges: priceRangeFacets,
      attributes: attributeFacets
    };
  }

  private async getCategoryFacets(filters: ProductSearchFilters): Promise<FacetValue[]> {
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
      count: parseInt(r.count, 10)
    }));
  }

  private async getBrandFacets(filters: ProductSearchFilters): Promise<FacetValue[]> {
    const sql = `
      SELECT 
        pb."productBrandId" as id,
        pb."name",
        COUNT(DISTINCT p."productId") as count
      FROM "${this.productTable}" p
      JOIN "${Table.ProductBrand}" pb ON pb."productBrandId" = p."brandId"
      WHERE p."deletedAt" IS NULL AND p."status" = 'active' AND p."brandId" IS NOT NULL
      GROUP BY pb."productBrandId", pb."name"
      ORDER BY count DESC
      LIMIT 20
    `;

    const results = await query<Array<{ id: string; name: string; count: string }>>(sql);
    return (results || []).map(r => ({
      id: r.id,
      name: r.name,
      count: parseInt(r.count, 10)
    }));
  }

  private async getPriceRangeFacets(filters: ProductSearchFilters): Promise<PriceRangeFacet[]> {
    const sql = `
      SELECT 
        MIN(p."price") as min_price,
        MAX(p."price") as max_price
      FROM "${this.productTable}" p
      WHERE p."deletedAt" IS NULL AND p."status" = 'active'
    `;

    const result = await query<Array<{ min_price: number; max_price: number }>>(sql);
    
    if (!result || result.length === 0) {
      return [];
    }

    const { min_price, max_price } = result[0];
    const range = max_price - min_price;
    const step = Math.ceil(range / 5);

    // Generate price range buckets
    const ranges: PriceRangeFacet[] = [];
    for (let i = 0; i < 5; i++) {
      const min = min_price + (step * i);
      const max = i === 4 ? max_price : min_price + (step * (i + 1));
      
      const countSql = `
        SELECT COUNT(*) as count
        FROM "${this.productTable}" p
        WHERE p."deletedAt" IS NULL AND p."status" = 'active'
          AND p."price" >= $1 AND p."price" <= $2
      `;
      
      const countResult = await query<Array<{ count: string }>>(countSql, [min, max]);
      const count = countResult ? parseInt(countResult[0]?.count || '0', 10) : 0;
      
      if (count > 0) {
        ranges.push({ min, max, count });
      }
    }

    return ranges;
  }

  private async getAttributeFacets(filters: ProductSearchFilters): Promise<AttributeFacet[]> {
    // Get filterable attributes with their values
    const sql = `
      SELECT 
        pa."productAttributeId" as "attributeId",
        pa."code" as "attributeCode",
        pa."name" as "attributeName",
        pa."type",
        pav."value",
        COALESCE(pavl."displayValue", pav."value") as "displayValue",
        COUNT(DISTINCT pavm."productId") as count
      FROM "${this.attributeTable}" pa
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."attributeId" = pa."productAttributeId"
      JOIN "${this.productTable}" p ON p."productId" = pavm."productId"
      LEFT JOIN "${this.attributeValueTable}" pavl ON pavl."attributeId" = pa."productAttributeId" AND pavl."value" = pavm."value"
      WHERE pa."isFilterable" = true
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      GROUP BY pa."productAttributeId", pa."code", pa."name", pa."type", pav."value", pavl."displayValue"
      ORDER BY pa."position" ASC, count DESC
    `;

    const results = await query<Array<{
      attributeId: string;
      attributeCode: string;
      attributeName: string;
      type: string;
      value: string;
      displayValue: string;
      count: string;
    }>>(sql);

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
          values: []
        });
      }
      
      attributeMap.get(row.attributeId)!.values.push({
        value: row.value,
        displayValue: row.displayValue,
        count: parseInt(row.count, 10)
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
  async findByAttribute(attributeCode: string, value: string): Promise<Product[]> {
    const sql = `
      SELECT DISTINCT p.*
      FROM "${this.productTable}" p
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."productId" = p."productId"
      JOIN "${this.attributeTable}" pa ON pa."productAttributeId" = pavm."attributeId"
      WHERE pa."code" = $1
        AND pavm."value" = $2
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
      ORDER BY p."name"
    `;

    return await query<Product[]>(sql, [attributeCode, value]) || [];
  }

  /**
   * Get similar products based on attributes
   */
  async findSimilar(productId: string, limit: number = 10): Promise<Product[]> {
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
      SELECT p.*, COUNT(pavm."attributeId") as match_count
      FROM "${this.productTable}" p
      JOIN "${this.attributeValueMapTable}" pavm ON pavm."productId" = p."productId"
      WHERE p."productId" != $1
        AND p."deletedAt" IS NULL
        AND p."status" = 'active'
        AND (pavm."attributeId", pavm."value") IN (${productAttrs.map((_, i) => `($${i * 2 + 2}, $${i * 2 + 3})`).join(', ')})
      GROUP BY p."productId"
      ORDER BY match_count DESC, p."averageRating" DESC NULLS LAST
      LIMIT $${productAttrs.length * 2 + 2}
    `;

    const params = [productId];
    for (const attr of productAttrs) {
      params.push(attr.attributeId, attr.value);
    }
    params.push(String(limit));

    return await query<Product[]>(sql, params) || [];
  }
}

export default new ProductSearchService();
