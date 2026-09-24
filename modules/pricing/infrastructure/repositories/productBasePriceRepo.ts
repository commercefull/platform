/**
 * ProductBasePrice Repository
 *
 * Table: productBasePrice — pricing-owned catalog base prices.
 * One row per (productId, productVariantId, currencyCode); a NULL
 * productVariantId marks the product-level row. Monetary columns are
 * bigint cents — pg returns them as strings, so rows are mapped to
 * numbers here.
 */

import { query, queryOne } from '../../../../libs/db';
import { Table, ProductBasePrice as DbProductBasePrice } from '../../../../libs/db/types';
import type { ProductBasePrice, ProductBasePriceCreateProps, ProductBasePriceUpdateProps } from '../../domain/catalogPrice';

function mapRow(row: DbProductBasePrice): ProductBasePrice {
  return {
    productBasePriceId: row.productBasePriceId,
    productId: row.productId,
    productVariantId: row.productVariantId,
    currencyCode: row.currencyCode,
    priceCents: Number(row.priceCents),
    salePriceCents: row.salePriceCents == null ? null : Number(row.salePriceCents),
    compareAtPriceCents: row.compareAtPriceCents == null ? null : Number(row.compareAtPriceCents),
    costPriceCents: row.costPriceCents == null ? null : Number(row.costPriceCents),
    taxRate: row.taxRate == null ? null : parseFloat(row.taxRate),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class ProductBasePriceRepo {
  private readonly tableName = Table.ProductBasePrice;

  /**
   * Resolve the effective base price for a product/variant in a currency.
   * Variant-level row wins; falls back to the product-level row.
   */
  async findEffective(productId: string, productVariantId?: string, currencyCode?: string): Promise<ProductBasePrice | null> {
    if (productVariantId) {
      const variantRow = await queryOne<DbProductBasePrice>(
        `SELECT * FROM "${this.tableName}"
         WHERE "productVariantId" = $1 ${currencyCode ? 'AND "currencyCode" = $2' : ''}
         ORDER BY "currencyCode" ASC
         LIMIT 1`,
        currencyCode ? [productVariantId, currencyCode] : [productVariantId],
      );
      if (variantRow) return mapRow(variantRow);
    }

    const row = await queryOne<DbProductBasePrice>(
      `SELECT * FROM "${this.tableName}"
       WHERE "productId" = $1 AND "productVariantId" IS NULL ${currencyCode ? 'AND "currencyCode" = $2' : ''}
       ORDER BY "currencyCode" ASC
       LIMIT 1`,
      currencyCode ? [productId, currencyCode] : [productId],
    );
    return row ? mapRow(row) : null;
  }

  /**
   * All product-level base prices for a set of products, in one currency.
   * Used for list enrichment.
   */
  async findForProducts(productIds: string[], currencyCode?: string): Promise<ProductBasePrice[]> {
    if (productIds.length === 0) return [];
    const rows = await query<DbProductBasePrice[]>(
      `SELECT * FROM "${this.tableName}"
       WHERE "productId" = ANY($1) AND "productVariantId" IS NULL
         ${currencyCode ? `AND "currencyCode" = $2` : ''}
       ORDER BY "productId", "currencyCode"`,
      currencyCode ? [productIds, currencyCode] : [productIds],
    );
    return (rows || []).map(mapRow);
  }

  async findForProduct(productId: string): Promise<ProductBasePrice[]> {
    const rows = await query<DbProductBasePrice[]>(
      `SELECT * FROM "${this.tableName}" WHERE "productId" = $1 ORDER BY "productVariantId" NULLS FIRST, "currencyCode"`,
      [productId],
    );
    return (rows || []).map(mapRow);
  }

  async upsert(params: ProductBasePriceCreateProps): Promise<ProductBasePrice> {
    const row = await queryOne<DbProductBasePrice>(
      `INSERT INTO "${this.tableName}"
         ("productId", "productVariantId", "currencyCode", "priceCents", "salePriceCents", "compareAtPriceCents", "costPriceCents", "taxRate")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT ("productId", "productVariantId", "currencyCode")
       DO UPDATE SET
         "priceCents" = EXCLUDED."priceCents",
         "salePriceCents" = EXCLUDED."salePriceCents",
         "compareAtPriceCents" = EXCLUDED."compareAtPriceCents",
         "costPriceCents" = EXCLUDED."costPriceCents",
         "taxRate" = EXCLUDED."taxRate",
         "updatedAt" = now()
       RETURNING *`,
      [
        params.productId,
        params.productVariantId ?? null,
        params.currencyCode,
        params.priceCents,
        params.salePriceCents ?? null,
        params.compareAtPriceCents ?? null,
        params.costPriceCents ?? null,
        params.taxRate ?? null,
      ],
    );
    return mapRow(row!);
  }

  async update(productBasePriceId: string, params: ProductBasePriceUpdateProps): Promise<ProductBasePrice | null> {
    const fields: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        fields.push(`"${key}" = $${i++}`);
        values.push(value);
      }
    }
    if (fields.length === 0) {
      const row = await queryOne<DbProductBasePrice>(`SELECT * FROM "${this.tableName}" WHERE "productBasePriceId" = $1`, [productBasePriceId]);
      return row ? mapRow(row) : null;
    }

    fields.push(`"updatedAt" = now()`);
    values.push(productBasePriceId);
    const row = await queryOne<DbProductBasePrice>(
      `UPDATE "${this.tableName}" SET ${fields.join(', ')} WHERE "productBasePriceId" = $${i} RETURNING *`,
      values,
    );
    return row ? mapRow(row) : null;
  }

  async deleteByProduct(productId: string): Promise<void> {
    await query(`DELETE FROM "${this.tableName}" WHERE "productId" = $1`, [productId]);
  }
}

export default new ProductBasePriceRepo();
