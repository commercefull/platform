/**
 * Product Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { Product as DbProduct, ProductVariant as DbProductVariant } from '../../../../libs/db/types';
import { ProductRepository as IProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { Product, ProductImage } from '../../domain/entities/Product';
import { CatalogFeature } from '../../domain/entities/CatalogFeature';
import { ProductVariant } from '../../domain/entities/ProductVariant';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { mapToProduct, mapToVariant } from './productRowMappers';
import { buildWhereClause as buildFilterWhereClause } from './productFilterQueries';
import { listCatalogFeatureRows as qListCatalogFeatureRows } from './productCatalogFeatureQueries';
import {
  findVariantsByProductId as qFindVariantsByProductId,
  findVariantById as qFindVariantById,
  findVariantBySku as qFindVariantBySku,
  saveVariant as qSaveVariant,
  deleteVariant as qDeleteVariant,
  getDefaultVariant as qGetDefaultVariant,
  getProductImages as qGetProductImages,
  addProductImage as qAddProductImage,
  updateProductImage as qUpdateProductImage,
  deleteProductImage as qDeleteProductImage,
  reorderProductImages as qReorderProductImages,
} from './productVariantImageQueries';

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

    const orderExpr = this.resolveOrderExpr(orderBy);

    const rows = await query<DbProduct[]>(
      `SELECT * FROM product ${whereClause}
       ORDER BY ${orderExpr} ${orderDir.toUpperCase()} NULLS LAST
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    // A short first page is already an exact total — skip the COUNT(*) scan.
    const total = await this.pagedTotal(rows?.length ?? 0, limit, offset, `SELECT COUNT(*) as count FROM product ${whereClause}`, params);

    const products = await this.hydrateProducts(rows || []);

    return { data: products, total, limit, offset, hasMore: offset + products.length < total, length: products.length };
  }

  // Price sorting resolves against the pricing-owned productBasePrice table
  // (product-level rows only); all other columns sort on the product table.
  // orderBy comes from the query string — restrict to known product columns.
  private resolveOrderExpr(orderBy: string): string {
    if (orderBy === 'priceCents' || orderBy === 'basePrice') {
      return `(SELECT bp."priceCents" FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL LIMIT 1)`;
    }
    const sortableColumns = new Set(['createdAt', 'updatedAt', 'name', 'sku', 'status', 'visibility', 'type', 'publishedAt', 'isFeatured']);
    return sortableColumns.has(orderBy) ? `"${orderBy}"` : '"createdAt"';
  }

  // A short first page is already an exact total — skip the COUNT(*) scan.
  private async pagedTotal(rowCount: number, limit: number, offset: number, countSql: string, params: unknown[]): Promise<number> {
    if (offset === 0 && rowCount < limit) return rowCount;
    const result = await queryOne<{ count: string }>(countSql, params);
    return parseInt(result?.count || '0');
  }

  // Batch load all images in a single query to avoid N+1
  private async hydrateProducts(rowsList: DbProduct[]): Promise<Product[]> {
    if (rowsList.length === 0) return [];

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

    return rowsList.map(row => this.mapToProduct(row, (imagesByProduct.get(row.productId) || []) as never));
  }

  async save(product: Product): Promise<Product> {
    // The advanced productType relationship is a uuid FK; hydrated legacy
    // rows expose the kind literal (simple/downloadable/...) in
    // `productTypeId`, so only persist uuid-shaped values.
    const persistedProductTypeId = ProductRepo.UUID_PATTERN.test(product.productTypeId || '') ? product.productTypeId : null;

    const existing = await queryOne<DbProduct>('SELECT "productId" FROM product WHERE "productId" = $1', [product.productId]);

    if (existing) {
      await this.updateProduct(product, persistedProductTypeId);
    } else {
      await this.insertProduct(product, persistedProductTypeId);
    }

    await query(`UPDATE product SET "isVirtual" = $1, "isDownloadable" = $2, "isSubscription" = $3 WHERE "productId" = $4`, [
      product.isVirtual,
      product.isDownloadable,
      product.isSubscription,
      product.productId,
    ]);

    return product;
  }

  private productTypeLiteral(product: Product): string {
    if (product.isDownloadable) return 'downloadable';
    if (product.isVirtual) return 'virtual';
    if (product.isSubscription) return 'subscription';
    return 'simple';
  }

  private productRowValues(product: Product, persistedProductTypeId: string | null) {
    return {
      name: product.name,
      description: product.description,
      shortDescription: product.shortDescription,
      sku: product.sku,
      slug: product.slug,
      type: this.productTypeLiteral(product),
      status: product.status,
      visibility: product.visibility,
      taxClass: product.taxClass || 'standard',
      isTaxable: product.isTaxable,
      isInventoryManaged: product.isInventoryManaged,
      weight: product.dimensions.weight,
      weightUnit: product.dimensions.weightUnit,
      length: product.dimensions.length,
      width: product.dimensions.width,
      height: product.dimensions.height,
      dimensionUnit: product.dimensions.dimensionUnit,
      metaTitle: product.metaTitle || null,
      metaDescription: product.metaDescription || null,
      metaKeywords: product.metaKeywords || null,
      isFeatured: product.isFeatured,
      hasVariants: product.hasVariants,
      organizationId: product.organizationId || null,
      storeId: product.storeId || null,
      publishedAt: product.publishedAt?.toISOString() || null,
      productTypeId: persistedProductTypeId,
    };
  }

  private async updateProduct(product: Product, persistedProductTypeId: string | null): Promise<void> {
    const now = new Date().toISOString();
    const v = this.productRowValues(product, persistedProductTypeId);
    await query(
      `UPDATE product SET
          name = $1, description = $2, "shortDescription" = $3, sku = $4, slug = $5,
          type = $6, status = $7, visibility = $8,
          "taxClass" = $9,
          "isTaxable" = $10, "isInventoryManaged" = $11,
          weight = $12, "weightUnit" = $13, length = $14, width = $15, height = $16,
          "dimensionUnit" = $17, "metaTitle" = $18, "metaDescription" = $19, "metaKeywords" = $20,
          "isFeatured" = $21, "isNew" = $22, "isBestseller" = $23, "hasVariants" = $24,
          "organizationId" = $25, "storeId" = $26, "publishedAt" = $27, "updatedAt" = $28,
          "productTypeId" = $29
        WHERE "productId" = $30`,
      [
        v.name,
        v.description,
        v.shortDescription,
        v.sku,
        v.slug,
        v.type,
        v.status,
        v.visibility,
        v.taxClass,
        v.isTaxable,
        v.isInventoryManaged,
        v.weight,
        v.weightUnit,
        v.length,
        v.width,
        v.height,
        v.dimensionUnit,
        v.metaTitle,
        v.metaDescription,
        v.metaKeywords,
        v.isFeatured,
        false,
        false,
        v.hasVariants,
        v.organizationId,
        v.storeId,
        v.publishedAt,
        now,
        v.productTypeId,
        product.productId,
      ],
    );
  }

  private async insertProduct(product: Product, persistedProductTypeId: string | null): Promise<void> {
    const now = new Date().toISOString();
    const v = this.productRowValues(product, persistedProductTypeId);
    await query(
      `INSERT INTO product (
          "productId", name, description, "shortDescription", sku, slug,
          type, status, visibility,
          "taxClass", "isTaxable", "isInventoryManaged",
          weight, "weightUnit", length, width, height, "dimensionUnit",
          "metaTitle", "metaDescription", "metaKeywords",
          "isFeatured", "isNew", "isBestseller", "hasVariants",
          "organizationId", "storeId", "publishedAt", "productTypeId", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
        )`,
      [
        product.productId,
        v.name,
        v.description,
        v.shortDescription,
        v.sku,
        v.slug,
        v.type,
        v.status,
        v.visibility,
        v.taxClass,
        v.isTaxable,
        v.isInventoryManaged,
        v.weight,
        v.weightUnit,
        v.length,
        v.width,
        v.height,
        v.dimensionUnit,
        v.metaTitle,
        v.metaDescription,
        v.metaKeywords,
        v.isFeatured,
        false,
        false,
        v.hasVariants,
        v.organizationId,
        v.storeId,
        v.publishedAt,
        v.productTypeId,
        now,
        now,
      ],
    );
  }

  private static readonly UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    // Manual 'related' links from productRelated take precedence — a merchant
    // curated these and they must outrank any computed fallback.
    const linked = await query<Array<{ relatedProductId: string }>>(
      `SELECT "relatedProductId" FROM "productRelated"
       WHERE "productId" = $1 AND type = 'related'
       ORDER BY "position" ASC`,
      [productId],
    );

    let rows: DbProduct[] | null;
    if (linked && linked.length > 0) {
      const ids = linked.map(r => r.relatedProductId);
      rows = await query<DbProduct[]>(
        `SELECT * FROM product
         WHERE "productId" = ANY($1) AND "deletedAt" IS NULL
         AND status = $2 AND visibility IN ($3, $4)
         LIMIT $5`,
        [ids, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, ProductVisibility.FEATURED, limit],
      );
    } else {
      // Category fallback via the productToCategory mapping table — the
      // product row has no direct categoryId column.
      rows = await query<DbProduct[]>(
        `SELECT p.* FROM product p
         JOIN "productToCategory" ptc ON ptc."productId" = p."productId"
         WHERE ptc."productCategoryId" = (
           SELECT "productCategoryId" FROM "productToCategory"
           WHERE "productId" = $1 ORDER BY "isPrimary" DESC, "position" ASC LIMIT 1
         )
         AND p."productId" != $1 AND p."deletedAt" IS NULL
         AND p.status = $2 AND p.visibility IN ($3, $4)
         ORDER BY p."isFeatured" DESC, RANDOM()
         LIMIT $5`,
        [productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, ProductVisibility.FEATURED, limit],
      );
    }

    if (!rows || rows.length === 0) return [];

    const products: Product[] = [];
    for (const row of rows) {
      const images = await this.getProductImages(row.productId);
      products.push(this.mapToProduct(row, images));
    }
    return products;
  }

  async findByIds(productIds: string[]): Promise<Product[]> {
    const ids = [...new Set(productIds.filter(Boolean))];
    if (ids.length === 0) return [];

    const rows = await query<DbProduct[]>(`SELECT * FROM product WHERE "productId" = ANY($1) AND "deletedAt" IS NULL`, [ids]);
    if (!rows || rows.length === 0) return [];

    const foundIds = rows.map(r => r.productId);
    const allImages = await query<Array<{ productId: string } & Record<string, unknown>>>(
      `SELECT * FROM "productImage" WHERE "productId" = ANY($1) ORDER BY "productId", "position" ASC`,
      [foundIds],
    );
    const imagesByProduct = new Map<string, Array<Record<string, unknown>>>();
    for (const img of allImages || []) {
      const arr = imagesByProduct.get(img.productId) || [];
      arr.push(img);
      imagesByProduct.set(img.productId, arr);
    }
    return rows.map(row => this.mapToProduct(row, (imagesByProduct.get(row.productId) || []) as never));
  }

  async listCatalogFeatureRows(params: { organizationId?: string; afterProductId?: string; limit?: number }): Promise<CatalogFeature[]> {
    return qListCatalogFeatureRows(params);
  }

  async search(queryStr: string, filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ ...filters, search: queryStr }, pagination);
  }

  // Variant methods — delegated to productVariantImageQueries.ts
  async findVariantsByProductId(productId: string): Promise<ProductVariant[]> {
    return qFindVariantsByProductId(productId);
  }

  async findVariantById(variantId: string): Promise<ProductVariant | null> {
    return qFindVariantById(variantId);
  }

  async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    return qFindVariantBySku(sku);
  }

  async saveVariant(variant: ProductVariant): Promise<ProductVariant> {
    return qSaveVariant(variant);
  }

  async deleteVariant(variantId: string): Promise<void> {
    return qDeleteVariant(variantId);
  }

  async getDefaultVariant(productId: string): Promise<ProductVariant | null> {
    return qGetDefaultVariant(productId);
  }

  // Image methods — delegated to productVariantImageQueries.ts
  async getProductImages(productId: string): Promise<ProductImage[]> {
    return qGetProductImages(productId);
  }

  async addProductImage(productId: string, image: ProductImage): Promise<void> {
    return qAddProductImage(productId, image);
  }

  async updateProductImage(imageId: string, updates: { altText?: string; position?: number; isPrimary?: boolean }): Promise<void> {
    return qUpdateProductImage(imageId, updates);
  }

  async deleteProductImage(imageId: string): Promise<void> {
    return qDeleteProductImage(imageId);
  }

  async reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
    return qReorderProductImages(productId, imageIds);
  }

  // Private helper methods
  // Private helper methods — delegated to extracted modules
  private buildWhereClause(filters?: ProductFilters): { whereClause: string; params: unknown[] } {
    return buildFilterWhereClause(filters);
  }

  private mapToProduct(row: DbProduct, images: ProductImage[]): Product {
    return mapToProduct(row, images);
  }

  private mapToVariant(row: DbProductVariant): ProductVariant {
    return mapToVariant(row);
  }
}
export default new ProductRepo();
