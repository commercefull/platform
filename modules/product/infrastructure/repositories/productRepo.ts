import { queryOne, query } from '../../../../libs/db';
import { Table } from '../../../../libs/db/types';
import { ProductNotFoundError, FailedToCreateProductError, ProductValidationError } from '../../domain/errors/ProductErrors';
import type { Product as DbProduct } from '../../../../libs/db/types';
import { rowToProduct } from './productTableMappers';
import { buildFilterClauses } from './productFilterClauses';
import { createRowValues } from './productCreateValues';
import {
  findNew as qFindNew,
  findBestsellers as qFindBestsellers,
  findRelated as qFindRelated,
  updateRating as qUpdateRating,
  publish as qPublish,
} from './productListingQueries';
import { ProductStatus, ProductVisibility } from './productTypes';
import type { Product, ProductCreateProps, ProductUpdateProps, ProductFilterOptions } from './productTypes';
export { ProductStatus, ProductVisibility, ProductType } from './productTypes';
export type { Product, ProductCreateProps, ProductUpdateProps, ProductFilterOptions } from './productTypes';

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

  // Shared WHERE-clause builder for findAll/count — delegated
  private buildFilterClauses(options: Omit<ProductFilterOptions, 'limit' | 'offset' | 'orderBy' | 'orderDirection'>): {
    sql: string;
    params: unknown[];
  } {
    return buildFilterClauses(options, this.tableName);
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

    const v = createRowValues(data);
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
    return qFindNew(this.tableName, limit);
  }

  /**
   * Find bestseller products
   */
  async findBestsellers(limit: number = 10): Promise<Product[]> {
    return qFindBestsellers(this.tableName, limit);
  }

  /**
   * Find related products
   */
  async findRelated(productId: string, limit: number = 10): Promise<Product[]> {
    return qFindRelated(this.tableName, id => this.findById(id), productId, limit);
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
    return qUpdateRating(this.tableName, productId, averageRating, reviewCount);
  }

  /**
   * Publish a product
   */
  async publish(id: string): Promise<Product> {
    return qPublish(this.tableName, id);
  }

  /**
   * Unpublish a product
   */
  async unpublish(id: string): Promise<Product> {
    return this.update(id, { status: ProductStatus.DRAFT });
  }
}

export default new ProductRepo();
