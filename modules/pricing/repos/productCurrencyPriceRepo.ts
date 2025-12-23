import { query, queryOne } from '../../../libs/db';
import { Table, ProductCurrencyPrice } from '../../../libs/db/types';
import { unixTimestamp } from '../../../libs/date';

export type ProductCurrencyPriceCreateParams = Omit<ProductCurrencyPrice, 'productCurrencyPriceId' | 'createdAt' | 'updatedAt'>;
export type ProductCurrencyPriceUpdateParams = Partial<Pick<ProductCurrencyPrice, 'price' | 'compareAtPrice' | 'isManual' | 'updatedBy'>>;

export class ProductCurrencyPriceRepo {
  /**
   * Find price by ID
   */
  async findById(productCurrencyPriceId: string): Promise<ProductCurrencyPrice | null> {
    return await queryOne<ProductCurrencyPrice>(`SELECT * FROM "${Table.ProductCurrencyPrice}" WHERE "productCurrencyPriceId" = $1`, [
      productCurrencyPriceId,
    ]);
  }

  /**
   * Find price for product in specific currency
   */
  async findByProductAndCurrency(productId: string, currencyId: string, productVariantId?: string): Promise<ProductCurrencyPrice | null> {
    if (productVariantId) {
      return await queryOne<ProductCurrencyPrice>(
        `SELECT * FROM "${Table.ProductCurrencyPrice}" 
         WHERE "productId" = $1 AND "productVariantId" = $2 AND "currencyId" = $3`,
        [productId, productVariantId, currencyId],
      );
    } else {
      return await queryOne<ProductCurrencyPrice>(
        `SELECT * FROM "${Table.ProductCurrencyPrice}" 
         WHERE "productId" = $1 AND "productVariantId" IS NULL AND "currencyId" = $2`,
        [productId, currencyId],
      );
    }
  }

  /**
   * Find all prices for product
   */
  async findByProduct(productId: string, productVariantId?: string): Promise<ProductCurrencyPrice[]> {
    if (productVariantId) {
      const results = await query<ProductCurrencyPrice[]>(
        `SELECT * FROM "${Table.ProductCurrencyPrice}" 
         WHERE "productId" = $1 AND "productVariantId" = $2
         ORDER BY "currencyId" ASC`,
        [productId, productVariantId],
      );
      return results || [];
    } else {
      const results = await query<ProductCurrencyPrice[]>(
        `SELECT * FROM "${Table.ProductCurrencyPrice}" 
         WHERE "productId" = $1 AND "productVariantId" IS NULL
         ORDER BY "currencyId" ASC`,
        [productId],
      );
      return results || [];
    }
  }

  /**
   * Find all prices for variant
   */
  async findByVariant(productVariantId: string): Promise<ProductCurrencyPrice[]> {
    const results = await query<ProductCurrencyPrice[]>(
      `SELECT * FROM "${Table.ProductCurrencyPrice}" 
       WHERE "productVariantId" = $1
       ORDER BY "currencyId" ASC`,
      [productVariantId],
    );
    return results || [];
  }

  /**
   * Find all prices in specific currency
   */
  async findByCurrency(currencyId: string, limit: number = 100, offset: number = 0): Promise<ProductCurrencyPrice[]> {
    const results = await query<ProductCurrencyPrice[]>(
      `SELECT * FROM "${Table.ProductCurrencyPrice}" 
       WHERE "currencyId" = $1
       ORDER BY "productId" ASC
       LIMIT $2 OFFSET $3`,
      [currencyId, limit, offset],
    );
    return results || [];
  }

