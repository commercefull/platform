import { queryOne, query } from '../../../libs/db';
import { Table } from '../../../libs/db/types';

// Product status and visibility enums to match database schema
export enum ProductStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISCONTINUED = 'discontinued',
  ARCHIVED = 'archived',
}

export enum ProductVisibility {
  VISIBLE = 'visible',
  NOT_VISIBLE = 'not_visible',
  CATALOG = 'catalog',
  SEARCH = 'search',
}

export enum ProductType {
  SIMPLE = 'simple',
  CONFIGURABLE = 'configurable',
  GROUPED = 'grouped',
  VIRTUAL = 'virtual',
  DOWNLOADABLE = 'downloadable',
  BUNDLE = 'bundle',
  SUBSCRIPTION = 'subscription',
}

// Product interface matching database schema (camelCase)
export interface Product {
  productId: string;
  createdAt: Date;
  updatedAt: Date;
  sku: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  brandId?: string;
  categoryId?: string; // Primary category ID (from productCategoryMap)
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  price: number;
  basePrice?: number;
  salePrice?: number;
  costPrice?: number;
  compareAtPrice?: number;
  taxClass?: string;
  taxRate?: number;
  isTaxable: boolean;
  currency: string;
  currencyCode?: string;
  isInventoryManaged: boolean;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  orderIncrementQuantity?: number;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  hsCode?: string;
  countryOfOrigin?: string;
  isFeatured: boolean;
  isNew: boolean;
  isBestseller: boolean;
  warningThreshold?: number;
  preorderEnabled: boolean;
  preorderReleaseDate?: Date;
  preorderAllowance?: number;
  averageRating?: number;
  reviewCount: number;
  customFields?: Record<string, any>;
  seoData?: Record<string, any>;
  relatedProducts?: string[];
  crossSellProducts?: string[];
  upSellProducts?: string[];
  isVirtual: boolean;
  isDownloadable: boolean;
  isSubscription: boolean;
  primaryImageId?: string;
  publishedAt?: Date;
  deletedAt?: Date;
  userId?: string;
  merchantId?: string;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  hasVariants: boolean;
  variantAttributes?: Record<string, any>;
  createdBy?: string;
  updatedBy?: string;
}

// Alias for backward compatibility
export type ProductListItem = Pick<
  Product,
  | 'productId'
  | 'name'
  | 'sku'
  | 'status'
  | 'visibility'
  | 'price'
  | 'basePrice'
  | 'salePrice'
  | 'isFeatured'
  | 'hasVariants'
  | 'createdAt'
  | 'updatedAt'
> & { id?: string }; // Include id alias for compatibility

export type ProductCreateProps = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;

export type ProductUpdateProps = Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>;

export interface ProductFilterOptions {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  type?: ProductType | ProductType[];
  brandId?: string;
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  priceMin?: number;
  priceMax?: number;
  merchantId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export class ProductRepo {
  private readonly tableName = Table.Product;

  /**
   * Find a product by its ID
   */
  async findById(id: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "productId" = $1 AND "deletedAt" IS NULL
    `;
    return await queryOne<Product>(sql, [id]);
  }

  /**
   * Find a product by its slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "slug" = $1 AND "deletedAt" IS NULL
    `;
    return await queryOne<Product>(sql, [slug]);
  }

  /**
   * Find a product by its SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "sku" = $1 AND "deletedAt" IS NULL
    `;
    return await queryOne<Product>(sql, [sku]);
  }

  /**
   * Get all products with pagination and filtering
   */
  async findAll(options: ProductFilterOptions = {}): Promise<Product[]> {
    const {
      status,
      visibility,
      type,
      brandId,
      isFeatured,
      isVirtual,
      hasVariants,
      priceMin,
      priceMax,
      merchantId,
      searchTerm,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDirection = 'DESC',
    } = options;

    let sql = `SELECT * FROM "${this.tableName}" WHERE "deletedAt" IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      if (Array.isArray(status)) {
        const placeholders = status.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "status" IN (${placeholders})`;
        params.push(...status);
      } else {
        sql += ` AND "status" = $${paramIndex++}`;
        params.push(status);
      }
    }

    if (visibility) {
      if (Array.isArray(visibility)) {
        const placeholders = visibility.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "visibility" IN (${placeholders})`;
        params.push(...visibility);
      } else {
        sql += ` AND "visibility" = $${paramIndex++}`;
        params.push(visibility);
      }
    }

    if (type) {
      if (Array.isArray(type)) {
        const placeholders = type.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "type" IN (${placeholders})`;
        params.push(...type);
      } else {
        sql += ` AND "type" = $${paramIndex++}`;
        params.push(type);
      }
    }

    if (brandId) {
      sql += ` AND "brandId" = $${paramIndex++}`;
      params.push(brandId);
    }

