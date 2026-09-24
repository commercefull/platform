/**
 * Product Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { Product as DbProduct, ProductVariant as DbProductVariant, ProductImage as DbProductImage } from '../../../../libs/db/types';
import { ProductRepository as IProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/shared';
import { Product, ProductImage } from '../../domain/entities/Product';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
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

    // Price sorting resolves against the pricing-owned productBasePrice table
    // (product-level rows only); all other columns sort on the product table.
    // orderBy comes from the query string — restrict to known product columns.
    const sortableColumns = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'sku',
      'status',
      'visibility',
      'type',
      'publishedAt',
      'isFeatured',
    ]);
    const orderExpr =
      orderBy === 'priceCents' || orderBy === 'basePrice'
        ? `(SELECT bp."priceCents" FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL LIMIT 1)`
        : sortableColumns.has(orderBy)
          ? `"${orderBy}"`
          : '"createdAt"';

    const rows = await query<DbProduct[]>(
      `SELECT * FROM product ${whereClause}
       ORDER BY ${orderExpr} ${orderDir.toUpperCase()} NULLS LAST
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const products: Product[] = [];
    const rowsList = rows || [];
    if (rowsList.length > 0) {
      // Batch load all images in a single query to avoid N+1
      const productIds = rowsList.map(r => r.productId);
      const allImages = await query<Array<{ productId: string } & Record<string, unknown>>>(
        `SELECT * FROM "productImage" WHERE "productId" = ANY($1) ORDER BY "productId", "position" ASC`,
        [productIds],
      );
      const imagesByProduct = new Map<string, Array<Record<string, unknown>>>();
      for (const img of allImages || []) {
        const arr = imagesByProduct.get(img.productId) || [];
        arr.push(img);
        imagesByProduct.set(img.productId, arr);
      }
      for (const row of rowsList) {
        const images = imagesByProduct.get(row.productId) || [];
        products.push(this.mapToProduct(row, images as never));
      }
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
          type = $6, status = $7, visibility = $8,
          "taxClass" = $9,
          "isTaxable" = $10, "isInventoryManaged" = $11,
          weight = $12, "weightUnit" = $13, length = $14, width = $15, height = $16,
          "dimensionUnit" = $17, "metaTitle" = $18, "metaDescription" = $19, "metaKeywords" = $20,
          "isFeatured" = $21, "isNew" = $22, "isBestseller" = $23, "hasVariants" = $24,
          "organizationId" = $25, "storeId" = $26, "publishedAt" = $27, "updatedAt" = $28
        WHERE "productId" = $29`,
        [
          product.name,
          product.description,
          product.shortDescription,
          product.sku,
          product.slug,
          'simple',
          product.status,
          product.visibility,
          product.taxClass || 'standard',
          product.isTaxable,
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
          type, status, visibility,
          "taxClass", "isTaxable", "isInventoryManaged",
          weight, "weightUnit", length, width, height, "dimensionUnit",
          "metaTitle", "metaDescription", "metaKeywords",
          "isFeatured", "isNew", "isBestseller", "hasVariants",
          "organizationId", "storeId", "publishedAt", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30
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
          product.taxClass || 'standard',
          product.isTaxable,
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
    await query('DELETE FROM "analyticsReportEvent" WHERE "productId" = $1', [productId]).catch((err: unknown) => {
      logger.debug('analyticsReportEvent cleanup skipped', { productId, error: err });
    });
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
          sku = $1, name = $2,
          weight = $3, "isDefault" = $4, status = $5,
          "position" = $6, barcode = $7, "updatedAt" = $8
        WHERE "productVariantId" = $9`,
        [
          variant.sku,
          variant.name,
          variant.dimensions.weight,
          variant.isDefault,
          variant.isActive ? 'active' : 'inactive',
          variant.position,
          variant.barcode,
          now,
          variant.variantId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "productVariant" (
          "productVariantId", "productId", sku, name,
          weight, "isDefault", status, position, barcode,
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          variant.variantId,
          variant.productId,
          variant.sku,
          variant.name,
          variant.dimensions.weight,
          variant.isDefault,
          variant.isActive ? 'active' : 'inactive',
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
    const rows = await query<DbProductImage[]>('SELECT * FROM "productImage" WHERE "productId" = $1 ORDER BY position ASC', [productId]);
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
    if (filters?.storeId) {
      conditions.push(`"storeId" = $${paramIndex++}`);
      params.push(filters.storeId);
    }
    if (filters?.brandId) {
      conditions.push(`"brandId" = $${paramIndex++}`);
      params.push(filters.brandId);
    }
    if (filters?.brandIds && filters.brandIds.length > 0) {
      const placeholders = filters.brandIds.map(() => `$${paramIndex++}`).join(', ');
      conditions.push(`"brandId" IN (${placeholders})`);
      params.push(...filters.brandIds);
    }
    if (filters?.isFeatured !== undefined) {
      conditions.push(`"isFeatured" = $${paramIndex++}`);
      params.push(filters.isFeatured);
    }
    // Price bounds live in the pricing-owned productBasePrice table (integer cents)
    if (filters?.priceMinCents !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" >= $${paramIndex++})`,
      );
      params.push(filters.priceMinCents);
    }
    if (filters?.priceMaxCents !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" <= $${paramIndex++})`,
      );
      params.push(filters.priceMaxCents);
    }
    if (filters?.search) {
      // UNION inside the IN keeps each arm on its own trigram index — a plain
      // OR across product columns and the productVariant join can't BitmapOr.
      conditions.push(
        `"productId" IN (SELECT "productId" FROM product WHERE name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex} UNION SELECT "productId" FROM "productVariant" WHERE sku ILIKE $${paramIndex} OR barcode ILIKE $${paramIndex})`,
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
    return ProductVariant.reconstitute({
      variantId: row.productVariantId,
      productId: row.productId,
      sku: row.sku,
      name: row.name || '',
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
}
export default new ProductRepo();