  /**
   * Find manual prices
   */
  async findManualPrices(limit: number = 100, offset: number = 0): Promise<ProductCurrencyPrice[]> {
    const results = await query<ProductCurrencyPrice[]>(
      `SELECT * FROM "${Table.ProductCurrencyPrice}" 
       WHERE "isManual" = true
       ORDER BY "updatedAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return results || [];
  }

  /**
   * Find auto-calculated prices
   */
  async findAutoPrices(limit: number = 100, offset: number = 0): Promise<ProductCurrencyPrice[]> {
    const results = await query<ProductCurrencyPrice[]>(
      `SELECT * FROM "${Table.ProductCurrencyPrice}" 
       WHERE "isManual" = false
       ORDER BY "updatedAt" DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return results || [];
  }

  /**
   * Create currency price
   */
  async create(params: ProductCurrencyPriceCreateParams): Promise<ProductCurrencyPrice> {
    const now = unixTimestamp();

    // Check if price already exists for this combination
    const existing = await this.findByProductAndCurrency(params.productId, params.currencyId, params.productVariantId ?? undefined);

    if (existing) {
      throw new Error('Price already exists for this product/variant and currency combination');
    }

    const result = await queryOne<ProductCurrencyPrice>(
      `INSERT INTO "${Table.ProductCurrencyPrice}" (
        "productId", "productVariantId", "currencyId", "price", "compareAtPrice",
        "isManual", "updatedBy", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        params.productId,
        params.productVariantId || null,
        params.currencyId,
        params.price,
        params.compareAtPrice || null,
        params.isManual !== undefined ? params.isManual : true,
        params.updatedBy || null,
        now,
        now,
      ],
    );

    if (!result) {
      throw new Error('Failed to create product currency price');
    }

    return result;
  }

  /**
   * Upsert currency price (create or update)
   */
  async upsert(params: ProductCurrencyPriceCreateParams): Promise<ProductCurrencyPrice> {
    const existing = await this.findByProductAndCurrency(params.productId, params.currencyId, params.productVariantId ?? undefined);

    if (existing) {
      const updated = await this.update(existing.productCurrencyPriceId, {
        price: params.price,
        compareAtPrice: params.compareAtPrice,
        isManual: params.isManual,
        updatedBy: params.updatedBy,
      });

      if (!updated) {
        throw new Error('Failed to update existing price');
      }

      return updated;
    }

    return this.create(params);
  }

  /**
   * Update currency price
   */
  async update(productCurrencyPriceId: string, params: ProductCurrencyPriceUpdateParams): Promise<ProductCurrencyPrice | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`"${key}" = $${paramIndex++}`);
        values.push(value);
      }
    });

    if (updateFields.length === 0) {
      return this.findById(productCurrencyPriceId);
    }

    updateFields.push(`"updatedAt" = $${paramIndex++}`);
    values.push(unixTimestamp());
    values.push(productCurrencyPriceId);

    const result = await queryOne<ProductCurrencyPrice>(
      `UPDATE "${Table.ProductCurrencyPrice}" 
       SET ${updateFields.join(', ')}
       WHERE "productCurrencyPriceId" = $${paramIndex}
       RETURNING *`,
      values,
    );

    return result;
  }

  /**
   * Update price value
   */
  async updatePrice(productCurrencyPriceId: string, price: number, updatedBy?: string): Promise<ProductCurrencyPrice | null> {
    return this.update(productCurrencyPriceId, {
      price: price.toString(),
      isManual: true,
      updatedBy: updatedBy ?? null,
    });
  }

  /**
   * Update compare at price
   */
  async updateCompareAtPrice(productCurrencyPriceId: string, compareAtPrice: number): Promise<ProductCurrencyPrice | null> {
    return this.update(productCurrencyPriceId, { compareAtPrice: compareAtPrice.toString() });
  }

  /**
   * Mark as manual
   */
  async markAsManual(productCurrencyPriceId: string): Promise<ProductCurrencyPrice | null> {
    return this.update(productCurrencyPriceId, { isManual: true });
  }

  /**
   * Mark as auto-calculated
   */
  async markAsAuto(productCurrencyPriceId: string): Promise<ProductCurrencyPrice | null> {
    return this.update(productCurrencyPriceId, { isManual: false });
  }

  /**
   * Bulk update prices for currency (e.g., when exchange rate changes)
   */
  async bulkUpdateForCurrency(currencyId: string, priceUpdates: Array<{ productCurrencyPriceId: string; price: number }>): Promise<number> {
    const now = unixTimestamp();
    let updated = 0;

    for (const update of priceUpdates) {
      await query(
        `UPDATE "${Table.ProductCurrencyPrice}" 
         SET "price" = $1, "updatedAt" = $2, "isManual" = false
         WHERE "productCurrencyPriceId" = $3`,
        [update.price, now, update.productCurrencyPriceId],
      );
      updated++;
    }

    return updated;
  }

  /**
   * Delete currency price
   */
  async delete(productCurrencyPriceId: string): Promise<boolean> {
    const result = await queryOne<{ productCurrencyPriceId: string }>(
      `DELETE FROM "${Table.ProductCurrencyPrice}" WHERE "productCurrencyPriceId" = $1 RETURNING "productCurrencyPriceId"`,
      [productCurrencyPriceId],
    );

    return !!result;
  }

  /**
   * Delete all prices for product
   */
  async deleteByProduct(productId: string, productVariantId?: string): Promise<number> {
    let sql = `DELETE FROM "${Table.ProductCurrencyPrice}" WHERE "productId" = $1`;
    const params: any[] = [productId];

    if (productVariantId) {
      sql += ` AND "productVariantId" = $2`;
      params.push(productVariantId);
    } else {
      sql += ` AND "productVariantId" IS NULL`;
    }

    sql += ` RETURNING "productCurrencyPriceId"`;

    const results = await query<{ productCurrencyPriceId: string }[]>(sql, params);
    return results ? results.length : 0;
  }

  /**
   * Delete all prices for currency
   */
  async deleteByCurrency(currencyId: string): Promise<number> {
    const results = await query<{ productCurrencyPriceId: string }[]>(
      `DELETE FROM "${Table.ProductCurrencyPrice}" WHERE "currencyId" = $1 RETURNING "productCurrencyPriceId"`,
      [currencyId],
    );
    return results ? results.length : 0;
  }

  /**
   * Count prices
   */
  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM "${Table.ProductCurrencyPrice}"`, []);

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Count prices for product
   */
  async countByProduct(productId: string): Promise<number> {
    const result = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.ProductCurrencyPrice}" WHERE "productId" = $1`,
      [productId],
    );

    return result ? parseInt(result.count, 10) : 0;
  }

