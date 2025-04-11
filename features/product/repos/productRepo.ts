import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";
import { generateUUID } from "../../../libs/uuid";

// Product status and visibility enums to match database schema
export enum ProductStatus {
  DRAFT = "draft",
  PENDING_REVIEW = "pending_review",
  ACTIVE = "active",
  INACTIVE = "inactive",
  DISCONTINUED = "discontinued",
  ARCHIVED = "archived"
}

export enum ProductVisibility {
  VISIBLE = "visible",
  HIDDEN = "hidden",
  CATALOG_ONLY = "catalog_only",
  SEARCH_ONLY = "search_only",
  FEATURED = "featured"
}

export type Product = {
  id: string;
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  productTypeId: string;
  categoryId?: string;
  
  // Fields from database schema
  sku?: string;
  status: ProductStatus;
  visibility: ProductVisibility;
  shortDescription?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  slug?: string;
  isFeatured: boolean;
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  isTaxable: boolean;
  taxClass?: string;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  basePrice?: number;
  salePrice?: number;
  cost?: number;
  currencyCode?: string;
  primaryImageId?: string;
  publishedAt?: number;
  deletedAt?: number;
  userId?: string;
  merchantId?: string;
  brandId?: string;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  hasVariants: boolean;
  variantAttributes?: Record<string, any>;
  metadata?: Record<string, any>;
}

export type ProductListItem = Pick<Product, 
  'id' | 'name' | 'sku' | 'status' | 'visibility' | 'basePrice' | 
  'salePrice' | 'isFeatured' | 'hasVariants' | 'createdAt' | 'updatedAt'
>;

export type ProductCreateProps = Omit<Product, 'id' | 'createdAt' | 'updatedAt'>;

export type ProductUpdateProps = Partial<Omit<Product, 'id' | 'createdAt' | 'updatedAt'>>;

export type ProductFilterOptions = {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  categoryId?: string;
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  priceMin?: number;
  priceMax?: number;
  merchantId?: string;
  brandId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
};

// Define DB column to TS property mapping
const dbToTsMapping: Record<string, string> = {
  id: 'id',
  created_at: 'createdAt',
  updated_at: 'updatedAt',
  name: 'name',
  description: 'description',
  product_type_id: 'productTypeId',
  category_id: 'categoryId',
  sku: 'sku',
  status: 'status',
  visibility: 'visibility',
  short_description: 'shortDescription',
  meta_title: 'metaTitle',
  meta_description: 'metaDescription',
  meta_keywords: 'metaKeywords',
  slug: 'slug',
  is_featured: 'isFeatured',
  is_virtual: 'isVirtual',
  is_downloadable: 'isDownloadable',
  is_subscription: 'isSubscription',
  is_taxable: 'isTaxable',
  tax_class: 'taxClass',
  weight: 'weight',
  weight_unit: 'weightUnit',
  length: 'length',
  width: 'width',
  height: 'height',
  dimension_unit: 'dimensionUnit',
  base_price: 'basePrice',
  sale_price: 'salePrice',
  cost: 'cost',
  currency_code: 'currencyCode',
  primary_image_id: 'primaryImageId',
  published_at: 'publishedAt',
  deleted_at: 'deletedAt',
  user_id: 'userId',
  merchant_id: 'merchantId',
  brand_id: 'brandId',
  min_order_quantity: 'minOrderQuantity',
  max_order_quantity: 'maxOrderQuantity',
  return_policy: 'returnPolicy',
  warranty: 'warranty',
  external_id: 'externalId',
  has_variants: 'hasVariants',
  variant_attributes: 'variantAttributes',
  metadata: 'metadata'
};

// Define TS property to DB column mapping
const tsToDbMapping = Object.entries(dbToTsMapping).reduce((acc, [dbCol, tsProp]) => {
  acc[tsProp] = dbCol;
  return acc;
}, {} as Record<string, string>);

export class ProductRepo {
  /**
   * Convert snake_case column name to camelCase property name
   */
  private dbToTs(columnName: string): string {
    return dbToTsMapping[columnName] || columnName;
  }

  /**
   * Convert camelCase property name to snake_case column name
   */
  private tsToDb(propertyName: string): string {
    return tsToDbMapping[propertyName] || propertyName;
  }

  /**
   * Generate field mapping for SELECT statements
   */
  private generateSelectFields(fields: string[] = Object.values(dbToTsMapping)): string {
    return fields.map(field => {
      const dbField = this.tsToDb(field);
      return `"${dbField}" AS "${field}"`;
    }).join(', ');
  }

