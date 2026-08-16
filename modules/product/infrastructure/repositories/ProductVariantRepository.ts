/**
 * Product Variant Repository Implementation
 * PostgreSQL implementation for product variants
 */

import { query, queryOne } from '../../../../libs/db';
import { ProductVariant, VariantAttribute } from '../../domain/entities/ProductVariant';
import { Price } from '../../domain/valueObjects/Price';
import { Dimensions } from '../../domain/valueObjects/Dimensions';
import { ProductVariant as DbProductVariant } from '../../../../libs/db/types';
import { PaginationOptions, PaginatedResult } from 'libs/types/shared';

interface VariantAttributeRow {
  attributeId: string;
  attributeName: string;
  value: string;
  displayValue: string | null;
}

export interface ProductVariantFilters {
  productId?: string;
  sku?: string;
  isActive?: boolean;
  isDefault?: boolean;
  inStock?: boolean;
  attributes?: Record<string, string>;
}

export class ProductVariantRepository {
  async findById(variantId: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE "productVariantId" = $1', [
      variantId,
    ]);

    if (!row) return null;

    const attributes = await this.getVariantAttributes(row.productVariantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findByProductId(productId: string): Promise<ProductVariant[]> {
    const rows = await query<DbProductVariant[]>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 ORDER BY "position" ASC, "createdAt" ASC',
      [productId],
    );

    const variants: ProductVariant[] = [];
    for (const row of rows || []) {
      const attributes = await this.getVariantAttributes(row.productVariantId);
      variants.push(this.mapToProductVariant(row, attributes));
    }

    return variants;
  }

  async findBySku(sku: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>('SELECT * FROM "productVariant" WHERE sku = $1', [sku]);

    if (!row) return null;

    const attributes = await this.getVariantAttributes(row.productVariantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findDefaultVariant(productId: string): Promise<ProductVariant | null> {
    const row = await queryOne<DbProductVariant>(
      'SELECT * FROM "productVariant" WHERE "productId" = $1 AND "isDefault" = true AND status = \'active\'',
      [productId],
    );

    if (!row) return null;

    const attributes = await this.getVariantAttributes(row.productVariantId);

    return this.mapToProductVariant(row, attributes);
  }

  async findAll(filters?: ProductVariantFilters, pagination?: PaginationOptions): Promise<PaginatedResult<ProductVariant>> {
    const limit = pagination?.limit || 20;
    const offset = pagination?.offset || 0;

    const { whereClause, params } = this.buildWhereClause(filters);

    const countResult = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "productVariant" ${whereClause}`, params);
    const total = parseInt(countResult?.count || '0');

    const rows = await query<DbProductVariant[]>(
      `SELECT * FROM "productVariant" ${whereClause}
       ORDER BY "position" ASC, "createdAt" ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset],
    );

    const variants: ProductVariant[] = [];
    for (const row of rows || []) {
      const attributes = await this.getVariantAttributes(row.productVariantId);
      variants.push(this.mapToProductVariant(row, attributes));
    }

    return {
      data: variants,
      total,
      limit,
      offset,
      hasMore: offset + variants.length < total,
      length: total,
    };
  }

  async save(variant: ProductVariant): Promise<ProductVariant> {
    const now = new Date().toISOString();

    const existing = await queryOne<{ productVariantId: string }>('SELECT "productVariantId" FROM "productVariant" WHERE "productVariantId" = $1', [
      variant.variantId,
    ]);

    if (existing) {
      await query(
        `UPDATE "productVariant" SET
          sku = $1, name = $2,
          price = $3, "salePrice" = $4, "costPrice" = $5, "compareAtPrice" = $6,
          weight = $7, length = $8, width = $9, height = $10,
          "isDefault" = $11, status = $12, position = $13,
          "optionValues" = $14, barcode = $15, mpn = $16, "updatedAt" = $17
        WHERE "productVariantId" = $18`,
        [
          variant.sku,
          variant.name,
          String(variant.price.effectivePrice),
          variant.price.salePrice ? String(variant.price.salePrice) : null,
          variant.price.cost ? String(variant.price.cost) : null,
          null,
          variant.dimensions.weight ? String(variant.dimensions.weight) : null,
          variant.dimensions.length ? String(variant.dimensions.length) : null,
          variant.dimensions.width ? String(variant.dimensions.width) : null,
          variant.dimensions.height ? String(variant.dimensions.height) : null,
          variant.isDefault,
          variant.isActive ? 'active' : 'inactive',
          variant.position,
          {},
          variant.barcode ?? null,
          null,
          now,
          variant.variantId,
        ],
      );
    } else {
      await query(
        `INSERT INTO "productVariant" (
          "productVariantId", "productId", sku, name,
          price, "salePrice", "costPrice", "compareAtPrice",
          weight, length, width, height,
          "isDefault", status, position, "optionValues", barcode, mpn, "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)`,
        [
          variant.variantId,
          variant.productId,
          variant.sku,
          variant.name,
          String(variant.price.effectivePrice),
          variant.price.salePrice ? String(variant.price.salePrice) : null,
          variant.price.cost ? String(variant.price.cost) : null,
          null,
          variant.dimensions.weight ? String(variant.dimensions.weight) : null,
          variant.dimensions.length ? String(variant.dimensions.length) : null,
          variant.dimensions.width ? String(variant.dimensions.width) : null,
          variant.dimensions.height ? String(variant.dimensions.height) : null,
          variant.isDefault,
          variant.isActive ? 'active' : 'inactive',
          variant.position,
          {},
          variant.barcode ?? null,
          null,
          now,
          now,
        ],
      );
    }

    // Sync attributes
    await this.syncVariantAttributes(variant);

    return variant;
  }

  async delete(variantId: string): Promise<void> {
    const now = new Date().toISOString();
    await query('UPDATE "productVariant" SET status = \'archived\', "updatedAt" = $1 WHERE "productVariantId" = $2', [
      now,
      variantId,
    ]);
  }

  // Helper methods
  private async getVariantAttributes(variantId: string): Promise<VariantAttribute[]> {
    const rows = await query<VariantAttributeRow[]>(
      'SELECT * FROM "productVariantAttribute" WHERE "variantId" = $1 ORDER BY "displayOrder" ASC',
      [variantId],
    );

    return (rows || []).map(row => ({
      attributeId: row.attributeId,
      attributeName: row.attributeName,
      value: row.value,
      displayValue: row.displayValue ?? undefined,
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
        [variant.variantId, attr.attributeId, attr.attributeName, attr.value, attr.displayValue || attr.value],
      );
    }
  }

  private buildWhereClause(filters?: ProductVariantFilters): { whereClause: string; params: unknown[] } {
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.productId) {
      conditions.push('"productId" = $' + (params.length + 1));
      params.push(filters.productId);
    }

    if (filters?.sku) {
      conditions.push('sku = $' + (params.length + 1));
      params.push(filters.sku);
    }

    if (filters?.isActive !== undefined) {
      conditions.push('status = $' + (params.length + 1));
      params.push(filters.isActive ? 'active' : 'inactive');
    }

    if (filters?.isDefault !== undefined) {
      conditions.push('"isDefault" = $' + (params.length + 1));
      params.push(filters.isDefault);
    }

    return {
      whereClause: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '',
      params,
    };
  }

  private mapToProductVariant(row: DbProductVariant, attributes: VariantAttribute[]): ProductVariant {
    return ProductVariant.reconstitute({
      variantId: row.productVariantId,
      productId: row.productId,
      sku: row.sku,
      name: row.name ?? '',
      price: Price.create(
        row.price ? parseFloat(row.price) : 0,
        'USD',
        row.salePrice ? parseFloat(row.salePrice) : undefined,
        row.costPrice ? parseFloat(row.costPrice) : undefined,
      ),
      dimensions: Dimensions.create({
        weight: row.weight ? parseFloat(row.weight) : undefined,
        length: row.length ? parseFloat(row.length) : undefined,
        width: row.width ? parseFloat(row.width) : undefined,
        height: row.height ? parseFloat(row.height) : undefined,
      }),
      attributes,
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

export default new ProductVariantRepository();
