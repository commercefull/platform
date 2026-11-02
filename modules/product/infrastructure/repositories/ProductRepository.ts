/**
 * Product Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { logger } from '../../../../libs/logger';
import { Product as DbProduct, ProductVariant as DbProductVariant, ProductImage as DbProductImage } from '../../../../libs/db/types';
import { ProductRepository as IProductRepository, ProductFilters } from '../../domain/repositories/ProductRepository';
import { PaginationOptions, PaginatedResult } from 'libs/types/pagination';
import { Product, ProductImage } from '../../domain/entities/Product';
import { CatalogFeature } from '../../domain/entities/CatalogFeature';
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
    const limit = params.limit ?? 500;
    const rows = await query<
      Array<{
        productId: string;
        organizationId: string | null;
        storeId: string | null;
        status: string;
        visibility: string;
        type: string;
        brandId: string | null;
        averageRating: string | null;
        publishedAt: string | null;
        isFeatured: boolean;
        isBestseller: boolean;
        primaryCategoryId: string | null;
        categoryIds: unknown;
        collectionIds: unknown;
        attributeValues: unknown;
        basePriceCents: number | null;
      }>
    >(
      `SELECT
         p."productId", p."organizationId", p."storeId", p."status", p."visibility", p."type",
         p."brandId", p."averageRating", p."publishedAt", p."isFeatured", p."isBestseller",
         (SELECT ptc."productCategoryId" FROM "productToCategory" ptc
           WHERE ptc."productId" = p."productId"
           ORDER BY ptc."isPrimary" DESC, ptc."position" ASC LIMIT 1) AS "primaryCategoryId",
         COALESCE((SELECT json_agg(x."productCategoryId") FROM (
           SELECT DISTINCT ptc2."productCategoryId" FROM "productToCategory" ptc2
           WHERE ptc2."productId" = p."productId") x), '[]'::json) AS "categoryIds",
         COALESCE((SELECT json_agg(pcm."assortmentCollectionId") FROM "assortmentCollectionMap" pcm
           WHERE pcm."productId" = p."productId"), '[]'::json) AS "collectionIds",
         COALESCE((SELECT json_agg(json_build_object('attributeId', avm."attributeId", 'value', avm."value"))
           FROM "productAttributeValueMap" avm WHERE avm."productId" = p."productId"), '[]'::json) AS "attributeValues",
         (SELECT bp."priceCents" FROM "productBasePrice" bp
           WHERE bp."productId" = p."productId" AND bp."productVariantId" IS NULL LIMIT 1) AS "basePriceCents"
       FROM product p
       WHERE p."deletedAt" IS NULL
         AND ($1::uuid IS NULL OR p."organizationId" = $1)
         AND ($2::uuid IS NULL OR p."productId" > $2)
       ORDER BY p."productId" ASC
       LIMIT $3`,
      [params.organizationId ?? null, params.afterProductId ?? null, limit],
    );

    return (rows || []).map(row => {
      const categoryIds = (row.categoryIds as string[]) || [];
      return {
        productId: row.productId,
        organizationId: row.organizationId,
        storeId: row.storeId,
        status: row.status,
        visibility: row.visibility,
        type: row.type,
        brandId: row.brandId,
        primaryCategoryId: row.primaryCategoryId,
        secondaryCategoryIds: categoryIds.filter(c => c !== row.primaryCategoryId),
        collectionIds: (row.collectionIds as string[]) || [],
        attributeValues: (row.attributeValues as CatalogFeature['attributeValues']) || [],
        basePriceCents: row.basePriceCents !== null ? Number(row.basePriceCents) : null,
        averageRating: row.averageRating !== null ? Number(row.averageRating) : null,
        publishedAt: row.publishedAt ? new Date(row.publishedAt) : null,
        isFeatured: row.isFeatured,
        isBestseller: row.isBestseller,
      };
    });
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

    await query(`UPDATE "productVariant" SET "inventoryPolicy" = $1 WHERE "productVariantId" = $2`, [
      variant.inventoryPolicy,
      variant.variantId,
    ]);

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
      `INSERT INTO "productImage" ("productImageId", "productId", url, "alt", position, "isPrimary", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [image.imageId, productId, image.url, image.altText, image.position, image.isPrimary, now, now],
    );
  }

  async updateProductImage(imageId: string, updates: { altText?: string; position?: number; isPrimary?: boolean }): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = $1'];
    const params: unknown[] = [new Date().toISOString()];
    let paramIndex = 2;

    if (updates.altText !== undefined) {
      setClauses.push(`"alt" = $${paramIndex++}`);
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
    const b = { conditions: ['"deletedAt" IS NULL'], params: [] as unknown[], paramIndex: 1 };

    this.addScalarOrInFilter(b, 'status', filters?.status);
    this.addScalarOrInFilter(b, 'visibility', filters?.visibility);

    if (filters?.categoryId) {
      // Product↔category lives in the productToCategory mapping table
      b.conditions.push(
        `EXISTS (SELECT 1 FROM "productToCategory" ptc WHERE ptc."productId" = product."productId" AND ptc."productCategoryId" = $${b.paramIndex++})`,
      );
      b.params.push(filters.categoryId);
    }

    this.addScalarOrInFilter(b, '"organizationId"', filters?.organizationId);
    this.addScalarOrInFilter(b, '"storeId"', filters?.storeId);
    this.addIdListFilter(b, '"productId"', filters?.productIds);
    this.addIdListFilter(b, '"productId"', filters?.excludeProductIds, true);
    this.addScalarOrInFilter(b, '"brandId"', filters?.brandId);
    this.addIdListFilter(b, '"brandId"', filters?.brandIds);
    this.addSpecialFilters(b, filters);

    return {
      whereClause: b.conditions.length > 0 ? `WHERE ${b.conditions.join(' AND ')}` : '',
      params: b.params,
    };
  }

  // isFeatured flag, price bounds (via productBasePrice EXISTS), and the
  // text-search UNION.
  private addSpecialFilters(b: { conditions: string[]; params: unknown[]; paramIndex: number }, filters?: ProductFilters): void {
    if (filters?.isFeatured !== undefined) {
      b.conditions.push(`"isFeatured" = $${b.paramIndex++}`);
      b.params.push(filters.isFeatured);
    }
    // Price bounds live in the pricing-owned productBasePrice table (integer cents)
    if (filters?.priceMinCents !== undefined) {
      b.conditions.push(
        `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" >= $${b.paramIndex++})`,
      );
      b.params.push(filters.priceMinCents);
    }
    if (filters?.priceMaxCents !== undefined) {
      b.conditions.push(
        `EXISTS (SELECT 1 FROM "productBasePrice" bp WHERE bp."productId" = product."productId" AND bp."productVariantId" IS NULL AND bp."priceCents" <= $${b.paramIndex++})`,
      );
      b.params.push(filters.priceMaxCents);
    }
    if (filters?.search) {
      // UNION inside the IN keeps each arm on its own trigram index — a plain
      // OR across product columns and the productVariant join can't BitmapOr.
      b.conditions.push(
        `"productId" IN (SELECT "productId" FROM product WHERE name ILIKE $${b.paramIndex} OR description ILIKE $${b.paramIndex} OR sku ILIKE $${b.paramIndex} UNION SELECT "productId" FROM "productVariant" WHERE sku ILIKE $${b.paramIndex} OR barcode ILIKE $${b.paramIndex})`,
      );
      b.params.push(`%${filters.search}%`);
      b.paramIndex++;
    }
  }

  // Scalar value or IN-list — both produce one condition per filter.
  private addScalarOrInFilter(
    b: { conditions: string[]; params: unknown[]; paramIndex: number },
    column: string,
    value: string | string[] | undefined,
  ): void {
    if (!value || (Array.isArray(value) && value.length === 0)) return;
    if (Array.isArray(value)) {
      b.conditions.push(`${column} IN (${value.map(() => `$${b.paramIndex++}`).join(', ')})`);
      b.params.push(...value);
    } else {
      b.conditions.push(`${column} = $${b.paramIndex++}`);
      b.params.push(value);
    }
  }

  private addIdListFilter(
    b: { conditions: string[]; params: unknown[]; paramIndex: number },
    column: string,
    ids: string[] | undefined,
    negate = false,
  ): void {
    if (!ids || ids.length === 0) return;
    const placeholders = ids.map(() => `$${b.paramIndex++}`).join(', ');
    b.conditions.push(`${column} ${negate ? 'NOT IN' : 'IN'} (${placeholders})`);
    b.params.push(...ids);
  }

  private mapToProduct(row: DbProduct, images: ProductImage[]): Product {
    return Product.reconstitute({
      ...this.productIdentityFromRow(row),
      ...this.productFlagsFromRow(row),
      ...this.productMetaFromRow(row),
      dimensions: this.dimensionsFromRow(row),
      images,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined,
    });
  }

  private productIdentityFromRow(row: DbProduct) {
    return {
      productId: row.productId,
      name: row.name,
      description: row.description || '',
      shortDescription: row.shortDescription ?? undefined,
      sku: row.sku,
      slug: row.slug,
      productTypeId: row.productTypeId ?? row.type,
      categoryId: undefined,
      organizationId: row.organizationId ?? undefined,
      storeId: row.storeId ?? undefined,
      status: row.status as ProductStatus,
      visibility: row.visibility as ProductVisibility,
      primaryImageId: row.primaryImageId ?? undefined,
      externalId: row.externalId ?? undefined,
    };
  }

  private dimensionsFromRow(row: DbProduct): Dimensions {
    return Dimensions.create({
      weight: row.weight ? parseFloat(row.weight) : undefined,
      weightUnit: (row.weightUnit || 'g') as 'kg' | 'lb' | 'oz' | 'g',
      length: row.length ? parseFloat(row.length) : undefined,
      width: row.width ? parseFloat(row.width) : undefined,
      height: row.height ? parseFloat(row.height) : undefined,
      dimensionUnit: (row.dimensionUnit || 'cm') as 'cm' | 'in' | 'm' | 'mm',
    });
  }

  private productFlagsFromRow(row: DbProduct) {
    return {
      isFeatured: Boolean(row.isFeatured),
      isVirtual: Boolean(row.isVirtual),
      isDownloadable: Boolean(row.isDownloadable),
      isSubscription: Boolean(row.isSubscription),
      isTaxable: Boolean(row.isTaxable),
      isInventoryManaged:
        row.isInventoryManaged === null || row.isInventoryManaged === undefined ? undefined : Boolean(row.isInventoryManaged),
      taxClass: row.taxClass ?? undefined,
      hasVariants: Boolean(row.hasVariants),
      variantAttributes: row.variantAttributes
        ? typeof row.variantAttributes === 'string'
          ? JSON.parse(row.variantAttributes as string)
          : (row.variantAttributes as Record<string, unknown>)
        : undefined,
    };
  }

  private productMetaFromRow(row: DbProduct) {
    return {
      metaTitle: row.metaTitle ?? undefined,
      metaDescription: row.metaDescription ?? undefined,
      metaKeywords: row.metaKeywords ?? undefined,
      minOrderQuantity: row.minOrderQuantity ?? 1,
      maxOrderQuantity: row.maxOrderQuantity ?? undefined,
      returnPolicy: row.returnPolicy ?? undefined,
      warranty: row.warranty ?? undefined,
      tags: [],
      metadata: undefined,
    };
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
      inventoryPolicy:
        ((row as DbProductVariant & { inventoryPolicy?: 'tracked' | 'unlimited' | 'backorderable' }).inventoryPolicy as
          'tracked' | 'unlimited' | 'backorderable' | undefined) ?? 'tracked',
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