  /**
   * Find a product by its ID
   */
  async findById(id: string): Promise<Product | null> {
    const selectFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    return await queryOne<Product>(
      `SELECT ${selectFields} FROM "public"."product" WHERE "id" = $1 AND "deleted_at" IS NULL`, 
      [id]
    );
  }

  /**
   * Find a product by its slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const selectFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    return await queryOne<Product>(
      `SELECT ${selectFields} FROM "public"."product" WHERE "slug" = $1 AND "deleted_at" IS NULL`, 
      [slug]
    );
  }

  /**
   * Find a product by its SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    const selectFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    return await queryOne<Product>(
      `SELECT ${selectFields} FROM "public"."product" WHERE "sku" = $1 AND "deleted_at" IS NULL`, 
      [sku]
    );
  }

  /**
   * Get all products with pagination and filtering
   */
  async findAll(options: ProductFilterOptions = {}): Promise<ProductListItem[]> {
    const {
      status,
      visibility,
      categoryId,
      isFeatured,
      isVirtual,
      hasVariants,
      priceMin,
      priceMax,
      merchantId,
      brandId,
      searchTerm,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = options;

    // List of fields for ProductListItem
    const listItemFields = [
      'id', 'name', 'sku', 'status', 'visibility', 'basePrice', 
      'salePrice', 'isFeatured', 'hasVariants', 'createdAt', 'updatedAt'
    ];
    
    // Generate SELECT field mapping
    const selectFields = listItemFields.map(field => {
      const dbField = this.tsToDb(field);
      return `"${dbField}" AS "${field}"`;
    }).join(', ');

    let sql = `SELECT ${selectFields} FROM "public"."product" WHERE "deleted_at" IS NULL`;
    const params: any[] = [];
    
    // Apply filters if provided
    if (status) {
      if (Array.isArray(status)) {
        sql += ` AND "status" IN (${status.map((_, i) => `$${params.length + i + 1}`).join(', ')})`;
        params.push(...status);
      } else {
        sql += ` AND "status" = $${params.length + 1}`;
        params.push(status);
      }
    }
    
    if (visibility) {
      if (Array.isArray(visibility)) {
        sql += ` AND "visibility" IN (${visibility.map((_, i) => `$${params.length + i + 1}`).join(', ')})`;
        params.push(...visibility);
      } else {
        sql += ` AND "visibility" = $${params.length + 1}`;
        params.push(visibility);
      }
    }
    
    if (categoryId) {
      sql += ` AND "category_id" = $${params.length + 1}`;
      params.push(categoryId);
    }
    
    if (isFeatured !== undefined) {
      sql += ` AND "is_featured" = $${params.length + 1}`;
      params.push(isFeatured);
    }
    
    if (isVirtual !== undefined) {
      sql += ` AND "is_virtual" = $${params.length + 1}`;
      params.push(isVirtual);
    }
    
    if (hasVariants !== undefined) {
      sql += ` AND "has_variants" = $${params.length + 1}`;
      params.push(hasVariants);
    }
    
    if (priceMin !== undefined) {
      sql += ` AND "base_price" >= $${params.length + 1}`;
      params.push(priceMin);
    }
    
    if (priceMax !== undefined) {
      sql += ` AND "base_price" <= $${params.length + 1}`;
      params.push(priceMax);
    }
    
    if (merchantId) {
      sql += ` AND "merchant_id" = $${params.length + 1}`;
      params.push(merchantId);
    }
    
    if (brandId) {
      sql += ` AND "brand_id" = $${params.length + 1}`;
      params.push(brandId);
    }
    
    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${params.length + 1} OR "description" ILIKE $${params.length + 2} OR "sku" ILIKE $${params.length + 3})`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Apply ordering and pagination
    const dbOrderBy = this.tsToDb(orderBy);
    sql += ` ORDER BY "${dbOrderBy}" ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    
    return await query<ProductListItem[]>(sql, params) || [];
  }