    if (isFeatured !== undefined) {
      sql += ` AND "isFeatured" = $${paramIndex++}`;
      params.push(isFeatured);
    }

    if (isVirtual !== undefined) {
      sql += ` AND "isVirtual" = $${paramIndex++}`;
      params.push(isVirtual);
    }

    if (hasVariants !== undefined) {
      sql += ` AND "hasVariants" = $${paramIndex++}`;
      params.push(hasVariants);
    }

    if (priceMin !== undefined) {
      sql += ` AND "price" >= $${paramIndex++}`;
      params.push(priceMin);
    }

    if (priceMax !== undefined) {
      sql += ` AND "price" <= $${paramIndex++}`;
      params.push(priceMax);
    }

    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex++}`;
      params.push(merchantId);
    }

    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${paramIndex} OR "description" ILIKE $${paramIndex} OR "sku" ILIKE $${paramIndex})`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Validate orderBy to prevent SQL injection
    const validOrderColumns = ['createdAt', 'updatedAt', 'name', 'price', 'sku', 'status'];
    const safeOrderBy = validOrderColumns.includes(orderBy) ? orderBy : 'createdAt';
    const safeDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

    sql += ` ORDER BY "${safeOrderBy}" ${safeDirection}`;
    sql += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    return (await query<Product[]>(sql, params)) || [];
  }

  /**
   * Count products based on filter options
   */
  async count(options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    const { status, visibility, type, brandId, isFeatured, isVirtual, hasVariants, priceMin, priceMax, merchantId, searchTerm } = options;

    let sql = `SELECT COUNT(*) as count FROM "${this.tableName}" WHERE "deletedAt" IS NULL`;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      if (Array.isArray(status)) {
        const placeholders = status.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "status" IN (${placeholders})`;
        params.push(...status);
      } else {
        sql += ` AND "status" = $${paramIndex++}`;
        params.push(status);
      }
    }

    if (visibility) {
      if (Array.isArray(visibility)) {
        const placeholders = visibility.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "visibility" IN (${placeholders})`;
        params.push(...visibility);
      } else {
        sql += ` AND "visibility" = $${paramIndex++}`;
        params.push(visibility);
      }
    }

    if (type) {
      if (Array.isArray(type)) {
        const placeholders = type.map(() => `$${paramIndex++}`).join(', ');
        sql += ` AND "type" IN (${placeholders})`;
        params.push(...type);
      } else {
        sql += ` AND "type" = $${paramIndex++}`;
        params.push(type);
      }
    }

    if (brandId) {
      sql += ` AND "brandId" = $${paramIndex++}`;
      params.push(brandId);
    }

    if (isFeatured !== undefined) {
      sql += ` AND "isFeatured" = $${paramIndex++}`;
      params.push(isFeatured);
    }

    if (isVirtual !== undefined) {
      sql += ` AND "isVirtual" = $${paramIndex++}`;
      params.push(isVirtual);
    }

    if (hasVariants !== undefined) {
      sql += ` AND "hasVariants" = $${paramIndex++}`;
      params.push(hasVariants);
    }

    if (priceMin !== undefined) {
      sql += ` AND "price" >= $${paramIndex++}`;
      params.push(priceMin);
    }

    if (priceMax !== undefined) {
      sql += ` AND "price" <= $${paramIndex++}`;
      params.push(priceMax);
    }

    if (merchantId) {
      sql += ` AND "merchantId" = $${paramIndex++}`;
      params.push(merchantId);
    }

    if (searchTerm) {
      sql += ` AND ("name" ILIKE $${paramIndex} OR "description" ILIKE $${paramIndex} OR "sku" ILIKE $${paramIndex})`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    const result = await queryOne<{ count: string }>(sql, params);
    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Create a new product
   */
  async create(data: ProductCreateProps): Promise<Product> {
    const sql = `
      INSERT INTO "${this.tableName}" (
        "sku", "name", "slug", "description", "shortDescription",
        "brandId", "type", "status", "visibility",
        "price", "basePrice", "salePrice", "costPrice", "compareAtPrice",
        "taxClass", "taxRate", "isTaxable", "currency", "currencyCode",
        "isInventoryManaged", "minOrderQuantity", "maxOrderQuantity", "orderIncrementQuantity",
        "weight", "weightUnit", "length", "width", "height", "dimensionUnit",
        "metaTitle", "metaDescription", "metaKeywords",
        "hsCode", "countryOfOrigin",
        "isFeatured", "isNew", "isBestseller",
        "warningThreshold", "preorderEnabled", "preorderReleaseDate", "preorderAllowance",
        "customFields", "seoData",
        "relatedProducts", "crossSellProducts", "upSellProducts",
        "isVirtual", "isDownloadable", "isSubscription",
        "primaryImageId", "publishedAt",
        "userId", "merchantId",
        "returnPolicy", "warranty", "externalId",
        "hasVariants", "variantAttributes",
        "createdBy", "updatedBy"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19,
        $20, $21, $22, $23,
        $24, $25, $26, $27, $28, $29,
        $30, $31, $32,
        $33, $34,
        $35, $36, $37,
        $38, $39, $40, $41,
        $42, $43,
        $44, $45, $46,
        $47, $48, $49,
        $50, $51,
        $52, $53,
        $54, $55, $56,
        $57, $58,
        $59, $60
      )
      RETURNING *
    `;

    const values = [
      data.sku,
      data.name,
      data.slug,
      data.description || null,
      data.shortDescription || null,
      data.brandId || null,
      data.type || ProductType.SIMPLE,
      data.status || ProductStatus.DRAFT,
      data.visibility || ProductVisibility.VISIBLE,
      data.price,
      data.basePrice || null,
      data.salePrice || null,
      data.costPrice || null,
      data.compareAtPrice || null,
      data.taxClass || 'standard',
      data.taxRate || null,
      data.isTaxable !== false,
      data.currency || 'USD',
      data.currencyCode || 'USD',
      data.isInventoryManaged !== false,
      data.minOrderQuantity || 1,
      data.maxOrderQuantity || null,
      data.orderIncrementQuantity || 1,
      data.weight || null,
      data.weightUnit || 'g',
      data.length || null,
      data.width || null,
      data.height || null,
      data.dimensionUnit || 'cm',
      data.metaTitle || null,
      data.metaDescription || null,
      data.metaKeywords || null,
      data.hsCode || null,
      data.countryOfOrigin || null,
      data.isFeatured || false,
      data.isNew || false,
      data.isBestseller || false,
      data.warningThreshold || null,
      data.preorderEnabled || false,
      data.preorderReleaseDate || null,
      data.preorderAllowance || null,
      data.customFields ? JSON.stringify(data.customFields) : null,
      data.seoData ? JSON.stringify(data.seoData) : null,
      data.relatedProducts || null,
      data.crossSellProducts || null,
      data.upSellProducts || null,
      data.isVirtual || false,
      data.isDownloadable || false,
      data.isSubscription || false,
      data.primaryImageId || null,
      data.publishedAt || null,
      data.userId || null,
      data.merchantId || null,
      data.returnPolicy || null,
      data.warranty || null,
      data.externalId || null,
      data.hasVariants || false,
      data.variantAttributes ? JSON.stringify(data.variantAttributes) : null,
      data.createdBy || null,
      data.updatedBy || null,
    ];

    const result = await queryOne<Product>(sql, values);

    if (!result) {
      throw new Error('Failed to create product');
    }

    return result;
  }

  /**
   * Update an existing product
   */
  async update(id: string, data: ProductUpdateProps): Promise<Product> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: any[] = [id];
    let paramIndex = 2;

    // Build dynamic SET clause
    const updateableFields: (keyof ProductUpdateProps)[] = [
      'sku',
      'name',
      'slug',
      'description',
      'shortDescription',
      'brandId',
      'type',
      'status',
      'visibility',
      'price',
      'basePrice',
      'salePrice',
      'costPrice',
      'compareAtPrice',
      'taxClass',
      'taxRate',
      'isTaxable',
      'currency',
      'currencyCode',
      'isInventoryManaged',
      'minOrderQuantity',
      'maxOrderQuantity',
      'orderIncrementQuantity',
      'weight',
      'weightUnit',
      'length',
      'width',
      'height',
      'dimensionUnit',
      'metaTitle',
      'metaDescription',
      'metaKeywords',
      'hsCode',
      'countryOfOrigin',
      'isFeatured',
      'isNew',
      'isBestseller',
      'warningThreshold',
      'preorderEnabled',
      'preorderReleaseDate',
      'preorderAllowance',
      'customFields',
      'seoData',
      'relatedProducts',
      'crossSellProducts',
      'upSellProducts',
      'isVirtual',
      'isDownloadable',
      'isSubscription',
      'primaryImageId',
      'publishedAt',
      'userId',
      'merchantId',
      'returnPolicy',
      'warranty',
      'externalId',
      'hasVariants',
      'variantAttributes',
      'updatedBy',
    ];

    for (const field of updateableFields) {
      if (data[field] !== undefined) {
        let value = data[field];
        // Handle JSON fields
        if (['customFields', 'seoData', 'variantAttributes'].includes(field) && typeof value === 'object') {
          value = JSON.stringify(value);
        }
        setStatements.push(`"${field}" = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (setStatements.length === 1) {
      // Only updatedAt, nothing else to update
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error('Product not found');
      }
      return existing;
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "productId" = $1 AND "deletedAt" IS NULL
      RETURNING *
    `;

    const result = await queryOne<Product>(sql, values);

    if (!result) {
      throw new Error('Product not found or update failed');
    }

    return result;
  }

  /**
   * Soft delete a product
   */
  async delete(id: string): Promise<boolean> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "deletedAt" = now(), "status" = $2, "updatedAt" = now()
      WHERE "productId" = $1 AND "deletedAt" IS NULL
    `;

    const result = await query(sql, [id, ProductStatus.ARCHIVED]);
    return result !== null;
  }

  /**
   * Hard delete a product (permanent)
   */
  async hardDelete(id: string): Promise<boolean> {
    const sql = `DELETE FROM "${this.tableName}" WHERE "productId" = $1`;
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
   * Find featured products
   */
  async findFeatured(limit: number = 10): Promise<Product[]> {
    return this.findAll({
      isFeatured: true,
      status: ProductStatus.ACTIVE,
      visibility: ProductVisibility.VISIBLE,
      limit,
    });
  }

  /**
   * Find new products
   */
  async findNew(limit: number = 10): Promise<Product[]> {
    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE "isNew" = true 
        AND "status" = $1 
        AND "visibility" = $2 
        AND "deletedAt" IS NULL
      ORDER BY "createdAt" DESC
      LIMIT $3
    `;
    return (await query<Product[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || [];
  }

  /**
   * Find bestseller products
   */
  async findBestsellers(limit: number = 10): Promise<Product[]> {
    const sql = `
      SELECT * FROM "${this.tableName}"
      WHERE "isBestseller" = true 
        AND "status" = $1 
        AND "visibility" = $2 
        AND "deletedAt" IS NULL
      ORDER BY "reviewCount" DESC, "averageRating" DESC
      LIMIT $3
    `;
    return (await query<Product[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || [];
  }

  /**
   * Find related products
   */
  async findRelated(productId: string, limit: number = 10): Promise<Product[]> {
    const product = await this.findById(productId);
    if (!product) {
      return [];
    }

    // If product has explicit related products, use those
    if (product.relatedProducts && product.relatedProducts.length > 0) {
      const placeholders = product.relatedProducts.map((_, i) => `$${i + 1}`).join(', ');
      const sql = `
        SELECT * FROM "${this.tableName}"
        WHERE "productId" IN (${placeholders})
          AND "status" = $${product.relatedProducts.length + 1}
          AND "visibility" = $${product.relatedProducts.length + 2}
          AND "deletedAt" IS NULL
        LIMIT $${product.relatedProducts.length + 3}
      `;
      return (await query<Product[]>(sql, [...product.relatedProducts, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || [];
    }

    // Otherwise, find products with same brand
    if (product.brandId) {
      const sql = `
        SELECT * FROM "${this.tableName}"
        WHERE "brandId" = $1
          AND "productId" != $2
          AND "status" = $3
          AND "visibility" = $4
          AND "deletedAt" IS NULL
        ORDER BY RANDOM()
        LIMIT $5
      `;
      return (await query<Product[]>(sql, [product.brandId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || [];
    }

    return [];
  }

  /**
   * Find products by brand
   */
  async findByBrand(brandId: string, options: Omit<ProductFilterOptions, 'brandId'> = {}): Promise<Product[]> {
    return this.findAll({ ...options, brandId });
  }

  /**
   * Find products by merchant
   */
  async findByMerchant(merchantId: string, options: Omit<ProductFilterOptions, 'merchantId'> = {}): Promise<Product[]> {
    return this.findAll({ ...options, merchantId });
  }

  /**
   * Search products
   */
  async search(searchTerm: string, options: Omit<ProductFilterOptions, 'searchTerm'> = {}): Promise<Product[]> {
    return this.findAll({ ...options, searchTerm });
  }

  /**
   * Update product rating
   */
  async updateRating(productId: string, averageRating: number, reviewCount: number): Promise<Product> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "averageRating" = $2, "reviewCount" = $3, "updatedAt" = now()
      WHERE "productId" = $1 AND "deletedAt" IS NULL
      RETURNING *
    `;

    const result = await queryOne<Product>(sql, [productId, averageRating, reviewCount]);

    if (!result) {
      throw new Error('Product not found');
    }

    return result;
  }

  /**
   * Publish a product
   */
  async publish(id: string): Promise<Product> {
    const sql = `
      UPDATE "${this.tableName}"
      SET "status" = $2, "publishedAt" = now(), "updatedAt" = now()
      WHERE "productId" = $1 AND "deletedAt" IS NULL
      RETURNING *
    `;

    const result = await queryOne<Product>(sql, [id, ProductStatus.ACTIVE]);

    if (!result) {
      throw new Error('Product not found');
    }

    return result;
  }

  /**
   * Unpublish a product
   */
  async unpublish(id: string): Promise<Product> {
    return this.update(id, { status: ProductStatus.DRAFT });
  }
}

export default new ProductRepo();
