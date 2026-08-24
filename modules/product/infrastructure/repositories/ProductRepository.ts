/**
 * Product Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import {
  Product as DbProduct,
  ProductVariant as DbProductVariant,
  ProductImage as DbProductImage,
} from '../../../../libs/db/types';
import {
  ProductRepository as IProductRepository,
  ProductFilters,
} from '../../domain/repositories/ProductRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/shared';
import { Product, ProductImage } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { Price } from '../../domain/valueObjects/Price';
import { Dimensions } from '../../domain/valueObjects/Dimensions';

export class ProductRepo implements IProductRepository {
  async findById(productId: string): Promise<Product | null> {
    const row = await queryOne<DbProduct>('SELECT * FROM product WHERE "productId" = $1 AND "deletedAt" IS NULL', [productId]);
    if (!row) return null;
    const images = await this.getProductImages(productId);
    return this.mapToProduct(row, images);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const row = await queryOne<DbProduct>('SELECT * FROM product WHERE slug = $1 AND "deletedAt" IS NULL', [slug]);
    if (!row) return null;
    const images = await this.getProductImages(row.productId);
    return this.mapToProduct(row, images);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await queryOne<DbProduct>('SELECT * FROM product WHERE sku = $1 AND "deletedAt" IS NULL', [sku]);
    if (!row) return null;
    const images = await this.getProductImages(row.productId);
    return this.mapToProduct(row, images);
  }

  async findByBarcode(barcode: string): Promise<{ product: Product; variant: ProductVariant } | null> {
    const variantRow = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE barcode = $1', [barcode]);
    if (!variantRow) return null;

    const productRow = await queryOne<DbProduct>('SELECT * FROM product WHERE "productId" = $1 AND "deletedAt" IS NULL', [
      variantRow.productId,
    ]);
    if (!productRow) return null;

    const images = await this.getProductImages(productRow.productId);
    return {
      product: this.mapToProduct(productRow, images),
      variant: this.mapToVariant(variantRow),
    };
  }

  async findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM product ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbProduct[]>(
      `SELECT * FROM product ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const products: Product[] = [];
    for (const row of rows || []) {
      const images = await this.getProductImages(row.productId);
      products.push(this.mapToProduct(row, images));
    }

    return { data: products, total, limit, offset, hasMore: offset + products.length < total, length: products.length };
  }

  async save(product: Product): Promise<Product> {
    const now = new Date().toISOString();

    const existing = await queryOne<DbProduct>('SELECT "productId" FROM product WHERE "productId" = $1', [product.productId]);

    if (existing) {
      await query(
        `UPDATE product SET
          name = $1, description = $2, "shortDescription" = $3, sku = $4, slug = $5,
          type = $6, status = $7, visibility = $8, price = $9,
          "basePrice" = $10, "salePrice" = $11, "costPrice" = $12, "taxClass" = $13,
          "isTaxable" = $14, currency = $15, "isInventoryManaged" = $16,
          weight = $17, "weightUnit" = $18, length = $19, width = $20, height = $21,
          "dimensionUnit" = $22, "metaTitle" = $23, "metaDescription" = $24, "metaKeywords" = $25,
          "isFeatured" = $26, "isNew" = $27, "isBestseller" = $28, "hasVariants" = $29,
          "organizationId" = $30, "storeId" = $31, "publishedAt" = $32, "updatedAt" = $33
        WHERE "productId" = $34`,
        [
          product.name,
          product.description,
          product.shortDescription,
          product.sku,
          product.slug,
          'simple',
          product.status,
          product.visibility,
          product.price.basePrice,
          product.price.basePrice,
          product.price.salePrice,
          product.price.cost,
          product.taxClass || 'standard',
          product.isTaxable,
          product.price.currency,
          true,
          product.dimensions.weight,
          product.dimensions.weightUnit,
          product.dimensions.length,
          product.dimensions.width,
          product.dimensions.height,
          product.dimensions.dimensionUnit,
          product.metaTitle || null,
          product.metaDescription || null,
          product.metaKeywords || null,
          product.isFeatured,
          false,
          false,
          product.hasVariants,
          product.organizationId || null,
          product.storeId || null,
          product.publishedAt?.toISOString() || null,
          now,
          product.productId,
        ],
      );
    } else {
      await query(
        `INSERT INTO product (
          "productId", name, description, "shortDescription", sku, slug,
          type, status, visibility, price, "basePrice", "salePrice", "costPrice",
          "taxClass", "isTaxable", currency, "isInventoryManaged",
          weight, "weightUnit", length, width, height, "dimensionUnit",
          "metaTitle", "metaDescription", "metaKeywords",
          "isFeatured", "isNew", "isBestseller", "hasVariants",
          "organizationId", "storeId", "publishedAt", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )`,
        [
          product.productId,
          product.name,
          product.description,
          product.shortDescription,
          product.sku,
          product.slug,
          'simple',
          product.status,
          product.visibility,
          product.price.basePrice,
          product.price.basePrice,
          product.price.salePrice,
          product.price.cost,
          product.taxClass || 'standard',
          product.isTaxable,
          product.price.currency,
          true,
          product.dimensions.weight,
          product.dimensions.weightUnit,
          product.dimensions.length,
          product.dimensions.width,
          product.dimensions.height,
          product.dimensions.dimensionUnit,
          product.metaTitle || null,
          product.metaDescription || null,
          product.metaKeywords || null,
          product.isFeatured,
          false,
          false,
          product.hasVariants,
          product.organizationId || null,
          product.storeId || null,
          product.publishedAt?.toISOString() || null,
          now,
          now,
        ],
      );
    }

    return product;
  }

  async delete(productId: string): Promise<void> {
    const now = new Date().toISOString();
    await query('UPDATE product SET "deletedAt" = $1, status = $2, "updatedAt" = $1 WHERE "productId" = $3', [
      now,
      ProductStatus.ARCHIVED,
      productId,
    ]);
  }

  async hardDelete(productId: string): Promise<void> {
    // Remove FK-dependent records before hard deleting
    await query('DELETE FROM "analyticsReportEvent" WHERE "productId" = $1', [productId]).catch((err: unknown) => { logger.debug('analyticsReportEvent cleanup skipped', { productId, error: err }); });
    await query('DELETE FROM product WHERE "productId" = $1', [productId]);
  }

  async count(filters?: ProductFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM product ${whereClause}`, params);
    return parseInt(result?.count || '0');
  }

  async findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ categoryId }, pagination);
  }

  async findByMerchant(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ organizationId }, pagination);
  }

  async findByBusiness(organizationId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ organizationId }, pagination);
  }

  async findByStore(storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ storeId }, pagination);
  }

  async findByBusinessAndStore(organizationId: string, storeId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ organizationId, storeId }, pagination);
  }

  async findFeatured(pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ isFeatured: true, status: ProductStatus.ACTIVE }, pagination);
  }

  async findRelated(productId: string, limit: number = 10): Promise<Product[]> {
    const product = await this.findById(productId);
    if (!product?.categoryId) return [];

    const rows = await query<DbProduct[]>(
      `SELECT * FROM product
       WHERE "categoryId" = $1 AND "productId" != $2 AND "deletedAt" IS NULL
       AND status = $3 AND visibility IN ($4, $5)
       ORDER BY "isFeatured" DESC, RANDOM()
       LIMIT $6`,
      [product.categoryId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, ProductVisibility.FEATURED, limit],
    );

    if (!rows || rows.length === 0) return [];

    const products: Product[] = [];
    for (const row of rows) {
      const images = await this.getProductImages(row.productId);
      products.push(this.mapToProduct(row, images));
    }
    return products;
  }

  async search(queryStr: string, filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ ...filters, search: queryStr }, pagination);
  }

  // Variant methods
  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await query<DbProductVariant[]>('SELECT * FROM "productVariant" WHERE "productId" = $1 ORDER BY "position" ASC', [
      productId,
    ]);
    return (rows || []).map(row => this.mapToVariant(row));
  }

  async findVariantById(variantId: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE "productVariantId" = $1', [variantId]);
    return row ? this.mapToVariant(row) : null;
  }

  async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE sku = $1', [sku]);
    return row ? this.mapToVariant(row) : null;
  }

  async saveVariant(variant: ProductVariant): Promise<ProductVariant> {
    const now = new Date().toISOString();

    const existing = await queryOne<DbProductVariant>('SELECT "productVariantId" FROM "productVariant" WHERE "productVariantId" = $1', [
      variant.variantId,
    ]);

    if (existing) {
      await query(
        `UPDATE "productVariant" SET
          sku = $1, name = $2, price = $3, "compareAtPrice" = $4,
          weight = $5, "weightUnit" = $6, "isDefault" = $7, "isActive" = $8,
          "sortOrder" = $9, barcode = $10, "updatedAt" = $11
        WHERE "productVariantId" = $12`,
        [
          variant.sku,
          variant.name,
          variant.price.basePrice,
          variant.price.salePrice,
          variant.dimensions.weight,
          variant.dimensions.weightUnit,
          variant.isDefault,
          variant.isActive,
          variant.position,
          variant.barcode,
          now,
          variant.variantId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "productVariant" (
          "productVariantId", "productId", sku, name, price, "compareAtPrice",
          weight, "weightUnit", "isDefault", "isActive", position, barcode,
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          variant.variantId,
          variant.productId,
          variant.sku,
          variant.name,
          variant.price.basePrice,
          variant.price.salePrice,
          variant.dimensions.weight,
          variant.dimensions.weightUnit,
          variant.isDefault,
          variant.isActive,
          variant.position,
          variant.barcode,
          now,
          now,
        ],
      );
    }

    return variant;
  }

  async deleteVariant(variantId: string): Promise<void> {
    await query('DELETE FROM "productVariant" WHERE "productVariantId" = $1', [variantId]);
  }

  async getDefaultVariant(productId: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE "productId" = $1 AND "isDefault" = true', [
      productId,
    ]);
    return row ? this.mapToVariant(row) : null;
  }

  // Image methods
  async getProductImages(productId: string): Promise<ProductImage[]> {
    const rows = await query<DbProductImage[]>('SELECT * FROM "productImage" WHERE "productId" = $1 ORDER BY position ASC', [
      productId,
    ]);
    return (rows || []).map(row => ({
      imageId: row.productImageId,
      url: row.url,
      altText: row.alt ?? undefined,
      position: row.position,
      isPrimary: Boolean(row.isPrimary),
    }));
  }

  async addProductImage(productId: string, image: ProductImage): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "productImage" ("productImageId", "productId", url, "altText", position, "isPrimary", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [image.imageId, productId, image.url, image.altText, image.position, image.isPrimary, now, now],
    );
  }

  async updateProductImage(imageId: string, updates: { altText?: string; position?: number; isPrimary?: boolean }): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = $1'];
    const params: unknown[] = [new Date().toISOString()];
    let paramIndex = 2;

    if (updates.altText !== undefined) {
      setClauses.push(`"altText" = $${paramIndex++}`);
      params.push(updates.altText);
    }
    if (updates.position !== undefined) {
      setClauses.push(`position = $${paramIndex++}`);
      params.push(updates.position);
    }
    if (updates.isPrimary !== undefined) {
      setClauses.push(`"isPrimary" = $${paramIndex++}`);
      params.push(updates.isPrimary);
    }

    params.push(imageId);
    await query(`UPDATE "productImage" SET ${setClauses.join(', ')} WHERE "productImageId" = $${paramIndex}`, params);
  }

  async deleteProductImage(imageId: string): Promise<void> {
    await query('DELETE FROM "productImage" WHERE "productImageId" = $1', [imageId]);
  }

  async reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await query('UPDATE "productImage" SET position = $1, "updatedAt" = $2 WHERE "productImageId" = $3 AND "productId" = $4', [
        i,
        new Date().toISOString(),
        imageIds[i],
        productId,
      ]);
    }
  }

  // Private helper methods
  private buildWhereClause(filters?: ProductFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        conditions.push(`status IN (${filters.status.map(() => `$${paramIndex++}`).join(', ')})`);
        params.push(...filters.status);
      } else {
        conditions.push(`status = $${paramIndex++}`);
        params.push(filters.status);
      }
    }
    if (filters?.visibility) {
      if (Array.isArray(filters.visibility)) {
        conditions.push(`visibility IN (${filters.visibility.map(() => `$${paramIndex++}`).join(', ')})`);
        params.push(...filters.visibility);
      } else {
        conditions.push(`visibility = $${paramIndex++}`);
        params.push(filters.visibility);
      }
    }
    if (filters?.categoryId) {
      // Category filtering not implemented in current schema
    }
    if (filters?.organizationId) {
      conditions.push(`"organizationId" = $${paramIndex++}`);
      params.push(filters.organizationId);
    }
    if (filters?.organizationId) {
      conditions.push(`"organizationId" = $${paramIndex++}`);
      params.push(filters.organizationId);
    }
    if (filters?.storeId) {
      conditions.push(`"storeId" = $${paramIndex++}`);
      params.push(filters.storeId);
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${paramIndex++}`);
      params.push(filters.isFeatured);
    }
    if (filters?.priceMin !== undefined) {
      conditions.push(`price >= $${paramIndex++}`);
      params.push(filters.priceMin);
    }
    if (filters?.priceMax !== undefined) {
      conditions.push(`price <= $${paramIndex++}`);
      params.push(filters.priceMax);
    }
    if (filters?.search) {
      conditions.push(
        `(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} OR "productId" IN (SELECT pv."productId" FROM "productVariant" pv WHERE pv."sku" ILIKE $${paramIndex} OR pv."barcode" ILIKE $${paramIndex}))`,
      );
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToProduct(row: DbProduct, images: ProductImage[]): Product {
    const currency = row.currency || 'USD';

    return Product.reconstitute({
      productId: row.productId,
      name: row.name,
      description: row.description || '',
      shortDescription: row.shortDescription ?? undefined,
      sku: row.sku,
      slug: row.slug,
      productTypeId: row.type,
      categoryId: undefined,
      organizationId: row.organizationId ?? undefined,
      storeId: row.storeId ?? undefined,
      status: row.status as ProductStatus,
      visibility: row.visibility as ProductVisibility,
      price: Price.create(
        parseFloat(String(row.price || row.basePrice || 0)),
        currency,
        row.salePrice ? parseFloat(row.salePrice) : undefined,
        row.costPrice ? parseFloat(row.costPrice) : undefined,
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        weightUnit: (row.weightUnit || 'g') as 'kg' | 'lb' | 'oz' | 'g',
        length: row.length ? parseFloat(row.length) : undefined,
        width: row.width ? parseFloat(row.width) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        dimensionUnit: (row.dimensionUnit || 'cm') as 'cm' | 'in' | 'm' | 'mm',
      }),
      isFeatured: Boolean(row.isFeatured),
      isVirtual: Boolean(row.isVirtual),
      isDownloadable: Boolean(row.isDownloadable),
      isSubscription: Boolean(row.isSubscription),
      isTaxable: Boolean(row.isTaxable),
      taxClass: row.taxClass ?? undefined,
      hasVariants: Boolean(row.hasVariants),
      variantAttributes: row.variantAttributes
        ? typeof row.variantAttributes === 'string'
          ? JSON.parse(row.variantAttributes as string)
          : (row.variantAttributes as Record<string, unknown>)
        : undefined,
      images,
      primaryImageId: row.primaryImageId ?? undefined,
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      metaKeywords: row.metaKeywords ?? undefined,
      minOrderQuantity: row.minOrderQuantity ?? 1,
      maxOrderQuantity: row.maxOrderQuantity ?? undefined,
      returnPolicy: row.returnPolicy ?? undefined,
      warranty: row.warranty ?? undefined,
      externalId: row.externalId ?? undefined,
      tags: [],
      metadata: undefined,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }

  private mapToVariant(row: DbProductVariant): ProductVariant {
    const currency = 'USD';

    return ProductVariant.reconstitute({
      variantId: row.productVariantId,
      productId: row.productId,
      sku: row.sku,
      name: row.name || '',
      price: Price.create(
        parseFloat(String(row.price || 0)),
        currency,
        undefined,
        undefined,
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        weightUnit: 'g',
        length: row.length ? parseFloat(row.length) : undefined,
        width: row.width ? parseFloat(row.width) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        dimensionUnit: 'cm',
      }),
      attributes: [],
      stockQuantity: 0,
      lowStockThreshold: 5,
      isDefault: Boolean(row.isDefault),
      isActive: row.status === 'active',
      position: row.position ?? 0,
      barcode: row.barcode ?? undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    });
  }
}export default new ProductRepo();