  /**
   * Count products based on filter options
   */
  async count(options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    const {
      status,
      visibility,
      categoryId,
      isFeatured,
      isVirtual,
      hasVariants,
      priceMin,
      priceMax,
      merchantId,
      brandId,
      searchTerm
    } = options;

    let sql = 'SELECT COUNT(*) as count FROM "public"."product" WHERE "deleted_at" IS NULL';
    const params: any[] = [];
    
    // Apply filters if provided (same logic as in findAll)
    if (status) {
      if (Array.isArray(status)) {
        sql += ` AND "status" IN (${status.map((_, i) => `$${params.length + i + 1}`).join(', ')})`;
        params.push(...status);
      } else {
        sql += ` AND "status" = $${params.length + 1}`;
        params.push(status);
      }
    }
    
    if (visibility) {
      if (Array.isArray(visibility)) {
        sql += ` AND "visibility" IN (${visibility.map((_, i) => `$${params.length + i + 1}`).join(', ')})`;
        params.push(...visibility);
      } else {
        sql += ` AND "visibility" = $${params.length + 1}`;
        params.push(visibility);
      }
    }
    
    if (categoryId) {
      sql += ` AND "category_id" = $${params.length + 1}`;
      params.push(categoryId);
    }
    
    if (isFeatured !== undefined) {
      sql += ` AND "is_featured" = $${params.length + 1}`;
      params.push(isFeatured);
    }
    
    if (isVirtual !== undefined) {
      sql += ` AND "is_virtual" = $${params.length + 1}`;
      params.push(isVirtual);
    }
    
    if (hasVariants !== undefined) {
      sql += ` AND "has_variants" = $${params.length + 1}`;
      params.push(hasVariants);
    }
    
    if (priceMin !== undefined) {
      sql += ` AND "base_price" >= $${params.length + 1}`;
      params.push(priceMin);
    }
    
    if (priceMax !== undefined) {
      sql += ` AND "base_price" <= $${params.length + 1}`;
      params.push(priceMax);
    }
    
    if (merchantId) {
      sql += ` AND "merchant_id" = $${params.length + 1}`;
      params.push(merchantId);
    }
    
    if (brandId) {
      sql += ` AND "brand_id" = $${params.length + 1}`;
      params.push(brandId);
    }
    
    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${params.length + 1} OR "description" ILIKE $${params.length + 2} OR "sku" ILIKE $${params.length + 3})`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Create a new product
   */
  async create(product: ProductCreateProps): Promise<Product> {
    const now = unixTimestamp();
    const id = generateUUID();
    
    const {
      name,
      description,
      productTypeId,
      categoryId,
      sku,
      status = ProductStatus.DRAFT,
      visibility = ProductVisibility.HIDDEN,
      shortDescription,
      metaTitle,
      metaDescription,
      metaKeywords,
      slug,
      isFeatured = false,
      isVirtual = false,
      isDownloadable = false,
      isSubscription = false,
      isTaxable = true,
      taxClass,
      weight,
      weightUnit,
      length,
      width,
      height,
      dimensionUnit,
      basePrice,
      salePrice,
      cost,
      currencyCode,
      primaryImageId,
      publishedAt,
      userId,
      merchantId,
      brandId,
      minOrderQuantity,
      maxOrderQuantity,
      returnPolicy,
      warranty,
      externalId,
      hasVariants = false,
      variantAttributes,
      metadata
    } = product;
    
    // Map TS property names to DB column names
    const columnMap: Record<string, any> = {
      id,
      name,
      description,
      product_type_id: productTypeId,
      created_at: now,
      updated_at: now,
      category_id: categoryId,
      sku,
      status,
      visibility,
      short_description: shortDescription,
      meta_title: metaTitle,
      meta_description: metaDescription,
      meta_keywords: metaKeywords,
      slug,
      is_featured: isFeatured,
      is_virtual: isVirtual,
      is_downloadable: isDownloadable,
      is_subscription: isSubscription,
      is_taxable: isTaxable,
      tax_class: taxClass,
      weight,
      weight_unit: weightUnit,
      length,
      width,
      height,
      dimension_unit: dimensionUnit,
      base_price: basePrice,
      sale_price: salePrice,
      cost,
      currency_code: currencyCode,
      primary_image_id: primaryImageId,
      published_at: publishedAt,
      user_id: userId,
      merchant_id: merchantId,
      brand_id: brandId,
      min_order_quantity: minOrderQuantity,
      max_order_quantity: maxOrderQuantity,
      return_policy: returnPolicy,
      warranty,
      external_id: externalId,
      has_variants: hasVariants,
      variant_attributes: variantAttributes,
      metadata
    };
    
    // Filter out undefined values
    const columns = Object.entries(columnMap)
      .filter(([_, value]) => value !== undefined)
      .map(([key]) => key);
      
    const values = Object.entries(columnMap)
      .filter(([_, value]) => value !== undefined)
      .map(([_, value]) => value);
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = columns.map(col => 
      `"${col}" AS "${dbToTsMapping[col] || col}"`
    ).join(', ');
    
    const sql = `
      INSERT INTO "public"."product" (${columns.map(c => `"${c}"`).join(', ')})
      VALUES (${placeholders})
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<Product>(sql, values);
    
    if (!result) {
      throw new Error('Failed to create product');
    }
    
