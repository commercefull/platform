/**
 * Product Variant Repository Implementation
 * PostgreSQL implementation for product variants
 */

import { query, queryOne } from '../../../../libs/db';
import { ProductVariant, VariantAttribute } from '../../domain/entities/ProductVariant';
import { Price } from '../../domain/valueObjects/Price';
import { Dimensions } from '../../domain/valueObjects/Dimensions';

export interface ProductVariantFilters {
  productId?: string;
  sku?: string;
  isActive?: boolean;
  isDefault?: boolean;
  inStock?: boolean;
  attributes?: Record<string, string>;
}

export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  length: number;
}

export class ProductVariantRepository {
  async findById(variantId: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE "variantId" = $1 AND "deletedAt" IS NULL',
      [variantId]
    );

    if (!row) return null;

    const attributes = await this.getVariantAttributes(variantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 AND "deletedAt" IS NULL ORDER BY "sortOrder" ASC, "createdAt" ASC',
      [productId]
    );

    const variants: ProductVariant[] = [];
    for (const row of rows || []) {
      const attributes = await this.getVariantAttributes(row.variantId);
      variants.push(this.mapToProductVariant(row, attributes));
    }

    return variants;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE sku = $1 AND "deletedAt" IS NULL',
      [sku]
    );

    if (!row) return null;

    const attributes = await this.getVariantAttributes(row.variantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findDefaultVariant(productId: string): Promise<ProductVariant | null> {
    const row = await queryOne<Record<string, any>>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 AND "isDefault" = true AND "isActive" = true AND "deletedAt" IS NULL',
      [productId]
    );

    if (!row) return null;

    const attributes = await this.getVariantAttributes(row.variantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findAll(filters?: ProductVariantFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ProductVariant>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;
    const orderBy = pagination?.orderBy || 'createdAt';
    const orderDir = pagination?.orderDirection || 'desc';

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "productVariant" ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0');

    const rows = await query<Record<string, any>[]>(
      `SELECT * FROM "productVariant" ${whereClause}
       ORDER BY "position" ASC, "createdAt" ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    const variants: ProductVariant[] = [];
    for (const row of rows || []) {
      const attributes = await this.getVariantAttributes(row.variantId);
      variants.push(this.mapToProductVariant(row, attributes));
    }

    return {
      data: variants,
      total,
      limit,
      offset,
      hasMore: offset + variants.length < total,
      length: total
    };
  }

  async save(variant: ProductVariant): Promise<ProductVariant> {
    const now = new Date().toISOString();

    const existing = await queryOne<Record<string, any>>(
      'SELECT "variantId" FROM "productVariant" WHERE "variantId" = $1',
      [variant.variantId]
    );

    if (existing) {
      // Update existing variant
      await query(
        `UPDATE "productVariant" SET
          sku = $1, name = $2,
          "basePrice" = $3, "salePrice" = $4, cost = $5, currency = $6,
          weight = $7, "weightUnit" = $8, length = $9, width = $10, height = $11, "dimensionUnit" = $12,
          "stockQuantity" = $13, "lowStockThreshold" = $14,
          "isDefault" = $15, "isActive" = $16, position = $17, metadata = $18, "updatedAt" = $19
        WHERE "variantId" = $23`,
        [
          variant.sku,
          variant.name,
          variant.price.effectivePrice,
          variant.price.salePrice,
          variant.price.cost,
          variant.price.currency,
          variant.dimensions.weight,
          variant.dimensions.weightUnit,
          variant.dimensions.length,
          variant.dimensions.width,
          variant.dimensions.height,
          variant.dimensions.dimensionUnit,
          variant.stockQuantity,
          variant.lowStockThreshold,
          variant.isDefault,
          variant.isActive,
          variant.position,
          variant.metadata ? JSON.stringify(variant.metadata) : null,
          now,
          variant.variantId
        ]
      );
    } else {
      // Create new variant
      await query(
        `INSERT INTO "productVariant" (
          variantId, "productId", sku, name,
          "basePrice", "salePrice", cost, currency,
          weight, "weightUnit", length, width, height, "dimensionUnit",
          "stockQuantity", "lowStockThreshold",
          "isDefault", "isActive", position, metadata, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)`,
        [
          variant.variantId,
          variant.productId,
          variant.sku,
          variant.name,
          variant.price.effectivePrice,
          variant.price.salePrice,
          variant.price.cost,
          variant.price.currency,
          variant.dimensions.weight,
          variant.dimensions.weightUnit,
          variant.dimensions.length,
          variant.dimensions.width,
          variant.dimensions.height,
          variant.dimensions.dimensionUnit,
          variant.stockQuantity,
          variant.lowStockThreshold,
          variant.isDefault,
          variant.isActive,
          variant.position,
          variant.metadata ? JSON.stringify(variant.metadata) : null,
          now,
          now
        ]
      );
    }

    // Sync attributes
    await this.syncVariantAttributes(variant);

    return variant;
  }

  async delete(variantId: string): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE "productVariant" SET "deletedAt" = $1, "isActive" = false, "updatedAt" = $1 WHERE "variantId" = $2',
      [now, variantId]
    );
  }

  async updateInventory(variantId: string, quantity: number): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE "productVariant" SET "inventoryQuantity" = $1, "updatedAt" = $2 WHERE "variantId" = $3',
      [quantity, now, variantId]
    );
  }

  async adjustInventory(variantId: string, adjustment: number): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE "productVariant" SET "inventoryQuantity" = "inventoryQuantity" + $1, "updatedAt" = $2 WHERE "variantId" = $3',
      [adjustment, now, variantId]
    );
  }

  async reserveInventory(variantId: string, quantity: number): Promise<boolean> {
    const now = new Date().toISOString();

    // Check if sufficient inventory
    const row = await queryOne<Record<string, any>>(
      'SELECT "inventoryQuantity", "allowBackorders", "trackInventory" FROM "productVariant" WHERE "variantId" = $1 AND "deletedAt" IS NULL',
      [variantId]
    );

    if (!row) return false;

    const canFulfill = !row.trackInventory || row.allowBackorders || row.inventoryQuantity >= quantity;
    if (!canFulfill) return false;

    // Reserve inventory
    await query(
      'UPDATE "productVariant" SET "inventoryQuantity" = "inventoryQuantity" - $1, "updatedAt" = $2 WHERE "variantId" = $3',
      [quantity, now, variantId]
    );

    return true;
  }

  async releaseInventory(variantId: string, quantity: number): Promise<void> {
    const now = new Date().toISOString();
    await query(
      'UPDATE "productVariant" SET "inventoryQuantity" = "inventoryQuantity" + $1, "updatedAt" = $2 WHERE "variantId" = $3',
      [quantity, now, variantId]
    );
  }

  // Helper methods
  private async getVariantAttributes(variantId: string): Promise<VariantAttribute[]> {
    const rows = await query<Record<string, any>[]>(
      'SELECT * FROM "productVariantAttribute" WHERE "variantId" = $1 ORDER BY "displayOrder" ASC',
      [variantId]
    );

    return (rows || []).map(row => ({
      attributeId: row.attributeId,
      attributeName: row.attributeName,
      value: row.value,
      displayValue: row.displayValue
    }));
  }

  private async syncVariantAttributes(variant: ProductVariant): Promise<void> {
    // Remove existing attributes
    await query('DELETE FROM "productVariantAttribute" WHERE "variantId" = $1', [variant.variantId]);

    // Insert new attributes
    for (const attr of variant.attributes) {
      await query(
        `INSERT INTO "productVariantAttribute" (
          "variantId", "attributeId", "attributeName", "value", "displayValue"
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          variant.variantId,
          attr.attributeId,
          attr.attributeName,
          attr.value,
          attr.displayValue || attr.value
        ]
      );
    }
  }

  private buildWhereClause(filters?: ProductVariantFilters): { whereClause: string; params: any[] } {
    const conditions: string[] = ['"deletedAt" IS NULL'];
    const params: any[] = [];

    if (filters?.productId) {
      conditions.push('"productId" = $' + (params.length + 1));
      params.push(filters.productId);
    }

    if (filters?.sku) {
      conditions.push('sku = $' + (params.length + 1));
      params.push(filters.sku);
    }

    if (filters?.isActive !== undefined) {
      conditions.push('"isActive" = $' + (params.length + 1));
      params.push(filters.isActive);
    }

    if (filters?.isDefault !== undefined) {
      conditions.push('"isDefault" = $' + (params.length + 1));
      params.push(filters.isDefault);
    }

    if (filters?.inStock !== undefined) {
      if (filters.inStock) {
        conditions.push('("trackInventory" = false OR "allowBackorders" = true OR "inventoryQuantity" > 0)');
      } else {
        conditions.push('"trackInventory" = true AND "allowBackorders" = false AND "inventoryQuantity" <= 0');
      }
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params
    };
  }

  private mapToProductVariant(row: Record<string, any>, attributes: VariantAttribute[]): ProductVariant {
    return ProductVariant.reconstitute({
      variantId: row.variantId,
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      price: Price.create(
        parseFloat(row.basePrice),
        row.currency || 'USD',
        row.salePrice ? parseFloat(row.salePrice) : undefined,
        row.cost ? parseFloat(row.cost) : undefined
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        weightUnit: row.weightUnit,
        length: row.length ? parseFloat(row.length) : undefined,
        width: row.width ? parseFloat(row.width) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
        dimensionUnit: row.dimensionUnit
      }),
      attributes,
      imageId: row.imageId,
      imageUrl: row.imageUrl,
      stockQuantity: parseInt(row.stockQuantity || '0'),
      lowStockThreshold: parseInt(row.lowStockThreshold || '5'),
      isDefault: Boolean(row.isDefault),
      isActive: Boolean(row.isActive),
      position: parseInt(row.position || '0'),
      barcode: row.barcode,
      externalId: row.externalId,
      metadata: row.metadata ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata) : undefined,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    });
  }
}

export default new ProductVariantRepository();
