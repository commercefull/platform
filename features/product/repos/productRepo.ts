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

export class ProductRepo {

  /**
   * Find a product by its ID
   */
  async findById(id: string): Promise<Product | null> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "id" = $1 AND "deletedAt" IS NULL', [id]);
  }

  /**
   * Find a product by its slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "slug" = $1 AND "deletedAt" IS NULL', [slug]);
  }

  /**
   * Find a product by its SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    return await queryOne<Product>('SELECT * FROM "public"."product" WHERE "sku" = $1 AND "deletedAt" IS NULL', [sku]);
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

    let sql = 'SELECT id, name, sku, status, visibility, basePrice, salePrice, isFeatured, hasVariants, createdAt, updatedAt FROM "public"."product" WHERE "deletedAt" IS NULL';
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
      sql += ` AND "categoryId" = $${params.length + 1}`;
      params.push(categoryId);
    }
    
    if (isFeatured !== undefined) {
      sql += ` AND "isFeatured" = $${params.length + 1}`;
      params.push(isFeatured);
    }
    
    if (isVirtual !== undefined) {
      sql += ` AND "isVirtual" = $${params.length + 1}`;
      params.push(isVirtual);
    }
    
    if (hasVariants !== undefined) {
      sql += ` AND "hasVariants" = $${params.length + 1}`;
      params.push(hasVariants);
    }
    
    if (priceMin !== undefined) {
      sql += ` AND "basePrice" >= $${params.length + 1}`;
      params.push(priceMin);
    }
    
    if (priceMax !== undefined) {
      sql += ` AND "basePrice" <= $${params.length + 1}`;
      params.push(priceMax);
    }
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${params.length + 1}`;
      params.push(merchantId);
    }
    
    if (brandId) {
      sql += ` AND "brandId" = $${params.length + 1}`;
      params.push(brandId);
    }
    
    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${params.length + 1} OR "description" ILIKE $${params.length + 1} OR "sku" ILIKE $${params.length + 1})`;
      const searchPattern = `%${searchTerm}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    
    // Apply ordering and pagination
    sql += ` ORDER BY "${orderBy}" ${orderDirection} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
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

    let sql = 'SELECT COUNT(*) as count FROM "public"."product" WHERE "deletedAt" IS NULL';
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
      sql += ` AND "categoryId" = $${params.length + 1}`;
      params.push(categoryId);
    }
    
    if (isFeatured !== undefined) {
      sql += ` AND "isFeatured" = $${params.length + 1}`;
      params.push(isFeatured);
    }
    
    if (isVirtual !== undefined) {
      sql += ` AND "isVirtual" = $${params.length + 1}`;
      params.push(isVirtual);
    }
    
    if (hasVariants !== undefined) {
      sql += ` AND "hasVariants" = $${params.length + 1}`;
      params.push(hasVariants);
    }
    
    if (priceMin !== undefined) {
      sql += ` AND "basePrice" >= $${params.length + 1}`;
      params.push(priceMin);
    }
    
    if (priceMax !== undefined) {
      sql += ` AND "basePrice" <= $${params.length + 1}`;
      params.push(priceMax);
    }
    
    if (merchantId) {
      sql += ` AND "merchantId" = $${params.length + 1}`;
      params.push(merchantId);
    }
    
    if (brandId) {
      sql += ` AND "brandId" = $${params.length + 1}`;
      params.push(brandId);
    }
    
    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${params.length + 1} OR "description" ILIKE $${params.length + 1} OR "sku" ILIKE $${params.length + 1})`;
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
    
    // Generate columns and values for query
    const columns = [
      'id', 'name', 'description', 'productTypeId', 'createdAt', 'updatedAt',
      // Include all additional fields
      'categoryId', 'sku', 'status', 'visibility', 'shortDescription',
      'metaTitle', 'metaDescription', 'metaKeywords', 'slug',
      'isFeatured', 'isVirtual', 'isDownloadable', 'isSubscription', 'isTaxable',
      'taxClass', 'weight', 'weightUnit', 'length', 'width', 'height',
      'dimensionUnit', 'basePrice', 'salePrice', 'cost', 'currencyCode',
      'primaryImageId', 'publishedAt', 'userId', 'merchantId', 'brandId',
      'minOrderQuantity', 'maxOrderQuantity', 'returnPolicy', 'warranty',
      'externalId', 'hasVariants', 'variantAttributes', 'metadata'
    ].filter(col => product[col as keyof ProductCreateProps] !== undefined);
    
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
    const values = [
      id, name, description, productTypeId, now, now,
      // Include all additional field values
      categoryId, sku, status, visibility, shortDescription,
      metaTitle, metaDescription, metaKeywords, slug,
      isFeatured, isVirtual, isDownloadable, isSubscription, isTaxable,
      taxClass, weight, weightUnit, length, width, height,
      dimensionUnit, basePrice, salePrice, cost, currencyCode,
      primaryImageId, publishedAt, userId, merchantId, brandId,
      minOrderQuantity, maxOrderQuantity, returnPolicy, warranty,
      externalId, hasVariants, variantAttributes, metadata
    ].filter((_, i) => product[Object.keys(product)[i] as keyof ProductCreateProps] !== undefined);
    
    const sql = `
      INSERT INTO "public"."product" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
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
    
    // Generate set statements for each field
    const setStatements: string[] = Object.keys(product).map((key, i) => `"${key}" = $${i + 2}`);
    setStatements.push(`"updatedAt" = $${Object.keys(product).length + 2}`);
    
    // Create values array with the updated fields
    const values = [
      id,
      ...Object.values(product),
      now
    ];
    
    const sql = `
      UPDATE "public"."product"
      SET ${setStatements.join(', ')}
      WHERE "id" = $1
      RETURNING *
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
      SET "deletedAt" = $2, "status" = $3
      WHERE "id" = $1 AND "deletedAt" IS NULL
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
    
    const sql = `
      SELECT id, name, sku, status, visibility, basePrice, salePrice, isFeatured, hasVariants, createdAt, updatedAt
      FROM "public"."product"
      WHERE "categoryId" = $1 AND "id" != $2 AND "deletedAt" IS NULL
      AND "status" = $3 AND "visibility" = $4
      ORDER BY "isFeatured" DESC, RANDOM()
      LIMIT $5
    `;
    
    return await query<ProductListItem[]>(
      sql, 
      [product.categoryId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit]
    ) || [];
  }
}

export default new ProductRepo();