    return result;
  }

  /**
   * Update an existing product
   */
  async update(id: string, product: ProductUpdateProps): Promise<Product> {
    const now = unixTimestamp();
    
    // Ensure we have something to update
    if (Object.keys(product).length === 0) {
      const existingProduct = await this.findById(id);
      
      if (!existingProduct) {
        throw new Error('Product not found');
      }
      
      return existingProduct;
    }
    
    // Convert property names to DB column names
    const updateData: Record<string, any> = { updated_at: now };
    
    for (const [key, value] of Object.entries(product)) {
      const dbColumn = this.tsToDb(key);
      updateData[dbColumn] = value;
    }
    
    // Generate set statements for each field
    const setStatements: string[] = Object.keys(updateData).map((key, i) => `"${key}" = $${i + 2}`);
    
    // Create values array with the updated fields
    const values = [
      id,
      ...Object.values(updateData)
    ];
    
    // Generate SELECT AS mapping for returning values in camelCase
    const returnFields = Object.keys(dbToTsMapping).map(dbCol => 
      `"${dbCol}" AS "${dbToTsMapping[dbCol]}"`
    ).join(', ');
    
    const sql = `
      UPDATE "public"."product"
      SET ${setStatements.join(', ')}
      WHERE "id" = $1
      RETURNING ${returnFields}
    `;
    
    const result = await queryOne<Product>(sql, values);
    
    if (!result) {
      throw new Error('Product not found or update failed');
    }
    
    return result;
  }

  /**
   * Soft delete a product by setting deletedAt
   */
  async delete(id: string): Promise<boolean> {
    const now = unixTimestamp();
    
    const sql = `
      UPDATE "public"."product"
      SET "deleted_at" = $2, "status" = $3
      WHERE "id" = $1 AND "deleted_at" IS NULL
    `;
    
    const result = await query(sql, [id, now, ProductStatus.ARCHIVED]);
    
    return result !== null;
  }

  /**
   * Hard delete a product (permanent)
   */
  async hardDelete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "public"."product" WHERE "id" = $1`;
    const result = await query(sql, [id]);
    
    return result !== null;
  }

  /**
   * Update product status
   */
  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.update(id, { status });
  }

  /**
   * Update product visibility
   */
  async updateVisibility(id: string, visibility: ProductVisibility): Promise<Product> {
    return this.update(id, { visibility });
  }

  /**
   * Find products by category
   */
  async findByCategory(categoryId: string, options: Omit<ProductFilterOptions, 'categoryId'> = {}): Promise<ProductListItem[]> {
    return this.findAll({ ...options, categoryId });
  }

  /**
   * Count products by category
   */
  async countByCategory(categoryId: string, options: Omit<ProductFilterOptions, 'categoryId' | 'limit' | 'offset' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    return this.count({ ...options, categoryId });
  }

  /**
   * Find products by search term
   */
  async findBySearch(searchTerm: string, options: Omit<ProductFilterOptions, 'searchTerm'> = {}): Promise<ProductListItem[]> {
    return this.findAll({ ...options, searchTerm });
  }

  /**
   * Count products by search term
   */
  async countBySearch(searchTerm: string, options: Omit<ProductFilterOptions, 'searchTerm' | 'limit' | 'offset' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    return this.count({ ...options, searchTerm });
  }

  /**
   * Find featured products
   */
  async findFeatured(options: Omit<ProductFilterOptions, 'isFeatured'> = {}): Promise<ProductListItem[]> {
    return this.findAll({ ...options, isFeatured: true });
  }

  /**
   * Get related products based on category
   */
  async findRelated(productId: string, limit: number = 10): Promise<ProductListItem[]> {
    const product = await this.findById(productId);
    
    if (!product || !product.categoryId) {
      return [];
    }
    
    // List of fields for ProductListItem
    const listItemFields = [
      'id', 'name', 'sku', 'status', 'visibility', 'basePrice', 
      'salePrice', 'isFeatured', 'hasVariants', 'createdAt', 'updatedAt'
    ];
    
    // Generate SELECT field mapping
    const selectFields = listItemFields.map(field => {
      const dbField = this.tsToDb(field);
      return `"${dbField}" AS "${field}"`;
    }).join(', ');
    
    const sql = `
      SELECT ${selectFields}
      FROM "public"."product"
      WHERE "category_id" = $1 AND "id" != $2 AND "deleted_at" IS NULL
      AND "status" = $3 AND "visibility" = $4
      ORDER BY "is_featured" DESC, RANDOM()
      LIMIT $5
    `;
    
    return await query<ProductListItem[]>(
      sql, 
      [product.categoryId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit]
    ) || [];
  }
}

export default new ProductRepo();