  /**
   * Get statistics
   */
  async getStatistics(): Promise<{
    total: number;
    manual: number;
    auto: number;
    byCurrency: Record<string, number>;
    withCompareAtPrice: number;
  }> {
    const total = await this.count();

    const manualResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.ProductCurrencyPrice}" WHERE "isManual" = true`,
      [],
    );
    const manual = manualResult ? parseInt(manualResult.count, 10) : 0;

    const auto = total - manual;

    const currencyResults = await query<{ currencyId: string; count: string }[]>(
      `SELECT "currencyId", COUNT(*) as count 
       FROM "${Table.ProductCurrencyPrice}" 
       GROUP BY "currencyId"`,
      [],
    );

    const byCurrency: Record<string, number> = {};
    if (currencyResults) {
      currencyResults.forEach(row => {
        byCurrency[row.currencyId] = parseInt(row.count, 10);
      });
    }

    const compareResult = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM "${Table.ProductCurrencyPrice}" WHERE "compareAtPrice" IS NOT NULL`,
      [],
    );
    const withCompareAtPrice = compareResult ? parseInt(compareResult.count, 10) : 0;

    return {
      total,
      manual,
      auto,
      byCurrency,
      withCompareAtPrice,
    };
  }

  /**
   * Get price range for currency
   */
  async getPriceRange(currencyId: string): Promise<{ min: number; max: number; avg: number }> {
    const result = await queryOne<{ min: string; max: string; avg: string }>(
      `SELECT 
        MIN("price") as min,
        MAX("price") as max,
        AVG("price") as avg
       FROM "${Table.ProductCurrencyPrice}" 
       WHERE "currencyId" = $1`,
      [currencyId],
    );

    return {
      min: result && result.min ? parseFloat(result.min) : 0,
      max: result && result.max ? parseFloat(result.max) : 0,
      avg: result && result.avg ? parseFloat(result.avg) : 0,
    };
  }
}

export default new ProductCurrencyPriceRepo();
