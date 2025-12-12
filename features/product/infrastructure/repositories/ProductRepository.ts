/**
 * Product Repository Implementation
 * PostgreSQL implementation using camelCase column names (matching migrations)
 */

import { query, queryOne } from '../../../../libs/db';
import { generateUUID } from '../../../../libs/uuid';
import { 
  ProductRepository as IProductRepository, 
  ProductFilters, 
  PaginationOptions,
  PaginatedResult 
} from '../../domain/repositories/ProductRepository';
import { Product, ProductImage } from '../../domain/entities/Product';
import { ProductVariant, VariantAttribute } from '../../domain/entities/ProductVariant';
import { ProductStatus } from '../../domain/valueObjects/ProductStatus';
import { ProductVisibility } from '../../domain/valueObjects/ProductVisibility';
import { Price } from '../../domain/valueObjects/Price';
import { Dimensions } from '../../domain/valueObjects/Dimensions';

export class ProductRepo implements IProductRepository {

  async findById(productId: string): Promise<Product | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM product WHERE "productId" = $1 AND "deletedAt" IS NULL',
      [productId]
    );
    if (!row) return null;
    const images = await this.getProductImages(productId);
    return this.mapToProduct(row, images);
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM product WHERE slug = $1 AND "deletedAt" IS NULL',
      [slug]
    );
    if (!row) return null;
    const images = await this.getProductImages(row.productId);
    return this.mapToProduct(row, images);
  }

  async findBySku(sku: string): Promise<Product | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM product WHERE sku = $1 AND "deletedAt" IS NULL',
      [sku]
    );
    if (!row) return null;
    const images = await this.getProductImages(row.productId);
    return this.mapToProduct(row, images);
  }

  async findAll(filters?: ProductFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM product ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM product ${whereClause}
       ORDER BY "${orderBy}" ${orderDir.toUpperCase()}
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const products: Product[] = [];
    for (const row of rows || []) {
      const images = await this.getProductImages(row.productId);
      products.push(this.mapToProduct(row, images));
    }

    return { data: products, total, limit, offset, hasMore: offset + products.length < total };
  }

  async save(product: Product): Promise<Product> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "productId" FROM product WHERE "productId" = $1',
      [product.productId]
    );

    if (existing) {
      await query(
        `UPDATE product SET
          name = $1, description = $2, "shortDescription" = $3, sku = $4, slug = $5,
          "brandId" = $6, type = $7, status = $8, visibility = $9, price = $10,
          "basePrice" = $11, "salePrice" = $12, "costPrice" = $13, "taxClass" = $14,
          "isTaxable" = $15, currency = $16, "isInventoryManaged" = $17,
          weight = $18, "weightUnit" = $19, length = $20, width = $21, height = $22,
          "dimensionUnit" = $23, "metaTitle" = $24, "metaDescription" = $25, "metaKeywords" = $26,
          "isFeatured" = $27, "isNew" = $28, "isBestseller" = $29, "hasVariants" = $30,
          "merchantId" = $31, "publishedAt" = $32, "updatedAt" = $33
        WHERE "productId" = $34`,
        [
          product.name, product.description, product.shortDescription, product.sku, product.slug,
          product.brandId || null, 'simple', product.status, product.visibility,
          product.price.basePrice, product.price.basePrice, product.price.salePrice,
          product.price.cost, product.taxClass || 'standard', product.isTaxable,
          product.price.currency, true, product.dimensions.weight,
          product.dimensions.weightUnit, product.dimensions.length, product.dimensions.width,
          product.dimensions.height, product.dimensions.dimensionUnit,
          product.metaTitle || null, product.metaDescription || null, product.metaKeywords || null,
          product.isFeatured, false, false, product.hasVariants,
          product.merchantId || null, product.publishedAt?.toISOString() || null, now,
          product.productId
        ]
      );
    } else {
      await query(
        `INSERT INTO product (
          "productId", name, description, "shortDescription", sku, slug,
          "brandId", type, status, visibility, price, "basePrice", "salePrice", "costPrice",
          "taxClass", "isTaxable", currency, "isInventoryManaged",
          weight, "weightUnit", length, width, height, "dimensionUnit",
          "metaTitle", "metaDescription", "metaKeywords",
          "isFeatured", "isNew", "isBestseller", "hasVariants",
          "merchantId", "publishedAt", "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35
        )`,
        [
          product.productId, product.name, product.description, product.shortDescription,
          product.sku, product.slug, product.brandId || null, 'simple',
          product.status, product.visibility, product.price.basePrice,
          product.price.basePrice, product.price.salePrice, product.price.cost,
          product.taxClass || 'standard', product.isTaxable, product.price.currency, true,
          product.dimensions.weight, product.dimensions.weightUnit,
          product.dimensions.length, product.dimensions.width, product.dimensions.height,
          product.dimensions.dimensionUnit, product.metaTitle || null,
          product.metaDescription || null, product.metaKeywords || null,
          product.isFeatured, false, false, product.hasVariants,
          product.merchantId || null, product.publishedAt?.toISOString() || null, now, now
        ]
      );
    }

    return product;
  }

  async delete(productId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE product SET "deletedAt" = $1, status = $2, "updatedAt" = $1 WHERE "productId" = $3',
      [now, ProductStatus.ARCHIVED, productId]
    );
  }

  async hardDelete(productId: string): Promise<void> {
    await query('DELETE FROM product WHERE "productId" = $1', [productId]);
  }

  async count(filters?: ProductFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM product ${whereClause}`,
      params
    );
    return parseInt(result?.count || '0');
  }

  async findByCategory(categoryId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ categoryId }, pagination);
  }

  async findByBrand(brandId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ brandId }, pagination);
  }

  async findByMerchant(merchantId: string, pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ merchantId }, pagination);
  }

  async findFeatured(pagination?: PaginationOptions): Promise<PaginatedResult<Product>> {
    return this.findAll({ isFeatured: true, status: ProductStatus.ACTIVE }, pagination);
  }

  async findRelated(productId: string, limit: number = 10): Promise<Product[]> {
    const product = await this.findById(productId);
    if (!product?.categoryId) return [];

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM product 
       WHERE "brandId" = $1 AND "productId" != $2 AND "deletedAt" IS NULL 
       AND status = $3 AND visibility IN ($4, $5)
       ORDER BY "isFeatured" DESC, RANDOM() LIMIT $6`,
      [product.brandId, productId, ProductStatus.ACTIVE, ProductVisibility.VISIBLE, ProductVisibility.FEATURED, limit]
    );

    const products: Product[] = [];
    for (const row of rows || []) {
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
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 ORDER BY "sortOrder" ASC',
      [productId]
    );
    return (rows || []).map(row => this.mapToVariant(row));
  }

  async findVariantById(variantId: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE "productVariantId" = $1',
      [variantId]
    );
    return row ? this.mapToVariant(row) : null;
  }

  async findVariantBySku(sku: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE sku = $1',
      [sku]
    );
    return row ? this.mapToVariant(row) : null;
  }

  async saveVariant(variant: ProductVariant): Promise<ProductVariant> {
    const now = new Date().toISOString();
    
    const existing = await queryOne<Record<string, any>>(
      'SELECT "productVariantId" FROM "productVariant" WHERE "productVariantId" = $1',
      [variant.variantId]
    );

    if (existing) {
      await query(
        `UPDATE "productVariant" SET
          sku = $1, name = $2, price = $3, "compareAtPrice" = $4,
          weight = $5, "weightUnit" = $6, "isDefault" = $7, "isActive" = $8,
          "sortOrder" = $9, barcode = $10, "updatedAt" = $11
        WHERE "productVariantId" = $12`,
        [
          variant.sku, variant.name, variant.price.basePrice, variant.price.salePrice,
          variant.dimensions.weight, variant.dimensions.weightUnit,
          variant.isDefault, variant.isActive, variant.position,
          variant.barcode, now, variant.variantId
        ]
      );
    } else {
      await query(
        `INSERT INTO "productVariant" (
          "productVariantId", "productId", sku, name, price, "compareAtPrice",
          weight, "weightUnit", "isDefault", "isActive", "sortOrder", barcode,
          "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
          variant.variantId, variant.productId, variant.sku, variant.name,
          variant.price.basePrice, variant.price.salePrice,
          variant.dimensions.weight, variant.dimensions.weightUnit,
          variant.isDefault, variant.isActive, variant.position, variant.barcode, now, now
        ]
      );
    }

    return variant;
  }

  async deleteVariant(variantId: string): Promise<void> {
    await query('DELETE FROM "productVariant" WHERE "productVariantId" = $1', [variantId]);
  }

  async getDefaultVariant(productId: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 AND "isDefault" = true',
      [productId]
    );
    return row ? this.mapToVariant(row) : null;
  }

  // Image methods
  async getProductImages(productId: string): Promise<ProductImage[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "productImage" WHERE "productId" = $1 ORDER BY "sortOrder" ASC',
      [productId]
    );
    return (rows || []).map(row => ({
      imageId: row.productImageId,
      url: row.url,
      altText: row.altText,
      position: row.sortOrder,
      isPrimary: Boolean(row.isPrimary)
    }));
  }

  async addProductImage(productId: string, image: ProductImage): Promise<void> {
    const now = new Date().toISOString();
    await query(
      `INSERT INTO "productImage" ("productImageId", "productId", url, "altText", "sortOrder", "isPrimary", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [image.imageId, productId, image.url, image.altText, image.position, image.isPrimary, now, now]
    );
  }

  async updateProductImage(imageId: string, updates: { altText?: string; position?: number; isPrimary?: boolean }): Promise<void> {
    const setClauses: string[] = ['"updatedAt" = $1'];
    const params: any[] = [new Date().toISOString()];
    let paramIndex = 2;

    if (updates.altText !== undefined) {
      setClauses.push(`"altText" = $${paramIndex++}`);
      params.push(updates.altText);
    }
    if (updates.position !== undefined) {
      setClauses.push(`"sortOrder" = $${paramIndex++}`);
      params.push(updates.position);
    }
    if (updates.isPrimary !== undefined) {
      setClauses.push(`"isPrimary" = $${paramIndex++}`);
      params.push(updates.isPrimary);
    }

    params.push(imageId);
    await query(
      `UPDATE "productImage" SET ${setClauses.join(', ')} WHERE "productImageId" = $${paramIndex}`,
      params
    );
  }

  async deleteProductImage(imageId: string): Promise<void> {
    await query('DELETE FROM "productImage" WHERE "productImageId" = $1', [imageId]);
  }

  async reorderProductImages(productId: string, imageIds: string[]): Promise<void> {
    for (let i = 0; i < imageIds.length; i++) {
      await query(
        'UPDATE "productImage" SET "sortOrder" = $1, "updatedAt" = $2 WHERE "productImageId" = $3 AND "productId" = $4',
        [i, new Date().toISOString(), imageIds[i], productId]
      );
    }
  }

  // Private helper methods
  private buildWhereClause(filters?: ProductFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: any[] = [];
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
      conditions.push(`"brandId" = $${paramIndex++}`);
      params.push(filters.categoryId);
    }
    if (filters?.brandId) {
      conditions.push(`"brandId" = $${paramIndex++}`);
      params.push(filters.brandId);
    }
    if (filters?.merchantId) {
      conditions.push(`"merchantId" = $${paramIndex++}`);
      params.push(filters.merchantId);
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
      conditions.push(`(name ILIKE $${paramIndex} OR description ILIKE $${paramIndex} OR sku ILIKE $${paramIndex})`);
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private mapToProduct(row: Record<string, any>, images: ProductImage[]): Product {
    const currency = row.currency || 'USD';
    
    return Product.reconstitute({
      productId: row.productId,
      name: row.name,
      description: row.description || '',
      shortDescription: row.shortDescription,
      sku: row.sku,
      slug: row.slug,
      productTypeId: row.type,
      categoryId: row.brandId,
      brandId: row.brandId,
      merchantId: row.merchantId,
      status: row.status as ProductStatus,
      visibility: row.visibility as ProductVisibility,
      price: Price.create(
        parseFloat(row.price || row.basePrice || 0),
        currency,
        row.salePrice ? parseFloat(row.salePrice) : undefined,
        row.costPrice ? parseFloat(row.costPrice) : undefined
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        weightUnit: row.weightUnit || 'g',
        length: row.length ? parseFloat(row.length) : undefined,
        width: row.width ? parseFloat(row.width) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        dimensionUnit: row.dimensionUnit || 'cm'
      }),
      isFeatured: Boolean(row.isFeatured),
      isVirtual: Boolean(row.isVirtual),
      isDownloadable: Boolean(row.isDownloadable),
      isSubscription: Boolean(row.isSubscription),
      isTaxable: Boolean(row.isTaxable),
      taxClass: row.taxClass,
      hasVariants: Boolean(row.hasVariants),
      variantAttributes: row.variantAttributes ? 
        (typeof row.variantAttributes === 'string' ? JSON.parse(row.variantAttributes) : row.variantAttributes) : undefined,
      images,
      primaryImageId: row.primaryImageId,
      metaTitle: row.metaTitle,
      metaDescription: row.metaDescription,
      metaKeywords: row.metaKeywords,
      minOrderQuantity: parseInt(row.minOrderQuantity || 1),
      maxOrderQuantity: row.maxOrderQuantity ? parseInt(row.maxOrderQuantity) : undefined,
      returnPolicy: row.returnPolicy,
      warranty: row.warranty,
      externalId: row.externalId,
      tags: row.tags ? (typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags) : [],
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      publishedAt: row.publishedAt ? new Date(row.publishedAt) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
      deletedAt: row.deletedAt ? new Date(row.deletedAt) : undefined
    });
  }

  private mapToVariant(row: Record<string, any>): ProductVariant {
    const currency = 'USD';
    
    return ProductVariant.reconstitute({
      variantId: row.productVariantId,
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      price: Price.create(
        parseFloat(row.price || 0),
        currency,
        row.compareAtPrice ? parseFloat(row.compareAtPrice) : undefined,
        undefined
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        weightUnit: row.weightUnit || 'g',
        length: undefined,
        width: undefined,
        height: undefined,
        dimensionUnit: 'cm'
      }),
      attributes: row.attributes ? (typeof row.attributes === 'string' ? JSON.parse(row.attributes) : row.attributes) : [],
      imageId: row.imageId,
      imageUrl: row.imageUrl,
      stockQuantity: parseInt(row.stockQuantity || 0),
      lowStockThreshold: parseInt(row.lowStockThreshold || 5),
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      position: parseInt(row.sortOrder || 0),
      barcode: row.barcode,
      externalId: row.externalId,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new ProductRepo();
