import { queryOne, query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { ProductNotFoundError, FailedToCreateProductError, ProductValidationError } from '../../domain/errors/ProductErrors';
import type { Product as DbProduct } from '../../../../libs/db/types';

function rowToProduct(row: DbProduct): Product {
  return {
    ...coreProductFields(row),
    ...orderQuantityFields(row),
    ...measureFields(row),
    ...seoFields(row),
    ...flagFields(row),
    ...jsonFields(row),
  };
}

function coreProductFields(row: DbProduct) {
  return {
    productId: row.productId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    sku: row.sku,
    name: row.name,
    slug: row.slug,
    description: row.description ?? undefined,
    shortDescription: row.shortDescription ?? undefined,
    type: row.type as ProductType,
    status: row.status as ProductStatus,
    visibility: row.visibility as ProductVisibility,
    taxClass: row.taxClass ?? undefined,
    isTaxable: row.isTaxable,
    isInventoryManaged: row.isInventoryManaged,
  };
}

function orderQuantityFields(row: DbProduct) {
  return {
    minOrderQuantity: row.minOrderQuantity ?? undefined,
    maxOrderQuantity: row.maxOrderQuantity ?? undefined,
    orderIncrementQuantity: row.orderIncrementQuantity ?? undefined,
    warningThreshold: row.warningThreshold ?? undefined,
  };
}

function measureFields(row: DbProduct) {
  return {
    weight: row.weight != null ? Number(row.weight) : undefined,
    weightUnit: row.weightUnit ?? undefined,
    length: row.length != null ? Number(row.length) : undefined,
    width: row.width != null ? Number(row.width) : undefined,
    height: row.height != null ? Number(row.height) : undefined,
    dimensionUnit: row.dimensionUnit ?? undefined,
  };
}

function seoFields(row: DbProduct) {
  return {
    metaTitle: row.metaTitle ?? undefined,
    metaDescription: row.metaDescription ?? undefined,
    metaKeywords: row.metaKeywords ?? undefined,
    hsCode: row.hsCode ?? undefined,
    countryOfOrigin: row.countryOfOrigin ?? undefined,
  };
}

function flagFields(row: DbProduct) {
  return {
    isFeatured: row.isFeatured,
    isNew: row.isNew,
    isBestseller: row.isBestseller,
    preorderEnabled: row.preorderEnabled,
    preorderReleaseDate: row.preorderReleaseDate ?? undefined,
    preorderAllowance: row.preorderAllowance ?? undefined,
    averageRating: row.averageRating != null ? Number(row.averageRating) : undefined,
    reviewCount: row.reviewCount ?? 0,
    isVirtual: row.isVirtual,
    isDownloadable: row.isDownloadable,
    isSubscription: row.isSubscription,
    hasVariants: row.hasVariants,
  };
}

function jsonFields(row: DbProduct) {
  return {
    customFields: (row.customFields ?? undefined) as Record<string, unknown> | undefined,
    seoData: (row.seoData ?? undefined) as Record<string, unknown> | undefined,
  };
}

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

enum ProductType {
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
  categoryId?: string; // Primary category ID (from productCategoryMap)
  type: ProductType;
  status: ProductStatus;
  visibility: ProductVisibility;
  taxClass?: string;
  isTaxable: boolean;
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
  customFields?: Record<string, unknown>;
  seoData?: Record<string, unknown>;
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
  organizationId?: string;
  returnPolicy?: string;
  warranty?: string;
  externalId?: string;
  hasVariants: boolean;
  variantAttributes?: Record<string, unknown>;
  createdBy?: string;
  updatedBy?: string;
}

// Include id alias for compatibility

type ProductCreateProps = Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>;

type ProductUpdateProps = Partial<Omit<Product, 'productId' | 'createdAt' | 'updatedAt'>>;

interface ProductFilterOptions {
  status?: ProductStatus | ProductStatus[];
  visibility?: ProductVisibility | ProductVisibility[];
  type?: ProductType | ProductType[];
  isFeatured?: boolean;
  isVirtual?: boolean;
  hasVariants?: boolean;
  /** Price bounds are integer cents, matched against the pricing-owned productBasePrice table. */
  priceMinCents?: number;
  priceMaxCents?: number;
  organizationId?: string;
  searchTerm?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

class ProductRepo {
  private readonly tableName = Table.Product;

  /**
   * Find a product by its ID
   */
  async findById(id: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "productId" = $1 AND "deletedAt" IS NULL
    `;
    const row = await queryOne<DbProduct>(sql, [id]);
    return row ? rowToProduct(row) : null;
  }

  /**
   * Find a product by its slug
   */
  async findBySlug(slug: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "slug" = $1 AND "deletedAt" IS NULL
    `;
    const row = await queryOne<DbProduct>(sql, [slug]);
    return row ? rowToProduct(row) : null;
  }

  /**
   * Find a product by its SKU
   */
  async findBySku(sku: string): Promise<Product | null> {
    const sql = `
      SELECT * FROM "${this.tableName}" 
      WHERE "sku" = $1 AND "deletedAt" IS NULL
    `;
    const row = await queryOne<DbProduct>(sql, [sku]);
    return row ? rowToProduct(row) : null;
  }

  /**
   * Get all products with pagination and filtering
   */
  async findAll(options: ProductFilterOptions = {}): Promise<Product[]> {
    const { limit = 50, offset = 0, orderBy = 'createdAt', orderDirection = 'DESC' } = options;

    const { sql: filterSql, params } = this.buildFilterClauses(options);

    // Validate orderBy to prevent SQL injection
    const validOrderColumns = ['createdAt', 'updatedAt', 'name', 'sku', 'status'];
    const safeOrderBy = validOrderColumns.includes(orderBy) ? orderBy : 'createdAt';
    const safeDirection = orderDirection === 'ASC' ? 'ASC' : 'DESC';

    const sql =
      `SELECT * FROM "${this.tableName}" WHERE "deletedAt" IS NULL${filterSql}` +
      ` ORDER BY "${safeOrderBy}" ${safeDirection}` +
      ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    return (await query<Product[]>(sql, params)) || [];
  }

  /**
   * Count products based on filter options
   */
  async count(options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'> = {}): Promise<number> {
    const { sql: filterSql, params } = this.buildFilterClauses(options);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${this.tableName}" WHERE "deletedAt" IS NULL${filterSql}`,
      params,
    );
    return result ? parseInt(result.count, 10) : 0;
  }

  // Shared WHERE-clause builder for findAll/count — both used to duplicate it.
  private buildFilterClauses(options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>): {
    sql: string;
    params: unknown[];
  } {
    const b = { sql: '', params: [] as unknown[], paramIndex: 1 };

    this.addScalarOrInClause(b, '"status"', options.status);
    this.addScalarOrInClause(b, '"visibility"', options.visibility);
    this.addScalarOrInClause(b, '"type"', options.type);
    this.addEqualsClause(b, '"isFeatured"', options.isFeatured);
    this.addEqualsClause(b, '"isVirtual"', options.isVirtual);
    this.addEqualsClause(b, '"hasVariants"', options.hasVariants);
    this.addPriceClauses(b, options);

    if (options.organizationId) {
      b.sql += ` AND "organizationId" = $${b.paramIndex++}`;
      b.params.push(options.organizationId);
    }

    if (options.searchTerm) {
      b.sql += ` AND ("name" ILIKE $${b.paramIndex} OR "description" ILIKE $${b.paramIndex} OR "sku" ILIKE $${b.paramIndex})`;
      b.params.push(`%${options.searchTerm}%`);
      b.paramIndex++;
    }

    return b;
  }

  private addScalarOrInClause(
    b: { sql: string; params: unknown[]; paramIndex: number },
    column: string,
    value: string | string[] | undefined,
  ): void {
    if (!value) return;
    if (Array.isArray(value)) {
      const placeholders = value.map(() => `$${b.paramIndex++}`).join(', ');
      b.sql += ` AND ${column} IN (${placeholders})`;
      b.params.push(...value);
    } else {
      b.sql += ` AND ${column} = $${b.paramIndex++}`;
      b.params.push(value);
    }
  }

  private addEqualsClause(b: { sql: string; params: unknown[]; paramIndex: number }, column: string, value: unknown): void {
    if (value === undefined) return;
    b.sql += ` AND ${column} = $${b.paramIndex++}`;
    b.params.push(value);
  }

  // Price bounds live in the pricing-owned productBasePrice table (integer cents).
  private addPriceClauses(
    b: { sql: string; params: unknown[]; paramIndex: number },
    options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>,
  ): void {
    if (options.priceMinCents !== undefined) {
      b.sql += ` AND EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = "${this.tableName}"."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" >= $${b.paramIndex++})`;
      b.params.push(options.priceMinCents);
    }
    if (options.priceMaxCents !== undefined) {
      b.sql += ` AND EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = "${this.tableName}"."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" <= $${b.paramIndex++})`;
      b.params.push(options.priceMaxCents);
    }
  }

  /**
   * Create a new product
   */
  async create(data: ProductCreateProps): Promise<Product> {
    const sql = `
      INSERT INTO "${this.tableName}" (
        "sku", "name", "slug", "description", "shortDescription",
        "type", "status", "visibility",
        "taxClass", "isTaxable",
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
        "userId", "organizationId",
        "returnPolicy", "warranty", "externalId",
        "hasVariants", "variantAttributes",
        "createdBy", "updatedBy"
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8,
        $9, $10,
        $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20,
        $21, $22, $23,
        $24, $25,
        $26, $27, $28,
        $29, $30, $31, $32,
        $33, $34,
        $35, $36, $37,
        $38, $39, $40,
        $41, $42,
        $43, $44,
        $45, $46, $47,
        $48, $49,
        $50, $51
      )
      RETURNING *
    `;

    const v = this.createRowValues(data);
    const values = [
      v.sku,
      v.name,
      v.slug,
      v.description,
      v.shortDescription,
      v.type,
      v.status,
      v.visibility,
      v.taxClass,
      v.isTaxable,
      v.isInventoryManaged,
      v.minOrderQuantity,
      v.maxOrderQuantity,
      v.orderIncrementQuantity,
      v.weight,
      v.weightUnit,
      v.length,
      v.width,
      v.height,
      v.dimensionUnit,
      v.metaTitle,
      v.metaDescription,
      v.metaKeywords,
      v.hsCode,
      v.countryOfOrigin,
      v.isFeatured,
      v.isNew,
      v.isBestseller,
      v.warningThreshold,
      v.preorderEnabled,
      v.preorderReleaseDate,
      v.preorderAllowance,
      v.customFields,
      v.seoData,
      v.relatedProducts,
      v.crossSellProducts,
      v.upSellProducts,
      v.isVirtual,
      v.isDownloadable,
      v.isSubscription,
      v.primaryImageId,
      v.publishedAt,
      v.userId,
      v.organizationId,
      v.returnPolicy,
      v.warranty,
      v.externalId,
      v.hasVariants,
      v.variantAttributes,
      v.createdBy,
      v.updatedBy,
    ];

    const result = await queryOne<DbProduct>(sql, values);

    if (!result) {
      throw new FailedToCreateProductError();
    }

    return rowToProduct(result);
  }

  private createRowValues(data: ProductCreateProps) {
    return {
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      type: data.type || ProductType.SIMPLE,
      status: data.status || ProductStatus.DRAFT,
      visibility: data.visibility || ProductVisibility.VISIBLE,
      ...this.createInventoryValues(data),
      ...this.createDimensionValues(data),
      ...this.createSeoValues(data),
      ...this.createFlagValues(data),
      ...this.createPreorderValues(data),
      ...this.createJsonValues(data),
      ...this.createTypeValues(data),
      ...this.createOwnershipValues(data),
      ...this.createVariantValues(data),
    };
  }

  private createInventoryValues(data: ProductCreateProps) {
    return {
      taxClass: data.taxClass || 'standard',
      isTaxable: data.isTaxable !== false,
      isInventoryManaged: data.isInventoryManaged !== false,
      minOrderQuantity: data.minOrderQuantity || 1,
      maxOrderQuantity: data.maxOrderQuantity || null,
      orderIncrementQuantity: data.orderIncrementQuantity || 1,
    };
  }

  private createDimensionValues(data: ProductCreateProps) {
    return {
      weight: data.weight || null,
      weightUnit: data.weightUnit || 'g',
      length: data.length || null,
      width: data.width || null,
      height: data.height || null,
      dimensionUnit: data.dimensionUnit || 'cm',
    };
  }

  private createSeoValues(data: ProductCreateProps) {
    return {
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      metaKeywords: data.metaKeywords || null,
      hsCode: data.hsCode || null,
      countryOfOrigin: data.countryOfOrigin || null,
    };
  }

  private createFlagValues(data: ProductCreateProps) {
    return {
      isFeatured: data.isFeatured || false,
      isNew: data.isNew || false,
      isBestseller: data.isBestseller || false,
      warningThreshold: data.warningThreshold || null,
    };
  }

  private createPreorderValues(data: ProductCreateProps) {
    return {
      preorderEnabled: data.preorderEnabled || false,
      preorderReleaseDate: data.preorderReleaseDate || null,
      preorderAllowance: data.preorderAllowance || null,
    };
  }

  private createJsonValues(data: ProductCreateProps) {
    return {
      customFields: data.customFields ? JSON.stringify(data.customFields) : null,
      seoData: data.seoData ? JSON.stringify(data.seoData) : null,
      relatedProducts: data.relatedProducts || null,
      crossSellProducts: data.crossSellProducts || null,
      upSellProducts: data.upSellProducts || null,
    };
  }

  private createTypeValues(data: ProductCreateProps) {
    return {
      isVirtual: data.isVirtual || false,
      isDownloadable: data.isDownloadable || false,
      isSubscription: data.isSubscription || false,
      primaryImageId: data.primaryImageId || null,
      publishedAt: data.publishedAt || null,
    };
  }

  private createOwnershipValues(data: ProductCreateProps) {
    return {
      userId: data.userId || null,
      organizationId: data.organizationId || null,
      returnPolicy: data.returnPolicy || null,
      warranty: data.warranty || null,
      externalId: data.externalId || null,
      createdBy: data.createdBy || null,
      updatedBy: data.updatedBy || null,
    };
  }

  private createVariantValues(data: ProductCreateProps) {
    return {
      hasVariants: data.hasVariants || false,
      variantAttributes: data.variantAttributes ? JSON.stringify(data.variantAttributes) : null,
    };
  }

  /**
   * Update an existing product
   */
  async update(id: string, data: ProductUpdateProps): Promise<Product> {
    const setStatements: string[] = ['"updatedAt" = now()'];
    const values: unknown[] = [id];
    let paramIndex = 2;

    // Build dynamic SET clause
    const updateableFields: (keyof ProductUpdateProps)[] = [
      'sku',
      'name',
      'slug',
      'description',
      'shortDescription',
      'type',
      'status',
      'visibility',
      'taxClass',
      'isTaxable',
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
      'organizationId',
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
        throw new ProductNotFoundError(id);
      }
      return existing;
    }

    const sql = `
      UPDATE "${this.tableName}"
      SET ${setStatements.join(', ')}
      WHERE "productId" = $1 AND "deletedAt" IS NULL
      RETURNING *
    `;

    const result = await queryOne<DbProduct>(sql, values);

    if (!result) {
      throw new ProductValidationError('Product not found or update failed');
    }

    return rowToProduct(result);
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
    return ((await query<DbProduct[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []).map(rowToProduct);
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
    return ((await query<DbProduct[]>(sql, [ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []).map(rowToProduct);
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
      return (
        (await query<DbProduct[]>(sql, [...product.relatedProducts, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []
      ).map(rowToProduct);
    }

    // Otherwise, find products in the same category
    if (product.categoryId) {
      const sql = `
        SELECT * FROM "${this.tableName}"
        WHERE "categoryId" = $1
          AND "productId" != $2
          AND "status" = $3
          AND "visibility" = $4
          AND "deletedAt" IS NULL
        ORDER BY "isFeatured" DESC, RANDOM()
        LIMIT $5
      `;
      return (
        (await query<DbProduct[]>(sql, [product.categoryId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, limit])) || []
      ).map(rowToProduct);
    }

    return [];
  }

  /**
   * Find products by merchant
   */
  async findByMerchant(organizationId: string, options: Omit<ProductFilterOptions, 'organizationId'> = {}): Promise<Product[]> {
    return this.findAll({ ...options, organizationId });
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

    const result = await queryOne<DbProduct>(sql, [productId, averageRating, reviewCount]);

    if (!result) {
      throw new ProductNotFoundError(productId);
    }

    return rowToProduct(result);
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

    const result = await queryOne<DbProduct>(sql, [id, ProductStatus.ACTIVE]);

    if (!result) {
      throw new ProductNotFoundError(id);
    }

    return rowToProduct(result);
  }

  /**
   * Unpublish a product
   */
  async unpublish(id: string): Promise<Product> {
    return this.update(id, { status: ProductStatus.DRAFT });
  }
}

export default new ProductRepo();
